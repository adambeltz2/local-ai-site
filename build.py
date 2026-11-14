#!/usr/bin/env python3
"""Inline models.json and machines.json into src/template.html -> index.html.

Edit the JSON files (or the template), then run:  python3 build.py
The result is one self-contained index.html that works offline.
"""
import base64
import datetime
import json, re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
USES = {"chat", "coding", "reasoning", "vision", "agents", "ocr", "embeddings", "speech"}


def load(name):
    with open(ROOT / name, encoding="utf-8") as f:
        return json.load(f)


def validate_tasks(tasks, data):
    errors = []
    ids = {m["id"]: m for m in data["models"]}
    tseen = set()
    for t in tasks["tasks"]:
        tid = t.get("id", "?")
        if tid in tseen:
            errors.append(f"duplicate task id: {tid}")
        tseen.add(tid)
        for key in ("id", "label", "blurb", "min_tps", "ranked"):
            if t.get(key) in (None, "", []):
                errors.append(f"task {tid}: missing {key}")
        lists = [("ranked", t.get("ranked", []))]
        for r in t.get("phone_ranked", []):
            if r.get("id") not in ids:
                errors.append(f"task {tid} phone_ranked: unknown model '{r.get('id')}'")
        if t.get("companion"):
            lists.append(("companion", t["companion"].get("ranked", [])))
        for name, ranked in lists:
            seen = set()
            for r in ranked:
                rid = r.get("id")
                if rid not in ids:
                    errors.append(f"task {tid} {name}: unknown model '{rid}'")
                elif rid in seen:
                    errors.append(f"task {tid} {name}: duplicate model '{rid}'")
                seen.add(rid)
            if not any(ids.get(r.get("id"), {}).get("tag") for r in ranked):
                errors.append(f"task {tid} {name}: no model with an Ollama tag")
        for src in t.get("sources", []):
            if not str(src.get("url", "")).startswith("https://") or not src.get("title"):
                errors.append(f"task {tid}: each source needs a title and an https url")
        if t.get("sources") and not t.get("sources_checked"):
            errors.append(f"task {tid}: sources need a sources_checked date")
        uses_companion = any("{companion_tag}" in (s.get("body", "") + s.get("cmd", "")) for s in t.get("steps", []))
        if uses_companion and not t.get("companion"):
            errors.append(f"task {tid}: steps use {{companion_tag}} but there is no companion")
    for s in tasks.get("common_steps", []):
        if not s.get("title") or not s.get("body"):
            errors.append("common_steps: every step needs a title and body")
    return errors


def validate(data, machines):
    errors = []
    seen = set()
    log = data.get("log", [])
    last = {}
    for e in log:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(e.get("date", ""))) or e.get("change") not in ("added", "removed") or not e.get("id") or not e.get("name"):
            errors.append(f"log entry needs date (YYYY-MM-DD), change (added/removed), id and name: {e}")
            continue
        last.setdefault(e["id"], e["change"])  # the log is newest first
    ids_now = {m["id"] for m in data["models"]}
    baseline = set(data.get("baseline", []))
    for mid in ids_now:
        if last.get(mid) != "added" and mid not in baseline:
            errors.append(f"{mid}: is listed but the log has no 'added' entry for it (add one to the log in models.json, newest first)")
    for mid, ch in last.items():
        if ch == "removed" and mid in ids_now:
            errors.append(f"{mid}: log says removed but it is still listed")
    for m in data["models"]:
        mid = m.get("id", "?")
        if mid in seen:
            errors.append(f"duplicate model id: {mid}")
        seen.add(mid)
        for key in ("id", "name", "family", "params_b", "arch", "uses"):
            if m.get(key) in (None, ""):
                errors.append(f"{mid}: missing {key}")
        if m.get("size_gb") is None and m.get("mem_gb") is None:
            errors.append(f"{mid}: needs size_gb or mem_gb")
        for u in m.get("uses", []):
            if u not in USES:
                errors.append(f"{mid}: unknown use case '{u}'")
        for s in m.get("src", []):
            if s not in data["sources"]:
                errors.append(f"{mid}: unknown source '{s}'")
    for mc in machines:
        for tag, v in (mc.get("measured") or {}).items():
            if not isinstance(v, (int, float)) or v <= 0:
                errors.append(f"machine {mc['id']}: measured['{tag}'] must be a positive number (tokens/s)")
    for k, s in data["sources"].items():
        if not s.get("checked"):
            errors.append(f"source '{k}': missing 'checked' date")
    mseen = set()
    for mc in machines:
        if mc["id"] in mseen:
            errors.append(f"duplicate machine id: {mc['id']}")
        mseen.add(mc["id"])
        for key in ("id", "name", "cpu", "ram_gb", "ram_bandwidth_gbps"):
            if mc.get(key) in (None, ""):
                errors.append(f"machine {mc.get('id', '?')}: missing {key}")
    return errors


