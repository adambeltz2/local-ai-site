# Changelog

Newest first. Versions are in `VERSION` and shown on the page.

## 1.17.5 (2026-11-10)
- First real speed measurement: Acer Nitro Laptop running gpt-oss:20b generates 9.86 tokens/s (`ollama run --verbose`, 71%/29% CPU/GPU, 14 GB, context 4096). The page estimated 9.1. Recorded as `measured` (9.9) and in `calibration.md`.

## 1.17.4 (2026-11-10)
- "This computer will run all the time" now explains why: Windows restarts itself for updates, and Ollama on Windows starts at sign-in rather than boot, so the service can go down; Windows also idles at about 3.5 to 4 GB RAM versus under 0.5 GB for headless Linux (one review). Added how to expose Ollama to other computers (OLLAMA_HOST).
- Power use checked: no reliable evidence either way (forum readings go both ways and trace to drivers), so the page says it is not a reason.
- Sources: Microsoft Learn (restarts, active hours), Ollama FAQ, two forum threads.

## 1.17.3 (2026-11-10) refresh
- No new models added. Ollama 0.40.16 (Nov 9) read: adds Ripple Preview, uses about 27 GiB less memory for Qwen3.8 Flash Next on Apple silicon, Windows on ARM CUDA 13.5, a llama.cpp update, and Claude Code routing fixes in `ollama launch`. No change to the steps.
- Not added: Ripple Preview (Ricursive Intelligence, 65B dense, Apache-2.0, 38.8 GB default tag; the vendor claims 80.52 on Terminal-Bench 2.1; Ollama's page lists a 2M context against the maker's 1M). Dense, so on the 128 GB desktop it would run at about 1 token/s; it fits no other machine here. LongCat-2.5 (MIT, 1.6T total, 48B active) needs rack-scale hardware.
- benchlm's Nov 10 ranking: order of the models we track is unchanged apart from Qwen3.6-27B and Qwen3.5-27B swapping places; notes updated. gpt-oss 120B's score fell from 40.74 to 32.09 in three days (cause not found); noted on the model.
- Recommendations: none changed.

## 1.17.2 (2026-11-08) refresh
- No new models added. Ollama 0.40.15 final (Nov 6) re-read: nothing beyond what 1.17.0 covered, plus Kimi Code CLI in `ollama launch`. The Nov 7 ranking at benchlm.ai was re-read; the order of the models we track is unchanged and scores moved by under 1 point (notes updated: Qwen3.8 27B 54.62, Bonsai 2 27B 53.77, Flash Next 55.87, Ornith 9B 33.66). MiMo V2.6 9B is not on benchlm's list; its Ollama page was read on Nov 6.
- Seen and not added: Ripple-65B Preview (Apache-2.0, 65B dense, Nov 4; no Ollama build found), Kimi K3.1 Pro (2.8T; rack-scale hardware), Inkling 2 Small (not public yet). A third decision-model family (Celeris-1.1 Decision) now sits beside the d3 and AutoTrust models.
- Recommendations: none changed.

## 1.17.1 (2026-11-06)
- Added Qwen 3.8 Flash Next 125B in Unsloth's 3-bit file (89.5 GB; 125B mixture-of-experts, about 6B active; Qwen Community License 1.0). It was on benchlm's list but not in this one because the Ollama library tag is a 105 GB Apple-only build and the 4-bit file is too large for any machine here. Unsloth's Dynamic v3.1 files (Nov 4, 66 to 111 GB) make a 3-bit version possible on the desktop's 128 GB. Page estimate for the desktop: partly in RAM, about 5 tokens/s, against about 44 for Bonsai 2 27B and 4.5 for Qwen 3.8 27B. Quality: benchlm 56.12 vs 54.55 (Qwen 3.8 27B) and 54.0 (Bonsai), before quantization costs (Unsloth reports 88% top-answer match at 3-bit). Not ranked; no recommendation changed.

