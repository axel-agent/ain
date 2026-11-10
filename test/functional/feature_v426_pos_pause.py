#!/usr/bin/env python3
# Copyright (c) DeFi Blockchain Developers
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php.
"""Rollback via v4.2.6, question (c): do masternodes find blocks again after a pause of 8 days?

Three v4.2.6 nodes (gate height G set per parameter, three different genesis masternodes) build a
chain past G. Then the clock of all nodes jumps 8 days ahead (setmocktime), as after a rollback to
an old block. Checked:

  c1  every masternode mints again; each block is accepted by the other nodes (no time-too-new,
      time-too-old, bad-diffbits or other rejection in any debug.log), blocks carry bit 24;
  c2  nBits / difficulty before and after the pause (regtest has no retargeting, see the unit
      suite v426_pos_pause_tests for the mainnet parameters);
  c3  a node that is (re)started 8 days after its tip is in initial block download
      (tip older than -maxtipage, default 10 h). On mainnet the staker does not mint in IBD
      (miner.cpp, Staker::init). -maxtipage larger than the pause ends IBD at once; a node in
      IBD leaves it as soon as it receives a fresh block from another masternode;
  c4  -reindex after the pause reproduces the same tip.
"""

import os
import time

from test_framework.test_framework import DefiTestFramework
from test_framework.test_node import TestNode
from test_framework.util import assert_equal, connect_nodes_bi, set_node_times, wait_until

GATE = 140
PAUSE = 8 * 24 * 60 * 60
SIGNAL_BIT = 1 << 24
REJECT_MARKERS = ["time-too-new", "time-too-old", "bad-diffbits", "high-hash", "bad-pos", "bad-version",
                  "InvalidChainFound", "ERROR: AcceptBlock", "ERROR: ProcessNewBlock"]


