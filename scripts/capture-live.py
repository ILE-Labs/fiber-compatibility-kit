#!/usr/bin/env python3
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

CURRENT = os.environ.get("CURRENT_RPC_URL")
OLD = os.environ.get("OLD_RPC_URL")
if not CURRENT or not OLD:
    raise SystemExit("CURRENT_RPC_URL and OLD_RPC_URL must be set for a live capture")
OUTPUT = Path(os.environ.get("OUTPUT", "evidence/live"))
SDK_CHANNEL_TS = Path(os.environ.get("FIBER_JS_CHANNEL_TS", ""))

def rpc(url, method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    request = Request(url, data=body, headers={"content-type": "application/json"})
    with urlopen(request, timeout=10) as response:
        return json.load(response)

responses = {}
for label, url in (("current", CURRENT), ("old", OLD)):
    responses[label] = {
        "url": url,
        "node_info": rpc(url, "node_info", []),
        "list_channels_pending": rpc(
            url, "list_channels", [{"pubkey": None, "include_closed": False, "only_pending": True}]
        ),
    }

def channel_keys(payload):
    return sorted({key for channel in payload.get("result", {}).get("channels", []) for key in channel})

current_keys = channel_keys(responses["current"]["list_channels_pending"])
old_keys = channel_keys(responses["old"]["list_channels_pending"])
if not SDK_CHANNEL_TS:
    raise SystemExit("FIBER_JS_CHANNEL_TS must point to the pinned fiber-js Channel type used for this capture")
sdk_source = SDK_CHANNEL_TS.read_text()
channel_interface = sdk_source.split("interface Channel {", 1)[1].split("}\n", 1)[0]
sdk_keys = sorted({line.strip().split("?", 1)[0].split(":", 1)[0] for line in channel_interface.splitlines() if ":" in line})
observed_keys = sorted(set(current_keys + old_keys))
analysis = {
    "captured_at": datetime.now(timezone.utc).isoformat(),
    "current_channel_keys": current_keys,
    "old_channel_keys": old_keys,
    "sdk_declared_channel_keys": sdk_keys,
    "live_keys_missing_from_fiber_js": [key for key in observed_keys if key not in sdk_keys],
    "runtime_versions_differ": (
        responses["current"]["node_info"].get("result", {}).get("version")
        != responses["old"]["node_info"].get("result", {}).get("version")
    ),
    "observable_channel_shape_difference": current_keys != old_keys,
    "sdk_contract_gap_detected": bool([key for key in observed_keys if key not in sdk_keys]),
    "version_regression_claimed": False,
    "evidence_status": "live_rpc_capture",
}
OUTPUT.mkdir(parents=True, exist_ok=True)
(OUTPUT / "responses.json").write_text(json.dumps({"endpoints": responses, "analysis": analysis}, indent=2) + "\n")
(OUTPUT / "report.json").write_text(json.dumps(analysis, indent=2) + "\n")
print(json.dumps(analysis, indent=2))
