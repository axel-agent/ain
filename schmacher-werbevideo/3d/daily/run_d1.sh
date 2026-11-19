#!/bin/bash
cd "$(dirname "$0")"
until grep -q "RENDER DONE" ../out/d1_render.log; do sleep 30; done
NP=4 python3 d1_build.py all && echo ALL D1 DONE
