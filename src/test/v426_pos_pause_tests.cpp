// Copyright (c) DeFi Blockchain Developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

// Rollback via v4.2.6, question (c), mainnet parameters: what does a pause of 8 days between
// block 6564034 and the next block do to the PoS difficulty and to the stake weight?
// Regtest has no retargeting (fNoRetargeting), so the functional test feature_v426_pos_pause.py
// cannot show it; this suite evaluates the mainnet consensus parameters directly.

#include <arith_uint256.h>
#include <chain.h>
#include <chainparams.h>
#include <pos.h>
#include <pos_kernel.h>

#include <test/setup_common.h>

#include <boost/test/unit_test.hpp>

#include <vector>

BOOST_FIXTURE_TEST_SUITE(v426_pos_pause_tests, BasicTestingSetup)

static constexpr int64_t PAUSE = 8 * 24 * 60 * 60;
static constexpr int ROLLBACK_TIP = 6564034;

// Mainnet chain [first, last] with 30 s spacing and a pause of PAUSE seconds after pauseAfter.
static void BuildChain(std::vector<CBlockIndex> &chain, int first, int last, int pauseAfter, uint32_t nBits)
{
    chain.clear();
    chain.resize(last - first + 1);
    uint32_t time = 1762000000;  // Nov 2025, any value in range
    for (int h = first; h <= last; ++h) {
        auto &idx = chain[h - first];
        idx.nHeight = h;
        idx.nBits = nBits;
        idx.nTime = time;
        idx.pprev = h == first ? nullptr : &chain[h - first - 1];
        time += (h == pauseAfter) ? PAUSE : 30;
    }
}

BOOST_AUTO_TEST_CASE(mainnet_difficulty_after_eight_day_pause)
{
    const auto &consensus = Params().GetConsensus();
    const auto &pos = consensus.pos;
    const int interval = pos.DifficultyAdjustmentIntervalV2();
    BOOST_CHECK_EQUAL(interval, 1008);
    BOOST_CHECK(!pos.fNoRetargeting);
    BOOST_CHECK(!pos.fAllowMinDifficultyBlocks);

    // Next retarget boundary after the rollback tip.
    int boundary = ROLLBACK_TIP + 1;
    while ((boundary - consensus.DF8EunosHeight) % interval != 0) ++boundary;
    BOOST_TEST_MESSAGE("first retarget after the rollback tip at height " << boundary);
    BOOST_CHECK_EQUAL(boundary, 6565008);

    const uint32_t nBits = 0x1d00ffff;  // some difficulty well above the limit
    std::vector<CBlockIndex> chain;
    BuildChain(chain, boundary - interval, boundary - 1, ROLLBACK_TIP, nBits);

    // 1) The first block after the pause (6564035) is no retarget block: same nBits, no error.
    const CBlockIndex *tip = &chain[ROLLBACK_TIP - (boundary - interval)];
    BOOST_CHECK_EQUAL(tip->nHeight, ROLLBACK_TIP);
    const int64_t nextTime = tip->GetBlockTime() + PAUSE;
    BOOST_CHECK_EQUAL(pos::GetNextWorkRequired(tip, nextTime, consensus), nBits);

    // 2) At the retarget boundary the 8 days are inside the window: the timespan is clamped to 4x,
    //    the target gets 4x easier (never harder), and it stays below the limit.
    const CBlockIndex *last = &chain.back();
    BOOST_CHECK_EQUAL(last->nHeight + 1, boundary);
    const uint32_t retarget = pos::GetNextWorkRequired(last, last->GetBlockTime() + 30, consensus);
    arith_uint256 expected;
    expected.SetCompact(nBits);
    expected *= 4;
    arith_uint256 got;
    got.SetCompact(retarget);
    arith_uint256 old;
    old.SetCompact(nBits);
    BOOST_CHECK_EQUAL(retarget, expected.GetCompact());
    BOOST_CHECK(got > old);
    BOOST_CHECK(got <= UintToArith256(pos.diffLimit));
    BOOST_TEST_MESSAGE("retarget after the pause: nBits " << std::hex << nBits << " -> " << retarget);

    // 3) Near the limit the result is capped at diffLimit, not an error.
    const uint32_t easyBits = UintToArith256(pos.diffLimit).GetCompact();
    BuildChain(chain, boundary - interval, boundary - 1, ROLLBACK_TIP, easyBits);
    const uint32_t capped = pos::GetNextWorkRequired(&chain.back(), chain.back().GetBlockTime() + 30, consensus);
    BOOST_CHECK_EQUAL(capped, easyBits);
}

BOOST_AUTO_TEST_CASE(mainnet_stake_weight_after_eight_day_pause)
{
    const auto &consensus = Params().GetConsensus();
    const int64_t t = 1762000000;
    // A masternode that minted right before the pause: 30 s since its last block -> weight 1.
    BOOST_CHECK(pos::CalcCoinDayWeight(consensus, t + 30, t) == arith_uint256(1));
    // After 8 days: (8 d + 6 h) / 6 h = 33 -> its target is 33x larger (easier).
    BOOST_CHECK(pos::CalcCoinDayWeight(consensus, t + PAUSE, t) == arith_uint256(33));
    // Capped at nStakeMaxAge (14 days): (14 d + 6 h) / 6 h = 57.
    BOOST_CHECK(pos::CalcCoinDayWeight(consensus, t + 20 * 24 * 60 * 60, t) == arith_uint256(57));
}

BOOST_AUTO_TEST_SUITE_END()
