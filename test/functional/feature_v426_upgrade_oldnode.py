#!/usr/bin/env python3
# Copyright (c) DeFi Blockchain Developers
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php.
"""Rollback via v4.2.6: what happens to a node that ran the OLD software past the gate height?

Question (a): a node with the old software (built from the merge base bd09486, environment variable
OLD_DEFID) follows the old chain beyond the gate height G. Afterwards it is restarted with v4.2.6
(binary under test) on the same data directory.

  a1  restart WITHOUT -reindex: does it stay on the old chain? Can it still extend the old chain?
      Does it switch to the v4.2.6 chain when that one is shorter / longer?
  a2  restart WITH -reindex: does it drop the old chain at G and follow the v4.2.6 chain?
  a3  restart without -reindex, then invalidateblock <hash of the old block at G>: does it drop the
      old chain and follow the v4.2.6 chain? Does that survive a further restart?

On regtest the gate height is set per parameter (-mnversiongateheight=G); the old binary does not
know the option. The test only reports, the RESULT lines are the answer. It fails only if one of
the two remedies (a2, a3) does not bring the node onto the v4.2.6 chain.

Node 0: v4.2.6, producer of the new chain (blocks from G on carry nVersion bit 24).
Node 1: old binary, producer of the old chain, stays old for the whole test.
Node 2, 3, 4: old binary at first (follow the old chain), then restarted with v4.2.6 (a1, a2, a3).
"""

import os
import subprocess

from test_framework.test_framework import DefiTestFramework, SkipTest
from test_framework.util import assert_equal, disconnect_nodes, wait_until

GATE = 130
OLD_BLOCKS = 10  # old chain: G .. G+9 (no bit 24)
NEW_SHORT = 3  # first part of the new chain, less work than the old chain
NEW_BLOCKS = OLD_BLOCKS + 3  # whole new chain: G .. G+12 (bit 24), more work than the old chain
SIGNAL_BIT = 1 << 24


