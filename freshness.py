#!/usr/bin/env python3
"""Print what in models.json is stale or unverified, so you know what to re-check.

    python3 freshness.py          # report only
Update the data, bump VERSION and 'updated' in models.json, then run build.py.
"""
import datetime
import json
from pathlib import Path

ROOT = Path(__file__).parent
data = json.loads((ROOT / "models.json").read_text(encoding="utf-8"))
today = datetime.date.today()
print(f"Data 'updated': {data['updated']} ({(today - datetime.date.fromisoformat(data['updated'])).days} days ago)")
print("\nSources not re-read in 30+ days:")
for k, s in data["sources"].items():
    age = (today - datetime.date.fromisoformat(s["checked"])).days
    if age >= 30:
        print(f"  {k}: {age} days  {s['url']}")
print("\nModels with unconfirmed release date:", ", ".join(m["id"] for m in data["models"] if not m.get("rel_ok")) or "none")
print("Models with unconfirmed license:", ", ".join(m["id"] for m in data["models"] if not m.get("lic_verified")) or "none")
print("\nThings that go stale fast: new releases in each family (Qwen, Gemma, Llama, Mistral, DeepSeek, OpenAI gpt-oss, IBM Granite), Ollama tags/sizes, and the task rankings in tasks.json.")
