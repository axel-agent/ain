// Copyright (c) DeFi Blockchain Developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

#include <dfi/balances.h>
#include <test/setup_common.h>

#include <boost/test/unit_test.hpp>

#include <limits>

// Overflow-sum tests (the SumAllTransfers() bug itself). Calls the production SumAllTransfersChecked()
// (src/dfi/balances.h, used by consensus/accounts.cpp and consensus/poolpairs.cpp from DF25Height on)
// and compares it against the consensus-frozen legacy SumAllTransfersLegacy().
BOOST_FIXTURE_TEST_SUITE(overflow_sum_tests, BasicTestingSetup)

namespace {
const DCT_ID DFI{};
const DCT_ID DUSD_LIKE{1};

Res CheckedSum(const CAccounts &to, CBalances &sum) {
    const auto res = SumAllTransfersChecked(to);
    if (!res) {
        return res;
    }
    sum = *res.val;
    return Res::Ok();
}
}  // namespace

// Mirrors the two exploit txs: INT64_MAX to one destination plus 1 Sat to another. Legacy sum
// silently stays at INT64_MAX (source debited far too little), checked sum rejects.
BOOST_AUTO_TEST_CASE(overflow_two_destinations_legacy_swallows_checked_rejects)
{
    const CAmount max = std::numeric_limits<CAmount>::max();
    CAccounts to;
    to[CScript(1)].Add({DFI, max});
    to[CScript(2)].Add({DFI, 1});

    const CBalances legacy = SumAllTransfersLegacy(to);
    BOOST_CHECK_EQUAL(legacy.balances.at(DFI), max);  // the bug: true sum is max + 1

    CBalances checked;
    BOOST_CHECK(!CheckedSum(to, checked).ok);
}

// Multi-token case: the legacy AddBalances aborts at the first failing token of a destination, so
// LATER tokens of that destination drop out of the sum and could be minted too.
BOOST_AUTO_TEST_CASE(overflow_on_first_token_drops_later_tokens_in_legacy_sum)
{
    const CAmount max = std::numeric_limits<CAmount>::max();
    CAccounts to;
    to[CScript(1)].Add({DFI, max});
    to[CScript(1)].Add({DUSD_LIKE, 5});
    to[CScript(2)].Add({DFI, 1});          // overflows DFI
    to[CScript(2)].Add({DUSD_LIKE, 5});    // legacy never adds this

    const CBalances legacy = SumAllTransfersLegacy(to);
    BOOST_CHECK_EQUAL(legacy.balances.at(DUSD_LIKE), 5);  // the bug: true sum is 10

    CBalances checked;
    BOOST_CHECK(!CheckedSum(to, checked).ok);
}

// Overflow only in a non-DFI token must be caught as well.
BOOST_AUTO_TEST_CASE(overflow_in_non_dfi_token_is_rejected)
{
    const CAmount max = std::numeric_limits<CAmount>::max();
    CAccounts to;
    to[CScript(1)].Add({DUSD_LIKE, max});
    to[CScript(2)].Add({DUSD_LIKE, 1});

    CBalances checked;
    BOOST_CHECK(!CheckedSum(to, checked).ok);
}

// Normal transfers stay untouched: checked sum equals legacy sum when nothing overflows.
BOOST_AUTO_TEST_CASE(no_overflow_checked_equals_legacy)
{
    CAccounts to;
    to[CScript(1)].Add({DFI, 1000});
    to[CScript(1)].Add({DUSD_LIKE, 7});
    to[CScript(2)].Add({DFI, 2500});
    to[CScript(3)].Add({DUSD_LIKE, 3});

    CBalances checked;
    BOOST_CHECK(CheckedSum(to, checked).ok);
    BOOST_CHECK(checked == SumAllTransfersLegacy(to));
    BOOST_CHECK_EQUAL(checked.balances.at(DFI), 3500);
    BOOST_CHECK_EQUAL(checked.balances.at(DUSD_LIKE), 10);
}

// Failed attempt seen in block 6,565,374: the same recipient twice. CAccounts is a map, so the
// second entry is dropped at parse time and only the first counts -- harmless, but pinned here.
BOOST_AUTO_TEST_CASE(duplicate_recipient_keeps_first_entry)
{
    CAccounts to;
    CBalances first, second;
    first.Add({DFI, 100});
    second.Add({DFI, 999});
    to.emplace(CScript(1), first);
    to.emplace(CScript(1), second);

    BOOST_CHECK_EQUAL(to.size(), 1U);
    CBalances checked;
    BOOST_CHECK(CheckedSum(to, checked).ok);
    BOOST_CHECK_EQUAL(checked.balances.at(DFI), 100);
}

BOOST_AUTO_TEST_SUITE_END()