class V426UpgradeOldNodeTest(DefiTestFramework):
    def set_test_params(self):
        self.num_nodes = 5
        self.setup_clean_chain = True
        self.rpc_timeout = 300
        self.base = ["-persistmempool=0"]
        self.new_args = self.base + ["-mnversiongateheight=%d" % GATE]
        self.extra_args = [self.new_args] + [self.base] * 4

    def skip_test_if_missing_module(self):
        if not os.getenv("OLD_DEFID"):
            raise SkipTest("OLD_DEFID (path to a defid built from the merge base) is not set")

    def setup_nodes(self):
        old = os.getenv("OLD_DEFID")
        self.add_nodes(self.num_nodes, self.extra_args, binary=[self.options.defid] + [old] * 4)
        self.start_nodes()
        self.import_deterministic_coinbase_privkeys()

    # helpers ------------------------------------------------------------------------------------

    def log_has(self, node, *needles):
        path = os.path.join(node.datadir, "regtest", "debug.log")
        try:
            with open(path, encoding="utf8", errors="replace") as f:
                return any(all(n in line for n in needles) for line in f)
        except OSError:
            return False

    def log_lines(self, node, label, *needles, last=4):
        path = os.path.join(node.datadir, "regtest", "debug.log")
        try:
            with open(path, encoding="utf8", errors="replace") as f:
                lines = [l.rstrip() for l in f if any(n in l for n in needles)]
        except OSError as e:
            self.log.info("%s: could not read debug.log: %s" % (label, e))
            return
        for l in lines[-last:]:
            self.log.info("%s: %s" % (label, l))

    def switch_to_new(self, i, extra):
        """Restart node i (stopped) with the binary under test on the same data directory."""
        node = self.nodes[i]
        node.binary = self.options.defid
        node.args[0] = self.options.defid
        self.start_node(i, extra_args=self.new_args + extra)
        return self.nodes[i]

    def submit(self, target, hashes):
        results = []
        for h in hashes:
            results.append(target.submitblock(self.nodes[0].getblock(h, 0)))
        return results

    def tip(self, node):
        return node.getblockcount(), node.getbestblockhash()

    # test ---------------------------------------------------------------------------------------

    def run_test(self):
        new, old = self.nodes[0], self.nodes[1]
        self.log.info("new binary: %s" % new.binary)
        self.log.info("old binary: %s" % old.binary)
        assert new.binary != old.binary
        new_help = subprocess.run([new.binary, "-help", "-help-debug"], capture_output=True, text=True).stdout
        old_help = subprocess.run([old.binary, "-help", "-help-debug"], capture_output=True, text=True).stdout
        assert "-mnversiongateheight" in new_help, "binary under test lacks -mnversiongateheight"
        assert "-mnversiongateheight" not in old_help, "OLD_DEFID knows -mnversiongateheight; not an old node"
        self.log.info("old node subversion: %s" % old.getnetworkinfo()["subversion"])
        self.log.info("new node subversion: %s" % new.getnetworkinfo()["subversion"])

        # Common history up to G-1.
        new.generate(GATE - 1)
        self.sync_blocks()
        pre_gate = new.getblockhash(GATE - 1)
        for n in self.nodes:
            assert_equal(self.tip(n), (GATE - 1, pre_gate))

        # Split: the old producer (node 1, with nodes 2..4) runs on past G without the signal.
        disconnect_nodes(new, 1)
        disconnect_nodes(old, 0)
        old_hashes = old.generate(OLD_BLOCKS)
        self.sync_blocks(self.nodes[1:])
        old_gate = old.getblockhash(GATE)
        old_tip = old.getbestblockhash()
        assert_equal(old.getblockcount(), GATE + OLD_BLOCKS - 1)
        for h in old_hashes:
            assert_equal(old.getblock(h)["version"] & SIGNAL_BIT, 0)
        for i in (2, 3, 4):
            assert_equal(self.tip(self.nodes[i]), (GATE + OLD_BLOCKS - 1, old_tip))
        self.log.info("old chain: G=%d .. %d, gate block %s, tip %s (no bit 24)"
                      % (GATE, GATE + OLD_BLOCKS - 1, old_gate, old_tip))

        # The v4.2.6 producer builds the new chain from G-1 on (bit 24 set).
        new_hashes = new.generate(NEW_BLOCKS)
        assert_equal(new.getblockcount(), GATE + NEW_BLOCKS - 1)
        for h in new_hashes:
            assert (new.getblock(h)["version"] & SIGNAL_BIT) != 0
        new_tip = new.getbestblockhash()
        res = new.submitblock(old.getblock(old_gate, 0))
        self.log.info("sanity: old gate block on v4.2.6 node 0: %s" % res)
        assert res is not None and res.startswith("bad-version"), res
        self.log.info("new chain: G=%d .. %d, tip %s (bit 24)" % (GATE, GATE + NEW_BLOCKS - 1, new_tip))

        # Stop the three followers (still old binary) and restart them with v4.2.6.
        for i in (2, 3, 4):
            self.stop_node(i)

        results = {}

        # a1: restart without -reindex ---------------------------------------------------------
        n2 = self.switch_to_new(2, [])
        self.log.info("a1 node 2 subversion after restart: %s" % n2.getnetworkinfo()["subversion"])
        a1_stays = self.tip(n2) == (GATE + OLD_BLOCKS - 1, old_tip)
        self.log.info("RESULT a1: v4.2.6 without -reindex on the old data dir: tip %s -> %s"
                      % (self.tip(n2), "STAYS ON THE OLD CHAIN" if a1_stays else "LEFT THE OLD CHAIN"))
        results["a1_stays_on_old_chain"] = a1_stays

        # Can it still extend the old chain? The old producer mines one more block.
        next_old = old.generate(1)[0]
        res = n2.submitblock(old.getblock(next_old, 0))
        self.log.info("RESULT a1: next old-chain block (height %d, no bit 24) on the restarted node: %s, tip now %s"
                      % (GATE + OLD_BLOCKS, res, self.tip(n2)))
        results["a1_next_old_block"] = str(res)

        # New chain with less work than the old chain.
        res = self.submit(n2, new_hashes[:NEW_SHORT])
        on_new = n2.getbestblockhash() == new_hashes[NEW_SHORT - 1]
        self.log.info("RESULT a1: shorter v4.2.6 chain (%d blocks) submitted: %s, tip %s -> %s"
                      % (NEW_SHORT, res, self.tip(n2), "SWITCHED" if on_new else "stays old"))
        results["a1_switch_to_shorter_new_chain"] = on_new

        # New chain with more work than the old chain.
        res = self.submit(n2, new_hashes[NEW_SHORT:])
        on_new = n2.getbestblockhash() == new_tip
        self.log.info("RESULT a1: longer v4.2.6 chain (%d blocks) submitted: %s, tip %s -> %s"
                      % (NEW_BLOCKS, res, self.tip(n2), "SWITCHED" if on_new else "stays old"))
        results["a1_switch_to_longer_new_chain"] = on_new
        self.log_lines(n2, "a1 node 2 debug.log", "bad-version", "InvalidChainFound", "UpdateTip")

        # a2: restart with -reindex -------------------------------------------------------------
        n3 = self.switch_to_new(3, ["-reindex"])
        wait_until(lambda: self.log_has(n3, "Reindexing finished"), timeout=240)
        try:  # the best chain is activated right after the import thread finished
            wait_until(lambda: n3.getblockcount() >= GATE - 1, timeout=60)
        except AssertionError:
            pass
        a2_tip = self.tip(n3)
        a2_dropped = a2_tip == (GATE - 1, pre_gate)
        self.log.info("RESULT a2: v4.2.6 with -reindex: tip after reindex %s -> %s"
                      % (a2_tip, "OLD CHAIN DROPPED AT G" if a2_dropped else "unexpected"))
        self.log.info("RESULT a2: bad-version in debug.log during reindex: %s" % self.log_has(n3, "bad-version"))
        self.log_lines(n3, "a2 node 3 debug.log", "bad-version", "Reindexing finished")
        res = self.submit(n3, new_hashes)
        a2_follows = n3.getbestblockhash() == new_tip
        self.log.info("RESULT a2: v4.2.6 chain submitted: %s, tip %s -> %s"
                      % (res, self.tip(n3), "FOLLOWS NEW CHAIN" if a2_follows else "does NOT follow"))
        results["a2_reindex_drops_old_chain"] = a2_dropped
        results["a2_reindex_follows_new_chain"] = a2_follows

        # a3: restart without -reindex, then invalidateblock <old block at G> ---------------------
        n4 = self.switch_to_new(4, [])
        before = self.tip(n4)
        n4.invalidateblock(old_gate)
        a3_tip = self.tip(n4)
        a3_dropped = a3_tip == (GATE - 1, pre_gate)
        self.log.info("RESULT a3: v4.2.6 without -reindex, tip %s, invalidateblock %s -> tip %s -> %s"
                      % (before, old_gate, a3_tip, "OLD CHAIN DROPPED" if a3_dropped else "unexpected"))
        res = self.submit(n4, new_hashes)
        a3_follows = n4.getbestblockhash() == new_tip
        self.log.info("RESULT a3: v4.2.6 chain submitted: %s, tip %s -> %s"
                      % (res, self.tip(n4), "FOLLOWS NEW CHAIN" if a3_follows else "does NOT follow"))
        res = n4.submitblock(old.getblock(next_old, 0))
        self.log.info("RESULT a3: next old-chain block afterwards: %s" % res)
        invalid = [t for t in n4.getchaintips() if t["status"] == "invalid"]
        self.log.info("RESULT a3: invalid chain tips: %s" % invalid)
        self.restart_node(4, extra_args=self.new_args)
        n4 = self.nodes[4]
        a3_persists = n4.getbestblockhash() == new_tip
        self.log.info("RESULT a3: after a further restart tip %s -> %s"
                      % (self.tip(n4), "STILL NEW CHAIN" if a3_persists else "BACK ON OLD CHAIN"))
        results["a3_invalidate_drops_old_chain"] = a3_dropped
        results["a3_invalidate_follows_new_chain"] = a3_follows
        results["a3_survives_restart"] = a3_persists

        # The old producer keeps its chain (it does not know the rule).
        self.log.info("RESULT old node 1 tip at the end: %s (old chain)" % (self.tip(old),))

        for k in sorted(results):
            self.log.info("SUMMARY %s = %s" % (k, results[k]))
        assert a2_dropped and a2_follows, "-reindex did not bring the node onto the v4.2.6 chain"
        assert a3_dropped and a3_follows, "invalidateblock did not bring the node onto the v4.2.6 chain"


if __name__ == "__main__":
    V426UpgradeOldNodeTest().main()