def validate_clients(clients, tasks):
    errors = []
    ids = set()
    for c in clients["clients"]:
        if c["id"] in ids:
            errors.append(f"duplicate client id: {c['id']}")
        ids.add(c["id"])
        for key in ("name", "kind", "blurb", "docs", "checked", "steps", "address", "engine"):
            if not c.get(key):
                errors.append(f"client {c['id']}: missing {key}")
    for c in clients["clients"]:
        x = c.get("context")
        if x:
            for key in ("checked", "sources", "files", "example"):
                if not x.get(key):
                    errors.append(f"client {c['id']}: context is missing {key}")
            for s in x.get("sources", []):
                if not str(s.get("url", "")).startswith("https://"):
                    errors.append(f"client {c['id']}: context source needs an https url")
    if not clients.get("context_general", {}).get("tips"):
        errors.append("clients: context_general needs tips")
    for t in tasks["tasks"]:
        for cid in t.get("clients", []):
            if cid not in ids:
                errors.append(f"task {t['id']}: unknown client '{cid}'")
        for cid in t.get("phone_clients", []):
            if cid not in ids:
                errors.append(f"task {t['id']}: unknown phone client '{cid}'")
        if t.get("clients") and not t.get("ctx"):
            errors.append(f"task {t['id']}: has clients but no ctx")
    return errors


SCREEN_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
SCREEN_WARN_BYTES = 400 * 1024


def validate_tutorials(tutorials, clients):
    errors = []
    ids = {c["id"] for c in clients["clients"]}
    for cid, t in tutorials["tutorials"].items():
        if cid not in ids:
            errors.append(f"tutorial for unknown client '{cid}'")
        for key in ("title", "intro", "walkthrough", "sources", "checked"):
            if not t.get(key):
                errors.append(f"tutorial {cid}: missing {key}")
        for step in t.get("walkthrough", []):
            if not step.get("title") or not step.get("body"):
                errors.append(f"tutorial {cid}: step needs title and body")
    return errors


def validate_ollama(o):
    errors = []
    srcs = o.get("sources", {})
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(o.get("checked", ""))):
        errors.append("ollama.json needs checked: YYYY-MM-DD")
    for sid, s in srcs.items():
        if not str(s.get("url", "")).startswith("https://") or not s.get("title") or not isinstance(s.get("official"), bool):
            errors.append(f"ollama.json source {sid} needs title, https url and official true/false")
    for g in o.get("groups", []):
        if not g.get("title") or not g.get("items"):
            errors.append("ollama.json: every group needs a title and items")
        for it in g.get("items", []):
            if not it.get("cmd") or not it.get("what"):
                errors.append(f"ollama.json: item needs cmd and what: {it}")
            if not it.get("src") or any(s not in srcs for s in it["src"]):
                errors.append(f"ollama.json: item needs src ids that exist in sources: {it.get('cmd')}")
    return errors


def load_screens(tutorials):
    """Inline screenshots named by `shot` fields from screens/ as data: URIs. Missing files are simply skipped."""
    shots = {}
    wanted = {s["shot"] for t in tutorials["tutorials"].values() for s in t.get("walkthrough", []) if s.get("shot")}
    for name in sorted(wanted):
        for ext, mime in SCREEN_TYPES.items():
            f = ROOT / "screens" / (name + ext)
            if f.is_file():
                raw = f.read_bytes()
                if len(raw) > SCREEN_WARN_BYTES:
                    print(f"warning: screens/{f.name} is {len(raw) // 1024} KB; crop or shrink it", file=sys.stderr)
                shots[name] = f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")
                break
    return shots


def js_json(obj):
    # Safe to embed inside a <script> block.
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def main():
    public = "--public" in sys.argv
    data = load("models.json")
    machines = load("machines.json")
    tasks = load("tasks.json")
    clients = load("clients.json")
    tutorials = load("tutorials.json")
    osdata = load("os.json")
    ollama = load("ollama.json")
    errors = validate(data, machines) + validate_tasks(tasks, data) + validate_clients(clients, tasks) + validate_tutorials(tutorials, clients) + validate_ollama(ollama)
    if errors:
        print("Validation failed:", *errors, sep="\n  ", file=sys.stderr)
        return 1
    if public:
        machines = [{k: v for k, v in mc.items() if k != "hostname"} for mc in machines]
    html = (ROOT / "src" / "template.html").read_text(encoding="utf-8")
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    built = datetime.date.today().isoformat()
    tokens = {
        "/*__MODELS_JSON__*/null": data,
        "/*__MACHINES_JSON__*/null": machines,
        "/*__TASKS_JSON__*/null": tasks,
        "/*__CLIENTS_JSON__*/null": clients,
        "/*__TUTORIALS_JSON__*/null": tutorials,
        "/*__SCREENS_JSON__*/null": load_screens(tutorials),
        "/*__OS_JSON__*/null": osdata,
        "/*__OLLAMA_JSON__*/null": ollama,
        "/*__VERSION_JSON__*/null": {"version": version, "built": built},
    }
    for token, payload in tokens.items():
        if token not in html:
            print(f"Template is missing {token}", file=sys.stderr)
            return 1
        html = html.replace(token, js_json(payload))
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    # The page can fetch this file from GitHub so data updates do not need a new page.
    bundle = {"schema": 1, "version": version, "built": built, "data": data, "tasks": tasks, "clients": clients, "tutorials": tutorials, "os": osdata, "ollama": ollama}
    (ROOT / "data.json").write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Built index.html v{version} ({built}): {len(data['models'])} models, {len(machines)} machine(s), {len(tasks['tasks'])} tasks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