class V426PosPauseTest(DefiTestFramework):
    def set_test_params(self):
        self.num_nodes = 3
        self.setup_clean_chain = True
        self.rpc_timeout = 300
        self.args = ["-persistmempool=0", "-mnversiongateheight=%d" % GATE]
        self.extra_args = [self.args] * self.num_nodes

    def log_matches(self, node):
        path = os.path.join(node.datadir, "regtest", "debug.log")
        with open(path, encoding="utf8", errors="replace") as f:
            return [l.rstrip() for l in f if any(m in l for m in REJECT_MARKERS)]

    def set_all_times(self, t):
        TestNode.Mocktime = t
        set_node_times(self.nodes, t)

    def mint(self, idx, count):
        """Mint count blocks on node idx, keep all clocks at tip time + 1, sync after each block."""
        hashes = []
        for _ in range(count):
            node = self.nodes[idx]
            self.set_all_times(node.getblockheader(node.getbestblockhash())["time"] + 1)
            hashes.extend(node.generate(1))
            self.sync_blocks()
        return hashes

    def ibd(self, node):
        return node.getblockchaininfo()["initialblockdownload"]

    def run_test(self):
        nodes = self.nodes
        start = int(time.time()) - PAUSE - 2 * 24 * 60 * 60
        self.set_all_times(start)

        # Chain past G, minted by all three masternodes.
        self.mint(0, 50)
        self.mint(1, 50)
        self.mint(2, GATE - 1 - nodes[0].getblockcount())
        self.mint(0, 5)
        self.mint(1, 5)
        h = nodes[0].getblockcount()
        assert_equal(h, GATE + 9)
        last = nodes[0].getblock(nodes[0].getbestblockhash())
        assert (last["version"] & SIGNAL_BIT) != 0
        self.log.info("before the pause: height %d, time %d, bits %s, difficulty %s"
                      % (h, last["time"], last["bits"], last["difficulty"]))
        markers_before = [len(self.log_matches(n)) for n in nodes]

        # The pause: all clocks jump 8 days past the tip.
        resume = last["time"] + PAUSE
        self.set_all_times(resume)

        # c3: node 2 is restarted 8 days after its tip.
        self.stop_node(2)
        self.start_node(2, extra_args=self.args + ["-mocktime=%d" % resume])
        ibd_plain = self.ibd(nodes[2])
        self.log.info("RESULT c3: node restarted 8 days after its tip, default -maxtipage: initialblockdownload=%s"
                      % ibd_plain)
        self.stop_node(2)
        self.start_node(2, extra_args=self.args + ["-mocktime=%d" % resume, "-maxtipage=%d" % (PAUSE + 86400)])
        ibd_maxtip = self.ibd(nodes[2])
        self.log.info("RESULT c3: same with -maxtipage=%d: initialblockdownload=%s" % (PAUSE + 86400, ibd_maxtip))
        self.stop_node(2)
        self.start_node(2, extra_args=self.args + ["-mocktime=%d" % resume])
        assert self.ibd(nodes[2])
        connect_nodes_bi(nodes, 1, 2)
        connect_nodes_bi(nodes, 0, 2)

        # c1: the first block after the pause and then every masternode in turn.
        first = self.mint(0, 1)[0]
        fb = nodes[0].getblock(first)
        gap = fb["time"] - last["time"]
        ibd_after_block = self.ibd(nodes[2])
        self.log.info("RESULT c1: first block after the pause: height %d, gap %d s (%.2f days), bits %s, "
                      "difficulty %s, version %s, accepted by all: %s"
                      % (fb["height"], gap, gap / 86400.0, fb["bits"], fb["difficulty"], hex(fb["version"]),
                         all(n.getbestblockhash() == first for n in nodes)))
        self.log.info("RESULT c3: restarted node (in IBD) after receiving that block: initialblockdownload=%s"
                      % ibd_after_block)
        minted_by = {}
        for rnd in range(5):
            for idx in range(3):
                hs = self.mint(idx, 1)
                minted_by[idx] = minted_by.get(idx, 0) + len(hs)
        for n in nodes:
            assert_equal(n.getbestblockhash(), nodes[0].getbestblockhash())
        tip = nodes[0].getblock(nodes[0].getbestblockhash())
        for hh in range(fb["height"], tip["height"] + 1):
            assert (nodes[0].getblock(nodes[0].getblockhash(hh))["version"] & SIGNAL_BIT) != 0
        markers_after = [self.log_matches(n)[markers_before[i]:] for i, n in enumerate(nodes)]
        c1_ok = gap >= PAUSE and all(minted_by.get(i, 0) == 5 for i in range(3)) and not any(markers_after)
        self.log.info("RESULT c1: blocks minted after the pause per masternode: %s, tip %d, all nodes on one tip"
                      % (minted_by, tip["height"]))
        for i, m in enumerate(markers_after):
            self.log.info("RESULT c1: node %d rejection/diff/time messages after the pause: %s" % (i, m[-5:] if m else "none"))

        # c2: difficulty before/after.
        self.log.info("RESULT c2: bits before %s / after %s, difficulty before %s / after %s"
                      % (last["bits"], tip["bits"], last["difficulty"], tip["difficulty"]))

        # c4: -reindex after the pause.
        best = nodes[1].getbestblockhash()
        self.stop_node(1)
        self.start_node(1, extra_args=self.args + ["-reindex", "-mocktime=%d" % TestNode.Mocktime])
        wait_until(lambda: nodes[1].getbestblockhash() == best, timeout=240)
        self.log.info("RESULT c4: -reindex after the pause reproduces tip %s at height %d"
                      % (best, nodes[1].getblockcount()))

        self.log.info("SUMMARY c1_all_masternodes_mint_after_8_days_without_errors = %s" % c1_ok)
        self.log.info("SUMMARY c3_ibd_after_restart_default_maxtipage = %s" % ibd_plain)
        self.log.info("SUMMARY c3_ibd_with_large_maxtipage = %s" % ibd_maxtip)
        self.log.info("SUMMARY c3_ibd_left_after_fresh_block = %s" % (not ibd_after_block))
        assert c1_ok, "masternodes did not mint cleanly after the pause"


if __name__ == "__main__":
    V426PosPauseTest().main()
