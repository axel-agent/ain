// Copyright (c) 2016-2019 The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

#include <amount.h>
#include <dfi/balances.h>
#include <limits>
#include <policy/feerate.h>
#include <test/setup_common.h>

#include <boost/test/unit_test.hpp>

BOOST_FIXTURE_TEST_SUITE(amount_tests, BasicTestingSetup)

BOOST_AUTO_TEST_CASE(MoneyRangeTest)
{
    BOOST_CHECK_EQUAL(MoneyRange(CAmount(-1)), false);
    BOOST_CHECK_EQUAL(MoneyRange(CAmount(0)), true);
    BOOST_CHECK_EQUAL(MoneyRange(CAmount(1)), true);
    BOOST_CHECK_EQUAL(MoneyRange(MAX_MONEY), true);
    BOOST_CHECK_EQUAL(MoneyRange(MAX_MONEY + CAmount(1)), false);
}

BOOST_AUTO_TEST_CASE(GetFeeTest)
{
    CFeeRate feeRate, altFeeRate;

    feeRate = CFeeRate(0);
    // Must always return 0
    BOOST_CHECK_EQUAL(feeRate.GetFee(0), CAmount(0));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1e5), CAmount(0));

    feeRate = CFeeRate(1000);
    // Must always just return the arg
    BOOST_CHECK_EQUAL(feeRate.GetFee(0), CAmount(0));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1), CAmount(1));
    BOOST_CHECK_EQUAL(feeRate.GetFee(121), CAmount(121));
    BOOST_CHECK_EQUAL(feeRate.GetFee(999), CAmount(999));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1e3), CAmount(1e3));
    BOOST_CHECK_EQUAL(feeRate.GetFee(9e3), CAmount(9e3));

    feeRate = CFeeRate(-1000);
    // Must always just return -1 * arg
    BOOST_CHECK_EQUAL(feeRate.GetFee(0), CAmount(0));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1), CAmount(-1));
    BOOST_CHECK_EQUAL(feeRate.GetFee(121), CAmount(-121));
    BOOST_CHECK_EQUAL(feeRate.GetFee(999), CAmount(-999));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1e3), CAmount(-1e3));
    BOOST_CHECK_EQUAL(feeRate.GetFee(9e3), CAmount(-9e3));

    feeRate = CFeeRate(123);
    // Truncates the result, if not integer
    BOOST_CHECK_EQUAL(feeRate.GetFee(0), CAmount(0));
    BOOST_CHECK_EQUAL(feeRate.GetFee(8), CAmount(1)); // Special case: returns 1 instead of 0
    BOOST_CHECK_EQUAL(feeRate.GetFee(9), CAmount(1));
    BOOST_CHECK_EQUAL(feeRate.GetFee(121), CAmount(14));
    BOOST_CHECK_EQUAL(feeRate.GetFee(122), CAmount(15));
    BOOST_CHECK_EQUAL(feeRate.GetFee(999), CAmount(122));
    BOOST_CHECK_EQUAL(feeRate.GetFee(1e3), CAmount(123));
    BOOST_CHECK_EQUAL(feeRate.GetFee(9e3), CAmount(1107));

    feeRate = CFeeRate(-123);
    // Truncates the result, if not integer
    BOOST_CHECK_EQUAL(feeRate.GetFee(0), CAmount(0));
    BOOST_CHECK_EQUAL(feeRate.GetFee(8), CAmount(-1)); // Special case: returns -1 instead of 0
    BOOST_CHECK_EQUAL(feeRate.GetFee(9), CAmount(-1));

    // check alternate constructor
    feeRate = CFeeRate(1000);
    altFeeRate = CFeeRate(feeRate);
    BOOST_CHECK_EQUAL(feeRate.GetFee(100), altFeeRate.GetFee(100));

    // Check full constructor
    BOOST_CHECK(CFeeRate(CAmount(-1), 0) == CFeeRate(0));
    BOOST_CHECK(CFeeRate(CAmount(0), 0) == CFeeRate(0));
    BOOST_CHECK(CFeeRate(CAmount(1), 0) == CFeeRate(0));
    // default value
    BOOST_CHECK(CFeeRate(CAmount(-1), 1000) == CFeeRate(-1));
    BOOST_CHECK(CFeeRate(CAmount(0), 1000) == CFeeRate(0));
    BOOST_CHECK(CFeeRate(CAmount(1), 1000) == CFeeRate(1));
    // lost precision (can only resolve satoshis per kB)
    BOOST_CHECK(CFeeRate(CAmount(1), 1001) == CFeeRate(0));
    BOOST_CHECK(CFeeRate(CAmount(2), 1001) == CFeeRate(1));
    // some more integer checks
    BOOST_CHECK(CFeeRate(CAmount(26), 789) == CFeeRate(32));
    BOOST_CHECK(CFeeRate(CAmount(27), 789) == CFeeRate(34));
    // Maximum size in bytes, should not crash
    // div by 1000 cause lead to overflow with new total supply
    CFeeRate(MAX_MONEY/1000, std::numeric_limits<size_t>::max() >> 1).GetFeePerK();
}

