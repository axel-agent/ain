#!/usr/bin/env bash
# Run one functional test directly (not through test_runner.py), so that its log lines
# (RESULT / SUMMARY) show up in the CI output also when the test passes.
set -euo pipefail
TEST="$1"
. build/pyenv/bin/activate
CFG=$(find "$PWD/build" -path '*test/config.ini' | head -1)
echo "config: $CFG"
echo "DEFID=${DEFID:-<from config>} OLD_DEFID=${OLD_DEFID:-<unset>}"
OUT="$PWD/build/v426-logs/${TEST%.py}"
rm -rf "$OUT"
mkdir -p "$(dirname "$OUT")"
set +e
python3 "test/functional/$TEST" --configfile="$CFG" --tmpdir="$OUT" --nocleanup
RC=$?
set -e
echo "exit code: $RC"
if [ "$RC" -ne 0 ]; then
  for f in "$OUT"/node*/regtest/debug.log; do
    [ -f "$f" ] || continue
    echo "===== tail $f"
    tail -n 80 "$f"
  done
fi
exit "$RC"