## 1.17.0 (2026-11-06) refresh
- Added Ornith 1.5 9B (DeepReinforce, built on Qwen3.5 9B, MIT per two articles since Ollama's page names no maker or license; maker-claimed 70.6 on SWE-bench Verified) and MiMo V2.6 9B (Xiaomi, MIT, 256K context, vision, tools, thinking, added to Ollama in 0.40.15; no benchmark read).
- Finance task: Qwen 3.8 27B's 48.6% is now cited to benchlm's Finance Agent v2 table (verified 2026-10-29) instead of a vendor summary. In November the benchmark moved to v2.1, whose scores are not comparable; no v2.1 score for Qwen 3.8 27B was found.
- Ollama 0.40.15 (2026-11-03) reviewed: MiMo V2.6 9B, AutoTrust decision models, YaRN long context for Qwen3 and Qwen3.5, launcher changes. No change to the steps.
- Recommendations: none changed (49 machine-task pairs compared). Proposals awaiting approval: rank Bonsai 2 27B (benchlm Nov 5: 54.0 vs Qwen 3.8 27B 54.55), Ornith 1.5 9B and MiMo V2.6 9B for coding agent and automations; a Decision category for the AutoTrust and d3 models.

## 1.16.0 (2026-11-04)
- New task: Financial analysis (filings, statements, numbers), with the approach written as steps: give clean labeled text and units, make the model quote its source for every figure, have it write the math as code instead of calculating, check each figure against the source line, and treat modeling and judgement as a draft. Each step is tied to a source (Finance Agent v2 via sec-api.io, an ACL 2024 paper on financial table math, finextract's 10-K test, a vendor blog).
- Ranking is editorial where no finance score was found, and the page says so. Qwen 3.8 27B leads on the one public benchmark found (48.6%, a vendor's summary of Vals AI's leaderboard); the better-scoring open models there need multi-GPU servers and are not listed. Minimum speed for this task is 4 tokens/s because accuracy matters more than speed.
- Tasks can now list evidence links and a checked date (shown under "More detail").
- Not added: Ling 3.0 Flash Fin and Fin-R1 7B (no Ollama tag or license/weights found); Bonsai 2 27B still awaits ranking approval.

## 1.15.0 (2026-11-04) refresh
- Added Bonsai 2 27B (ternary, PrismML, Apache-2.0 plus Qwen terms; Ollama tag bonsai-2:27b, 8.3 GB). Maker claims 98.2% of full-precision Qwen3.8 27B on its own suite; benchlm.ai's Oct 29 ranking has it level with Qwen3.8 27B. Release date not found. Needs Ollama 0.40.6 or later; stock LM Studio may not load it.
- Ollama 0.40.14 reviewed (no model, speech or platform changes). Download sizes of Qwen3.8 27B, Gemma 4 31B, Granite 4.2 8B and LFM3 1.7B matched benchlm's Oct 28 reading of Ollama's library.
- Recommendations: none changed (the new model is not yet ranked). Proposal awaiting approval: rank Bonsai 2 27B for coding agent, chat, reasoning and vision. By the page's estimate it fits entirely in the desktop's 11 GB card (about 44 tok/s, against 4.5 for Qwen3.8 27B with offload), and runs on the Acer (about 7) and MacBook Air (about 7) where Qwen3.8 27B does not fit. The speed estimate assumes ordinary kernels and is unverified for ternary weights.
- Not added: Ornith-1.5 9B (Ollama's page states no license or maker). Not covered: Mistral Large 4 and DeepSeek V4.1 Flash (too large to run locally).

## 1.14.0 (2026-10-31)
- New collapsible "Get more from it: memory and context files" under each tool: six general tips for small local models, plus for opencode, Hermes, Aider, Cline and Continue the file names and locations, notes and a copyable example file, with sources. Other tools say they have not been looked up yet.
- Aider's entry comes from a community guide and Continue's from a docs mirror (the official pages could not be fetched); both are labeled on the page. The advice to start Cline with two Memory Bank files, and the "short specific lines" tip, are this page's rules of thumb, and say so.

## 1.13.0 (2026-10-30) monthly refresh
- Added LFM3 1.7B (text, 256K context, tools) and LFM3-Audio 2B (speech: Ollama's page lists speech to text, text to speech and translation; its release notes confirm text to speech on Linux and Windows from 0.40.13). Both are Liquid AI under the LFM Open License v1.0; release dates are unconfirmed (Ollama added them 2026-10-27).
- opencode: Ollama now offers `ollama launch opencode` (note added; manual steps unchanged). Hermes: added the `hermes setup` wizard option. Hermes and opencode docs re-read 2026-10-30; the other tools' docs could not be fetched this session, so their `checked` dates stay at 2026-10-24.
- Not added: Mistral Large 4 (open weights since 2026-10-29, about 1T parameters with 52B active; on Ollama it is a cloud model, and it needs multiple data-center GPUs), the d3 decision models (a new category, proposal below), Laguna XS.2.1 (Ollama's page names no maker). Proposals awaiting approval: a Decision category for d3 (Apache-2.0, 2B to 27B); LFM3 1.7B as a phone and low-RAM chat candidate.

## 1.12.0 (2026-10-26)
- Five models from PocketPal's built-in list added to the data (SmolLM3 3B, LFM2 2.6B, Qwen3 1.7B, LFM2.5 1.2B, Gemma 3 1B), with makers, licenses and sources read from their cards where available. Phone recommendations (chat, reasoning) now prefer these, so the pick can be downloaded with one tap; Phi-4-mini stays as a stronger option that needs the Hugging Face route. The phone ranking is editorial: no benchmark compares these on the Pixel.

## 1.11.1 (2026-10-26)
- Phone: the page now says when the recommended model is not in PocketPal's built-in list (it needs the + button and a Hugging Face search) and lists the models that are built in. The list was read from the app on the owner's phone, so it may differ by version.

## 1.11.0 (2026-10-26)
- New machine: Pixel 9a (phone, 8 GB, Tensor G4). Phones run models in an app, not Ollama, so the page shows a phone path instead of the Ollama steps and OS advice.
- New tool: PocketPal AI (Android and iPhone, MIT). Offered for the chat and reasoning tasks; tasks that only have computer tools say so on a phone.
- The memory and speed numbers for the phone (3.5 GB kept for Android, 51 GB/s) are rough guesses and the page labels the speed as an upper bound until measured with the app's Benchmark.

## 1.10.0 (2026-10-26)
- "Which operating system?" advice under Connect a tool, per machine, task and tool: stay on macOS / Linux / Windows, or consider Linux. Uses the page's fit model to say whether a lighter OS would change the recommended model, plus reported speed gaps, WSL2 cost, graphics-memory and RAM overhead, Ollama's NVIDIA/AMD support by OS, and tool notes (opencode recommends WSL; Hermes runs natively on Windows). An "always-on server" toggle tips Windows machines toward Linux. Evidence and sources in `os.json`; weak evidence is labeled as such.

## 1.9.0 (2026-10-26)
- "Your stack" diagram under Connect a tool: You > Tool > Engine > Settings > Model > Hardware for the selected machine, task and tool, with the address the tool uses. A checkbox shows the two-computer version (tool on one computer, model on another) with the network address and the OLLAMA_HOST note. LM Studio shows its own engine and port. Each tool in `clients.json` now has `address` and `engine`.

## 1.8.0 (2026-10-26)
- Tutorials under each tool's setup steps (collapsed): first task, example prompts with copy buttons, a walkthrough, keys and commands, and what to watch out for. Written for opencode, Aider, Cline, Continue, Hermes Agent and Open WebUI from each tool's own docs; LM Studio, Goose and AnythingLLM have none yet because their usage docs were not read.
- Screenshot slots: a real screenshot placed in `screens/` with the name a step expects is embedded in the page. None are included: they cannot be captured from the build environment and the page does not fake them.

## 1.7.0 (2026-10-26)
- New "Speech" category and two models: Phonon (Gradium, text to speech, the speech feature in Ollama's Oct 24 blog post, v0.40.11; macOS on Apple silicon for now, Windows/Linux "coming soon"; English is Apache-2.0, the 40M language models are CC BY-NC noncommercial) and Granite 4.1 Speech 2B (IBM, speech to text; a community upload on Ollama, not an official library model).
- Gemma 4 E2B/E4B/12B notes: Google says they can transcribe speech (30 second clips) but Ollama's audio input support is not confirmed.
- No speech task or recommendation yet: Ollama has not documented a speech-to-text feature of its own (checked 2026-10-26).

## 1.6.0 (2026-10-24)
- Code help as I type: re-checked against Continue's docs. Qwen2.5-Coder 7B and 1.5B (new in the list) now lead; Phi-4 mini and DeepSeek-Coder-V2 removed from this task (not confirmed for autocomplete); large models noted as no real gain.
- Code agent: Qwen 3.8 27B ranked first (applied when you asked for the list of improvements).
- Add-your-own-machine form (browser only), export/import, remove. RAM bandwidth can be worked out from speed and channels.
- Measured speeds (`measured` in `machines.json`) override estimates; `calibration.md` explains how to collect them.
- Page loads newer `data.json` from GitHub when available (falls back silently).
- New comparison table: chat vs reasoning vs documents. "Short by about N GB" lines for models that don't fit. "Sources last read" per model. Filter to hide unconfirmed models.
- `build.py --public`, MIT `LICENSE`, estimates disclaimer. External links must be https.

## 1.5.0 (2026-10-24) - monthly refresh
- Added Qwen 3.8 27B (Aug 14, 2026, Apache 2.0, 18 GB), Flint 40B (Recursive, Apache 2.0, MoE) and Nemotron 3.5 Bolt E4B (NVIDIA, OpenMDW license). None of them is ranked in `tasks.json` yet: ranking proposals are in the pull request.
- Confirmed from Ollama's pages: Gemma 3 license; Mistral 7B license and date (v0.3, May 22, 2024); DeepSeek-R1 license (MIT) and that Ollama's 8b tag is the May 2025 "0528" update. Corrected sizes/context for Gemma 3, Phi-4 mini, Qwen3 8B, Llama 3.1 8B.
- Could not confirm on Ollama's pages (their pages do not name licenses): Phi-4, Phi-4 mini, Qwen3, Qwen 3.5, Llama 3.1.

## 1.4.1 (2026-10-24)
- "Code help as I type" now says it needs an editor that supports extensions (Continue: VS Code and JetBrains).

## 1.4.0 (2026-10-24)
- Added tool setups: LM Studio (alternative to Ollama), Goose, AnythingLLM. Jan skipped: docs gave no usable setup details.

## 1.3.0 (2026-10-24)
- Added Hermes Agent (64K context step, remote-Ollama note). The chosen tool is remembered per task in the browser.

## 1.2.0 (2026-10-24)
- New "Connect a tool" section with verified steps and configs for Open WebUI, Continue, Cline, opencode, Aider, filled in with the recommended model's tag and a context size per task.
- "How the pieces fit together" explainer (engine, model, settings, tool).

## 1.1.0 (2026-10-24)
- Version and build date shown on the page; each source shows a "checked" date.
- Yellow banner when data is more than 30 days old; `freshness.py` report.

## 1.0.0 (2026-10-24)
- Models: maker, release date, license and Ollama page shown in the table and in an "About this model" box. Added Devstral Small 2 and Gemma 4 12B; relabeled the original Devstral; confirmed Gemma 4 and EmbeddingGemma 2 licenses; added caveats for Bonsai 2.
- Earlier work on the same day: model matrix, six machines, task-first recommendations, plain-language verdicts, coding comparison table, CPU-only and Apple-silicon handling, OS-specific install steps.

Release dates for 32 of 46 models and licenses for 22 are still unconfirmed (marked `?` on the page).
