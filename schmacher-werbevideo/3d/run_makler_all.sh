#!/bin/bash
cd "$(dirname "$0")/.."
while pgrep -f "render.cjs out/mk16" >/dev/null; do sleep 30; done
python3 edit_makler.py all && echo ALL MAKLER DONE
