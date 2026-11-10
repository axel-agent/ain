// Copyright (c) DeFi Blockchain Developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

#include <chainparams.h>
#include <chainparamsbase.h>
#include <consensus/params.h>
#include <test/setup_common.h>
#include <validation.h>
#include <versionbits.h>

#include <boost/test/unit_test.hpp>

#include <limits>

// Pure checks of the v3.2 header signal (Consensus::Params::DF25_SIGNAL_BIT). The behaviour of
// a running node (miner sets the bit, ContextualCheckBlockHeader demands it) is covered by the
// regtest feature_overflow_exploit_versiongate.py and feature_overflow_exploit_oldnode.py.
BOOST_FIXTURE_TEST_SUITE(df25_version_gate_tests, BasicTestingSetup)

namespace {
Consensus::Params ParamsWithHeight(int df25Height) {
    Consensus::Params p = Params().GetConsensus();  // regtest (BasicTestingSetup)
    p.DF25Height = df25Height;
    return p;
}
}  // namespace

BOOST_AUTO_TEST_CASE(mask_matches_bit_and_keeps_version_bits_top_bits)
{
    BOOST_CHECK_EQUAL(Consensus::Params::DF25_SIGNAL_MASK, int32_t{1} << Consensus::Params::DF25_SIGNAL_BIT);
    BOOST_CHECK_EQUAL(Consensus::Params::DF25_SIGNAL_BIT, 24);
    // Inside the BIP9 range: old nodes read it as an unknown deployment signal, not as a new header format.
    BOOST_CHECK(Consensus::Params::DF25_SIGNAL_BIT < VERSIONBITS_NUM_BITS);
    const int32_t signalled = VERSIONBITS_TOP_BITS | Consensus::Params::DF25_SIGNAL_MASK;
    BOOST_CHECK_EQUAL(signalled & VERSIONBITS_TOP_MASK, VERSIONBITS_TOP_BITS);
    BOOST_CHECK(signalled > VERSIONBITS_LAST_OLD_BLOCK_VERSION);
}

// The bit may not be claimed by any BIP9 deployment on any network (it would be read as that deployment's vote).
BOOST_AUTO_TEST_CASE(bit_is_free_on_every_network)
{
    for (const auto &network : {CBaseChainParams::MAIN, CBaseChainParams::TESTNET, CBaseChainParams::CHANGI,
                                CBaseChainParams::DEVNET, CBaseChainParams::REGTEST}) {
        const auto params = CreateChainParams(network);
        for (int i = 0; i < static_cast<int>(Consensus::MAX_VERSION_BITS_DEPLOYMENTS); ++i) {
            BOOST_CHECK_MESSAGE(params->GetConsensus().vDeployments[i].bit != Consensus::Params::DF25_SIGNAL_BIT,
                                network << ": deployment " << i << " uses the DF25 signal bit");
        }
    }
}

BOOST_AUTO_TEST_CASE(signals_df25)
{
    BOOST_CHECK(!Consensus::Params::SignalsDF25(VERSIONBITS_TOP_BITS));
    BOOST_CHECK(!Consensus::Params::SignalsDF25(4));
    BOOST_CHECK(Consensus::Params::SignalsDF25(VERSIONBITS_TOP_BITS | Consensus::Params::DF25_SIGNAL_MASK));
    // Other bits do not count.
    BOOST_CHECK(!Consensus::Params::SignalsDF25(VERSIONBITS_TOP_BITS | (int32_t{1} << 28)));
}

BOOST_AUTO_TEST_CASE(with_df25_signal_is_height_gated_and_idempotent)
{
    const auto p = ParamsWithHeight(300);
    BOOST_CHECK_EQUAL(p.WithDF25Signal(VERSIONBITS_TOP_BITS, 299), VERSIONBITS_TOP_BITS);
    BOOST_CHECK_EQUAL(p.WithDF25Signal(VERSIONBITS_TOP_BITS, 300),
                      VERSIONBITS_TOP_BITS | Consensus::Params::DF25_SIGNAL_MASK);
    BOOST_CHECK_EQUAL(p.WithDF25Signal(VERSIONBITS_TOP_BITS, 1000000),
                      VERSIONBITS_TOP_BITS | Consensus::Params::DF25_SIGNAL_MASK);
    // Deployment bits that are already set survive, and setting twice changes nothing.
    const int32_t withDummy = VERSIONBITS_TOP_BITS | (int32_t{1} << 28);
    const int32_t once = p.WithDF25Signal(withDummy, 300);
    BOOST_CHECK_EQUAL(once, withDummy | Consensus::Params::DF25_SIGNAL_MASK);
    BOOST_CHECK_EQUAL(p.WithDF25Signal(once, 301), once);
}

BOOST_AUTO_TEST_CASE(header_rule_only_from_df25_height_on)
{
    const auto p = ParamsWithHeight(300);
    const int32_t plain = VERSIONBITS_TOP_BITS;
    const int32_t signalled = VERSIONBITS_TOP_BITS | Consensus::Params::DF25_SIGNAL_MASK;

    // Below the height both are fine: history without the bit stays valid, early signalling is allowed.
    BOOST_CHECK(p.HeaderSignalAcceptable(plain, 1));
    BOOST_CHECK(p.HeaderSignalAcceptable(plain, 299));
    BOOST_CHECK(p.HeaderSignalAcceptable(signalled, 299));
    // From the height on the bit is mandatory.
    BOOST_CHECK(!p.HeaderSignalAcceptable(plain, 300));
    BOOST_CHECK(!p.HeaderSignalAcceptable(plain, 301));
    BOOST_CHECK(p.HeaderSignalAcceptable(signalled, 300));
    BOOST_CHECK(p.HeaderSignalAcceptable(signalled, 301));
    // Legacy versions 1..4 are no exception.
    BOOST_CHECK(!p.HeaderSignalAcceptable(4, 300));
}

// Mainnet and testnet keep DF25Height pending (INT_MAX): the rule is inert until a height is chosen.
BOOST_AUTO_TEST_CASE(inert_while_height_is_pending)
{
    for (const auto &network : {CBaseChainParams::MAIN, CBaseChainParams::TESTNET}) {
        const auto params = CreateChainParams(network);
        const auto &c = params->GetConsensus();
        BOOST_CHECK_EQUAL(c.DF25Height, std::numeric_limits<int>::max());
        BOOST_CHECK(c.HeaderSignalAcceptable(VERSIONBITS_TOP_BITS, 6564035));
        BOOST_CHECK(c.HeaderSignalAcceptable(VERSIONBITS_TOP_BITS, std::numeric_limits<int>::max() - 1));
        BOOST_CHECK_EQUAL(c.WithDF25Signal(VERSIONBITS_TOP_BITS, 6564035), VERSIONBITS_TOP_BITS);
    }
}

// ComputeBlockVersion without a chain (genesis successor) on regtest: far-future DF25Height, no bit.
BOOST_AUTO_TEST_CASE(compute_block_version_without_chain_has_no_signal)
{
    const auto &c = Params().GetConsensus();
    BOOST_REQUIRE(c.DF25Height > 1);
    const int32_t v = ComputeBlockVersion(nullptr, c);
    BOOST_CHECK(!Consensus::Params::SignalsDF25(v));
    BOOST_CHECK_EQUAL(v & VERSIONBITS_TOP_MASK, VERSIONBITS_TOP_BITS);
}

BOOST_AUTO_TEST_SUITE_END()
