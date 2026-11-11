# Local-AI

A free, open-source, local guide to open-weight AI models. Pick your machine and what you want to do (chat, code in your editor, a coding agent, reasoning, document Q&A, vision, automations) and the page recommends one model, explains why, and gives copy-paste steps to run it. Below that is the full sortable, filterable matrix of all models with fit estimates per machine.

Open `index.html` in a browser. It is fully self-contained and works offline, including from a phone.

## What's here

| File | Purpose |
|---|---|
| `models.json` | Model data (hand-editable): size, memory needs, context, license, use cases, Ollama tag, sources |
| `machines.json` | Your machines and their specs |
| `clients.json` | Tools that connect to Ollama (Open WebUI, Continue, Cline, opencode, Aider): setup steps and copy-paste configs |
| `data.json` | Generated bundle of models, tasks and tools. The live page fetches it from GitHub so data updates reach it without a new page |
| `calibration.md` | How to measure real speeds and put them in `machines.json` (`measured`) |
| `tasks.json` | Per task: models ranked by quality, speed target, and the how-to-run steps |
| `src/template.html` | The page (HTML, CSS and JS) |
| `build.py` | Validates the JSON and inlines it into `index.html` |
| `index.html` | Generated output. Don't edit it by hand |

## Update

```
python3 build.py
```

## Add a machine

Append an entry to `machines.json` (it also has an optional `hostname` field: remove it before making the repo public). Fields: `id`, `name`, `hostname` (optional), `cpu`, `ram_gb`, `ram_usable_gb`, `ram_bandwidth_gbps`, `gpu`, `vram_gb`, `vram_bandwidth_gbps`, `unified_memory` (true for Apple Silicon: then only `ram_gb` and `ram_bandwidth_gbps` matter), `os_family` (`windows`, `mac` or `linux`: chooses the install steps shown), `os_reserve_gb` (optional: RAM kept free for the OS, default 5; use a lower value for lightweight Linux boxes). Set `no_ollama` to `true` (with an optional `no_ollama_note`) for a machine that cannot run Ollama at all: the page then shows the note instead of recommendations. Set `vram_gb` to 0 for machines with no usable GPU: they are shown as CPU only. Then run `python3 build.py`.

## Add or reorder task picks

In `tasks.json`, each task lists models best-first by quality. The page picks the highest-ranked model that actually runs at the task's speed target (`min_tps`) on the selected machine. Add a short `why` only where a source supports it. The order is editorial judgment, so reorder it freely.

## Add a model

Append an entry to `models.json`. Give either `size_gb` (Q4 weights) or `mem_gb` (footprint at ~8K context). For mixture-of-experts models set `"arch": "moe"` and `active_b`. Set `lic_verified` to `true` only after checking the model card. Also fill `maker`, `released` (YYYY, YYYY-MM or YYYY-MM-DD) and `page`; set `rel_ok` to `true` only if the date came from a source you checked (otherwise the page shows a `?`).

## Notes

- Fit and speed figures are estimates (memory-bandwidth model); see "How the fit and speed estimates work" on the page.
- Data was compiled on 2026-10-24 from the sources listed at the bottom of the page. Verify before relying on it.

## Versions and keeping data fresh

- `VERSION` is shown on the page (with the build date). Bump it when you change data: patch for fixes, minor for new models or machines, major for layout changes.
- Each source in `models.json` has a `checked` date (when it was last read for this page, not when it was published). Update it when you re-read a source.
- The page shows a yellow warning when the data is more than 30 days old.
- `python3 freshness.py` lists old sources and every release date or license that is still unconfirmed.

## Setup layers and tools

The page assumes four layers: **Ollama** (engine, `http://localhost:11434`) -> **model** (the recommended tag) -> **settings** (mainly context length) -> **tool** (what you type into). Ollama is the only assumed piece; the tool is a choice. Tools are not assumed: each task lists the ones that suit it in `clients` (first is the default), and the page fills `{tag}`, `{ctx}` (the task's `ctx`, Ollama context in tokens) and `{roles}` (the task's optional `vars.roles`) into the tool's steps.

To add a tool (for example Hermes Agent or LM Studio), add an entry to `clients.json` with steps taken from the tool's own docs, set `docs` and `checked`, then add its id to the `clients` list of the tasks it suits. Do not write config from memory: `build.py` requires a docs link and a checked date for every tool.

The tool you click is remembered per task in the browser (localStorage), so for a personal setup just click your tool once. The first tool in a task's `clients` list is the default for new visitors: reorder it to change that. Hermes Agent is listed first for the coding agent task, and its client sets `ctx` to 65536 because Hermes needs at least 64K tokens of context; a client-level `ctx` overrides the task's.

## Keeping it current

See `REFRESH.md` (monthly facts refresh, quarterly ranking review, speed calibration, and the rule for which models are listed) and `CHANGELOG.md`.

## Going public

- `python3 build.py --public` builds `index.html` without machine hostnames. Your own machines are still in the file: for a public site, remove them from `machines.json` (or keep one example) so visitors start with the add-a-machine form. Visitors' machines are stored only in their browser.
- The page tries to load `data.json` from `https://raw.githubusercontent.com/adambeltz2/local-ai-site/main/data.json` when it opens and uses it if it is newer than the built-in data and consistent. If the data format ever changes in a way the page cannot read, bump `schema` in `build.py` and the page.
- Host `index.html` with GitHub Pages (Settings > Pages) for a link that works on a phone.
- The code is MIT-licensed (`LICENSE`). Model licenses are the model makers' own; the page only reports them.

## Tests

`npm install` (test tools only), then `npm test`. They load the built page in a simulated browser and check every machine x task, the add-a-machine form, measured speeds, remote data loading and the public build.

## Tutorials and screenshots

`tutorials.json` holds a first-session walkthrough per tool (keyed by the tool's id in `clients.json`): intro, first task, example prompts, steps, key commands, cautions and sources. Only state what the tool's own docs say, and give every tutorial its sources and a checked date.

To add a real screenshot, save it in `screens/` using the name from the step's `shot` field (for example `screens/opencode-start.png`), then run `python3 build.py`. The page embeds it so it still works offline. Crop to the relevant part, keep it under about 1200 px wide, and make sure no personal information is visible. List of expected names: `screens/README.md`.

## Operating system advice

`os.json` holds the evidence and sources behind the Windows/Linux/macOS advice (and `linux_reserve_gb`, the memory a light Linux install is assumed to keep for itself, used to check whether the recommendation would change). Refresh it with the other sources and update `checked`. Numbers there are reports, not measurements: measure on the machine (see `calibration.md`) before switching.

## Phones

A machine with `"phone": true` (the Pixel 9a) runs models in an app instead of Ollama. The page shows the app's steps and a short stack instead of the Ollama steps, and skips the OS advice. Apps live in `clients.json` with `"phone": true`, and a task offers them through `phone_clients`. Only chat and reasoning have one so far (PocketPal AI). Phone memory and speed figures are rough: measure with the app's Benchmark page and record the result under `measured`.
