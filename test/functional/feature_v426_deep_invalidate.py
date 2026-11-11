#!/usr/bin/env python3
# Copyright (c) DeFi Blockchain Developers
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php.
"""Rollback via v4.2.6, question (b): invalidateblock over a large depth.

A v4.2.6 node (gate height G set per parameter) builds more than 2,000 blocks above G, every one
of them with at least one custom transaction (AccountToAccount, every 50th block also
UtxosToAccount). Then invalidateblock <block at G> rolls the node back to G-1 in one call.

Checked: the account balances (listaccounts), the per-address balances of the recipients, the
token list and the UTXO set (gettxoutsetinfo hash) after the rollback are exactly the same as
they were at G-1 before the 2,000 blocks were built. reconsiderblock afterwards brings back the
same tip and the same state as before the invalidation. getburninfo is compared and logged only
(it is not consensus state).
"""

import json
import time

from test_framework.test_framework import DefiTestFramework
from test_framework.util import assert_equal, wait_until

GATE = 400  # set per parameter; the funding below stays well below it
DEPTH = 2100  # blocks above G-1, each with a custom tx
SIGNAL_BIT = 1 << 24


class V426DeepInvalidateTest(DefiTestFramework):
    def set_test_params(self):
        self.num_nodes = 1
        self.setup_clean_chain = True
        self.rpc_timeout = 1200
        self.extra_args = [["-txnotokens=0", "-amkheight=50", "-persistmempool=0",
                            "-mnversiongateheight=%d" % GATE]]

    def snapshot(self, n, recipients):
        accounts = n.listaccounts({"limit": 1000000}, False, True)
        utxo = n.gettxoutsetinfo()
        return {
            "accounts": json.dumps(sorted(accounts, key=lambda a: json.dumps(a, sort_keys=True, default=str)), sort_keys=True, default=str),
            "recipients": json.dumps([n.getaccount(r) for r in recipients], default=str),
            "tokens": json.dumps(n.listtokens(), sort_keys=True, default=str),
            "utxo_hash": utxo["hash_serialized_2"],
            "utxo_txouts": utxo["txouts"],
            "utxo_total": str(utxo["total_amount"]),
        }

    def compare(self, label, a, b):
        same = True
        for k in a:
            if a[k] != b[k]:
                same = False
                self.log.info("%s: DIFFERENT %s:\n  before %s\n  after  %s" % (label, k, str(a[k])[:400], str(b[k])[:400]))
        self.log.info("%s: %s" % (label, "IDENTICAL" if same else "DIFFERENT"))
        return same

    def run_test(self):
        n = self.nodes[0]
        owner = n.get_genesis_keys().ownerAuthAddress
        n.generate(110)
        while n.getbalance() < 120 and n.getblockcount() < GATE - 40:
            n.generate(10)
        self.log.info("funding: height %d, wallet balance %s" % (n.getblockcount(), n.getbalance()))
        fund = min(60, int(n.getbalance() / 2))
        assert fund >= 5, "not enough coins to fund the account"
        n.utxostoaccount({owner: "%d@DFI" % fund})
        n.generate(1)
        recipients = [n.getnewaddress("", "legacy") for _ in range(5)]
        for i in range(10):
            n.accounttoaccount(owner, {recipients[i % 5]: "0.1@DFI"})
            n.generate(1)
        n.generate(GATE - 1 - n.getblockcount())
        assert_equal(n.getblockcount(), GATE - 1)
        pre_gate = n.getbestblockhash()
        before = self.snapshot(n, recipients)
        burn_before = json.dumps(n.getburninfo(), sort_keys=True, default=str)
        self.log.info("state at G-1=%d: %d accounts, utxo hash %s"
                      % (GATE - 1, len(json.loads(before["accounts"])), before["utxo_hash"]))

        # More than 2,000 blocks above G, each with a custom tx.
        t0 = time.time()
        custom_blocks = 0
        for i in range(DEPTH):
            if i % 50 == 0:
                n.utxostoaccount({owner: "0.1@DFI"})
            n.accounttoaccount(owner, {recipients[i % 5]: "0.001@DFI"})
            h = n.generate(1)[0]
            if n.getblock(h)["nTx"] >= 2:
                custom_blocks += 1
            if i % 500 == 0:
                self.log.info("built %d blocks above G-1 (%.0fs)" % (i + 1, time.time() - t0))
        tip_height = n.getblockcount()
        tip_hash = n.getbestblockhash()
        assert_equal(tip_height, GATE - 1 + DEPTH)
        assert_equal(custom_blocks, DEPTH)
        assert (n.getblock(n.getblockhash(GATE))["version"] & SIGNAL_BIT) != 0
        after_build = self.snapshot(n, recipients)
        self.log.info("built %d blocks (all with a custom tx) in %.0fs, tip %d %s"
                      % (DEPTH, time.time() - t0, tip_height, tip_hash))
        assert after_build["recipients"] != before["recipients"]

        # invalidateblock over the whole depth in one call.
        gate_hash = n.getblockhash(GATE)
        t0 = time.time()
        n.invalidateblock(gate_hash)
        dur = time.time() - t0
        assert_equal(n.getblockcount(), GATE - 1)
        assert_equal(n.getbestblockhash(), pre_gate)
        self.log.info("RESULT b: invalidateblock over %d blocks took %.1fs, tip now %d %s, mempool %d tx"
                      % (DEPTH, dur, n.getblockcount(), n.getbestblockhash(), n.getmempoolinfo()["size"]))
        rolled_back = self.snapshot(n, recipients)
        b_same = self.compare("RESULT b: state after invalidateblock vs. state at G-1", before, rolled_back)
        burn_after = json.dumps(n.getburninfo(), sort_keys=True, default=str)
        self.log.info("RESULT b: getburninfo after invalidateblock %s the one at G-1"
                      % ("EQUALS" if burn_after == burn_before else "DIFFERS FROM"))
        if burn_after != burn_before:
            self.log.info("  burninfo before %s\n  burninfo after  %s" % (burn_before[:600], burn_after[:600]))

        # reconsiderblock brings back the same tip and state.
        t0 = time.time()
        n.reconsiderblock(gate_hash)
        wait_until(lambda: n.getbestblockhash() == tip_hash, timeout=600)
        self.log.info("RESULT b: reconsiderblock reconnected %d blocks in %.1fs" % (DEPTH, time.time() - t0))
        b_back = self.compare("RESULT b: state after reconsiderblock vs. state before invalidateblock",
                              after_build, self.snapshot(n, recipients))

        self.log.info("SUMMARY b_invalidate_%d_blocks_state_equals_G-1 = %s" % (DEPTH, b_same))
        self.log.info("SUMMARY b_reconsider_restores_tip_and_state = %s" % b_back)
        assert b_same, "state after invalidateblock differs from the state at G-1"
        assert b_back, "state after reconsiderblock differs"


if __name__ == "__main__":
    V426DeepInvalidateTest().main()