BOOST_AUTO_TEST_CASE(BinaryOperatorTest)
{
    CFeeRate a, b;
    a = CFeeRate(1);
    b = CFeeRate(2);
    BOOST_CHECK(a < b);
    BOOST_CHECK(b > a);
    BOOST_CHECK(a == a);
    BOOST_CHECK(a <= b);
    BOOST_CHECK(a <= a);
    BOOST_CHECK(b >= a);
    BOOST_CHECK(b >= b);
    // a should be 0.00000002 DFI/kB now
    a += a;
    BOOST_CHECK(a == b);
}

BOOST_AUTO_TEST_CASE(ToStringTest)
{
    CFeeRate feeRate;
    feeRate = CFeeRate(1);
    BOOST_CHECK_EQUAL(feeRate.ToString(), "0.00000001 DFI/kB");
}

//Tests whether the function GetDecimalString() returns the correct string value
BOOST_AUTO_TEST_CASE(GetDecimaleString_Test)
{
    CAmount val = 1200;
    BOOST_CHECK_EQUAL(GetDecimalString(val), "0.00001200");
}


//Tests whether the function CTokenAmount::Add() returns the correct 
//error response/error string when a negative value is passed.
BOOST_AUTO_TEST_CASE(CTokenAmount_Add_Test)
{
    CTokenAmount amount;
    CAmount val = -1;
    BOOST_CHECK_EQUAL(amount.Add(val).msg, "negative amount: -0.00000001");
}

//Tests whether the function CTokenAmount::Sub() returns the correct 
//error response/error string when a negative value is passed.
BOOST_AUTO_TEST_CASE(CTokenAmount_Sub_Test)
{
    CTokenAmount amount;
    CAmount val = -1;
    BOOST_CHECK_EQUAL(amount.Sub(val).msg, "negative amount: -0.00000001");
}

//Tests whether the function CTokenAmount::Sub() returns the correct 
//error response/error string when a value > CTokenAmount.nValue is passed.
BOOST_AUTO_TEST_CASE(CTokenAmount_Sub_Negative_Result_Test)
{
    CTokenAmount amount;
    amount.nValue = 10;
    CAmount val = 11;
    BOOST_CHECK_EQUAL(amount.Sub(val).msg, "amount 0.00000010 is less than 0.00000011");
}

BOOST_AUTO_TEST_CASE(CAmount_Float_Test)
{
    CAmount amount1 = 16765189, amount2 = 237824;
    // https://en.wikipedia.org/wiki/Floating-point_arithmetic
    BOOST_CHECK_EQUAL(CAmount(amount1 + float(amount2)), amount1 + amount2 - 1);
}

namespace {

CAccounts MakeTransferSumInputs(CAmount first, CAmount second)
{
    CAccounts accounts;
    CScript firstOwner;
    CScript secondOwner;
    firstOwner << OP_1;
    secondOwner << OP_2;

    accounts[firstOwner].balances.emplace(DCT_ID{0}, first);
    accounts[secondOwner].balances.emplace(DCT_ID{0}, second);
    return accounts;
}

} // namespace

