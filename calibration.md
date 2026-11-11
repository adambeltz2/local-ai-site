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
| | | | | | |

Useful first measurements: one model that fits fully in the Acer's 6 GB GPU, one that spills into RAM, one on the Threadripper box with the 2080 Ti, and one on the MacBook Air.
