# Refresh runbook

How to keep Local-AI current. Follow this every time, whoever does it (a person or a Claude session). The rule behind all of it: **never present something as verified unless a source was read for it.** Mark the rest with `?`.

## Cadence

| Job | When | Who |
|---|---|---|
| Facts refresh (steps 1-7) | Monthly | Automated or by asking Claude: "do the monthly refresh" |
| Ranking review (step 8) | Quarterly, or after a major release | A person approves; Claude proposes with evidence |
| Speed calibration (step 9) | When a machine is added, and yearly | The owner runs one command per machine |

**Categories to watch each month:** finance (re-check the finance task's evidence links and any finance-tuned model with an Ollama tag), speech (text to speech, speech to text), decision/scoring models, and any new Ollama capability tag. Check Ollama's release notes, not only the model library.

## Inclusion rule (what earns a place in `models.json`)

A model is added only if all are true:
1. It has an Ollama tag (the page never recommends a model Ollama cannot run).
2. Its license is stated by the maker or the Ollama page.
3. It beats something already listed for at least one task, or fits a machine class that has no good option yet (for example a 6 GB GPU or a CPU-only box).

A model is retired (removed, with a CHANGELOG note) when a newer model from the same maker replaces it at the same size and nothing else keeps a reason to list the old one. Target size: 40 to 60 models. If a task's ranked list references a retired id, move the reference first (`build.py` will fail otherwise).

## Monthly facts refresh

1. **Run `python3 freshness.py`.** It lists sources not re-read in 30+ days and every release date or license still marked unconfirmed.
2. **Search for new releases** in each family: Qwen, Gemma, Llama, Mistral (including Devstral, Codestral, Magistral), DeepSeek, OpenAI gpt-oss, IBM Granite, Microsoft Phi, plus embedding and vision models. Also search "best Ollama models" lists for newcomers. Use WebSearch, then read the maker's announcement and the Ollama library page for each candidate.
3. **For each candidate that passes the inclusion rule**, add it to `models.json` with: tag, size_gb (from the Ollama page), ctx_k, params_b (and active_b for MoE), license, maker, released, page, uses, and a one-line note. Set `rel_ok` and `lic_verified` to `true` only if a fetched source gave the date or license. Quote benchmark numbers only if the source gave them, and say whose claim it is.
4. **Re-check existing models** whose Ollama size, tag or license changed. Fix `size_gb`, `tag`, `notes`.
5. **Re-read the tool docs** in `clients.json` and the tutorials in `tutorials.json`, the memory and context file details (`context` in `clients.json`), and the OS evidence in `os.json` (Ollama install, opencode, Hermes, Aider, Cline, Continue, Open WebUI, LM Studio, Goose, AnythingLLM). Update any step that changed and set each tool's `checked` date. If a doc moved or could not be read, say so; do not keep steps you cannot confirm.
6. **Update `checked`** on every source you re-read in `models.json`, set `updated` to today, and add new sources to the `sources` map.
7. **Rebuild and test:** `python3 build.py`, then the test suite (`npm install` once, then `npm test`). Bump `VERSION` (patch for fixes, minor for new models or tools), add a `CHANGELOG.md` entry, commit on a branch named `refresh-YYYY-MM`, push, and report.

## Ranking review (needs a person's approval)

8. For each new model, propose where it belongs in each task's `ranked` list in `tasks.json`, with the evidence (benchmark source and whose claim it is, size, speed on the owner's machines). Do not reorder the lists without approval. Check agent tasks for the `tools` tag on the model's Ollama page. Record accepted changes in the CHANGELOG with the reason.

## Speed calibration

9. On each machine run `ollama run <tag> --verbose` and note the "eval rate" (tokens per second). Compare to the page's estimate for that machine and model. If estimates are consistently off by more than about 30 percent, adjust `EFF` or `MOE_EFF` in `src/template.html` and record the measurements in `calibration.md`.

## Report format

End every refresh with: models added, retired, re-ranked proposals awaiting approval, tool steps that changed, anything that could not be verified, and the new version number.
