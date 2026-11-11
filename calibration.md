# Speed calibration

The page's speeds are estimates from memory bandwidth. Real measurements make them trustworthy.

## How to measure (about 2 minutes per model)

1. Run the model with timing turned on:
   ```
   ollama run <tag> --verbose
   ```
2. Ask something that gives a long answer ("Explain how a bicycle works in 300 words").
3. When it finishes, Ollama prints stats. Note the **eval rate** (tokens/s). Ignore "prompt eval rate".
4. Add it to that machine in `machines.json`:
   ```json
   "measured": { "qwen3.8:27b": 14.2, "gpt-oss:20b": 31.5 }
   ```
   Keys are Ollama tags exactly as on the page. Then run `python3 build.py`. The page shows measured numbers as "14 (measured)" instead of "~14".

## Compare with the estimate

Record measured against estimated below. If estimates are consistently off by more than about 30 percent, tell Claude to adjust `EFF` / `MOE_EFF` in `src/template.html`.

| Machine | Model tag | Estimated tok/s | Measured tok/s | Date | Notes (ollama ps PROCESSOR) |
|---|---|---|---|---|---|
| Acer Nitro Laptop | gpt-oss:20b | 9.1 | 20.87 | 2026-11-10 | Second prompt in the same session (197 tokens, prompt eval 70.9 tok/s). `ollama ps` showed 71%/29% CPU/GPU, 14 GB, context 4096 (checked before this run). The first prompt after loading measured only 9.86 tok/s generation and 1.94 tok/s prompt eval, so always use the second run. The estimate was about 2.3 times too low. One data point: do not change `MOE_EFF` until more machines are measured. |

Run a prompt twice and record the second: the first one after loading is slow.

Useful first measurements: one model that fits fully in the Acer's 6 GB GPU, one that spills into RAM, one on the Threadripper box with the 2080 Ti, and one on the MacBook Air.