// The sum of the transfer amounts is the basis of the account consensus: the
// source account is debited with the sum while every destination is credited
// with its full amount. An overflow that is not reported therefore creates
// money out of thin air.
BOOST_AUTO_TEST_CASE(SumAllTransfers_Normal)
{
    const auto accounts = MakeTransferSumInputs(2 * COIN, 3 * COIN);
    const auto result = SumAllTransfers(accounts);

    BOOST_REQUIRE(result.ok);
    BOOST_REQUIRE(result.val.has_value());
    BOOST_REQUIRE_EQUAL(result->balances.size(), 1U);
    BOOST_CHECK_EQUAL(result->balances.at(DCT_ID{0}), 5 * COIN);
}

BOOST_AUTO_TEST_CASE(SumAllTransfers_Maximum)
{
    const auto maximum = std::numeric_limits<CAmount>::max();
    const auto accounts = MakeTransferSumInputs(maximum - 1, 1);
    const auto result = SumAllTransfers(accounts);

    BOOST_REQUIRE(result.ok);
    BOOST_REQUIRE(result.val.has_value());
    BOOST_REQUIRE_EQUAL(result->balances.size(), 1U);
    BOOST_CHECK_EQUAL(result->balances.at(DCT_ID{0}), maximum);
}

BOOST_AUTO_TEST_CASE(SumAllTransfers_Overflow)
{
    const auto accounts =
        MakeTransferSumInputs(1, std::numeric_limits<CAmount>::max());
    const auto result = SumAllTransfers(accounts);

    BOOST_CHECK_MESSAGE(!result.ok, "Overflow must return an error");
    BOOST_CHECK_MESSAGE(!result.val.has_value(),
                        "Overflow must not return a partial total");
}

BOOST_AUTO_TEST_CASE(SumAllTransfers_Negative)
{
    const auto accounts = MakeTransferSumInputs(1, -1);
    const auto result = SumAllTransfers(accounts);

    BOOST_CHECK_MESSAGE(!result.ok, "Negative amounts must return an error");
    BOOST_CHECK_MESSAGE(!result.val.has_value(),
                        "Invalid input must not return a partial total");
}

// Below the activation height the historical behaviour has to be reproduced
// bit-exactly: the overflow error is swallowed, the sum stays truncated at the
// amount before the overflowing entry and the loop continues with the next
// account. Breaking out of the loop would change the sum and invalidate
// already mined blocks.
BOOST_AUTO_TEST_CASE(SumAllTransfers_LegacyPartialMutation)
{
    CScript a, b, c;
    a << OP_1;
    b << OP_2;
    c << OP_3;
    const CAccounts accounts{
        {a, CBalances{{{DCT_ID{0}, 1}, {DCT_ID{1}, 5}}}},
        {b, CBalances{{{DCT_ID{0}, 2}, {DCT_ID{1}, std::numeric_limits<CAmount>::max()}}}},
        {c, CBalances{{{DCT_ID{0}, 4}, {DCT_ID{1}, 7}}}},
    };
    // The old loop retained token 0's mutation before token 1 failed in b,
    // and then continued with c. An early return would change historical state.
    const auto legacy = SumAllTransfersLegacy(accounts);
    BOOST_REQUIRE_EQUAL(legacy.balances.at(DCT_ID{0}), 7);
    BOOST_REQUIRE_EQUAL(legacy.balances.at(DCT_ID{1}), 12);

    // The checked path rejects the same input instead of truncating it.
    const auto strict = SumAllTransfers(accounts);
    BOOST_CHECK_MESSAGE(!strict.ok, "The checked sum must reject the overflow");
    BOOST_CHECK_MESSAGE(!strict.val.has_value(),
                        "The checked sum must not return a partial total");
}

BOOST_AUTO_TEST_SUITE_END()
