#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
report = json.loads((root / "evidence/live/report.json").read_text())
responses = json.loads((root / "evidence/live/responses.json").read_text())
expected_current = os.environ.get("EXPECTED_CURRENT_VERSION")
expected_old = os.environ.get("EXPECTED_OLD_VERSION")
if not expected_current or not expected_old:
    raise SystemExit("EXPECTED_CURRENT_VERSION and EXPECTED_OLD_VERSION must be set")

assert report["evidence_status"] == "live_rpc_capture"
assert report["version_difference_detected"] is False
assert report["sdk_contract_gap_detected"] is True
assert report["version_regression_claimed"] is False
assert responses["endpoints"]["current"]["node_info"]["result"]["version"] == expected_current
assert responses["endpoints"]["old"]["node_info"]["result"]["version"] == expected_old
assert set(report["live_keys_missing_from_fiber_js"]) == {
    "failure_detail", "is_acceptor", "is_one_way", "pending_tlcs"
}
assert report["current_channel_keys"] == report["old_channel_keys"]
print("live evidence validation: PASS")
print("version regression: NOT CLAIMED")
print("SDK contract gap: PASS")
