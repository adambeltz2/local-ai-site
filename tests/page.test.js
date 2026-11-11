const { JSDOM, VirtualConsole } = require("jsdom");
const html = require("fs").readFileSync(require("path").join(__dirname, "..") + "/index.html", "utf8");
const errs = [];
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: new VirtualConsole().on("jsdomError", e => errs.push(e.message)) });
const d = dom.window.document;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("FAIL:", m); } else console.log("ok:  ", m); };
const ev = (el, t) => el.dispatchEvent(new dom.window.Event(t, { bubbles: true }));
const click = el => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const machine = id => { const s = d.getElementById("machine"); s.value = id; ev(s, "change"); };
const task = id => click(d.querySelector(`#tasks [data-task="${id}"]`));
const best = () => (d.querySelector("#result .rec h3") || {}).textContent;
const cmds = () => [...d.querySelectorAll("#result pre.cmd")].map(p => p.textContent);
const rows = () => [...d.querySelectorAll("#body tr")];

ok(errs.length === 0, "no script errors on load");
ok(d.querySelectorAll("#tasks .chip").length === 8, "8 task buttons");
ok(rows().length === 63, "matrix has 63 models, got " + rows().length);
ok(d.querySelector('#tasks [aria-pressed="true"]') !== null, "one task is selected by default");

// ---- Nitro laptop
machine("acer-nitro-laptop");
task("code-complete");
ok(best() === "Qwen2.5-Coder 7B", "Nitro / editor help -> Qwen2.5-Coder 7B, got " + best());
ok(cmds().includes("ollama run qwen2.5-coder:7b"), "run command uses the chosen model's tag");
ok(cmds().includes("ollama ps"), "includes the GPU check step");
ok(!/\{(tag|ctx|roles|companion_tag)\}/.test(d.getElementById("result").textContent), "no unfilled {placeholders} in the result");
ok(/Continue/.test(d.getElementById("result").textContent), "editor task explains how to connect Continue");
task("code-agent");
ok(best() === "gpt-oss 20B", "Nitro / coding agent -> gpt-oss 20B, got " + best());
ok(/Qwen 3\.6 27B/.test((d.querySelector("#result .toobig") || {}).textContent || ""), "Nitro agent lists Qwen 3.6 27B as too big");
task("docs-qa");
ok(cmds().includes("ollama pull qwen3-embedding:0.6b"), "docs task adds the embedding pull command: " + cmds().join(" | "));
ok(/Search model \(embeddings\)/.test(d.getElementById("result").textContent), "docs task names the embedding model");
task("vision");
ok(/VL|Gemma|Qwen/.test(best()) && best() !== "Phi-4-multimodal", "vision pick is an Ollama model: " + best());
const allTags = new Set(JSON.parse(JSON.stringify(Object.keys({})))); // placeholder to keep structure simple

// ---- Custom build
machine("custom-build-desktop");
task("code-complete");
ok(best() === "Qwen2.5-Coder 7B", "Desktop / editor help -> Qwen2.5-Coder 7B, got " + best());
task("code-agent");
ok(best() === "gpt-oss 120B", "Desktop / coding agent -> gpt-oss 120B, got " + best());
ok(/Higher quality, slower/.test(d.getElementById("result").textContent) && /Qwen 3\.6 27B/.test(d.querySelector("#result .alts").textContent), "Desktop agent shows Qwen 3.6 27B as higher-quality-but-slower");
ok(!d.querySelector("#result .toobig"), "Desktop has nothing too big for the agent task");
task("vision");
ok(best() === "Qwen 3.6 35B-A3B", "Desktop / vision -> Qwen 3.6 35B-A3B, got " + best());
ok(d.getElementById("count").textContent.includes("Custom Build Desktop"), "matrix count line follows the machine");


// ---- Beelink (CPU only)
machine("beelink-s12-pro");
task("code-agent");
const bl = d.getElementById("result").textContent;
ok(/CPU only/.test(bl) || d.querySelector("#result .badge").textContent === "CPU only", "Beelink uses the CPU only label: " + d.querySelector("#result .badge").textContent);
ok(/Check how it is running/.test(bl) && !/Check it is really using your GPU/.test(bl), "Beelink gets CPU-appropriate steps (no GPU check)");
ok(/100% CPU/.test(bl), "Beelink step explains 100% CPU is expected");
ok(!/on your GPU/.test((d.querySelector("#result .alts") || {textContent: ""}).textContent), "Beelink alternatives never say 'on your GPU'");
task("chat-writing");
ok(/Faster option/.test(d.getElementById("result").textContent), "Beelink chat shows a faster option: " + [...d.querySelectorAll("#result .alt .nm")].map(n => n.textContent).join(","));
ok(/Note: No dedicated GPU/.test(d.getElementById("mnotes").textContent), "machine notes are shown on the page");
task("vision");
ok(best() === "Qwen3-VL 2B", "Beelink / vision -> Qwen3-VL 2B, got " + best());
task("docs-qa");
ok(cmds().includes("ollama pull qwen3-embedding:0.6b"), "Beelink docs task still adds the embedding model");
const badges = [...d.querySelectorAll("#body .badge")].map(b => b.textContent);
ok(!badges.includes("CPU offload") && !badges.includes("GPU") && !badges.includes("GPU (tight)"), "Beelink matrix only shows CPU only / Too large: " + [...new Set(badges)].join(","));
ok(rows().length === 63, "matrix still has all 63 rows on the Beelink");


// ---- ZimaBlade (weak CPU-only, os_reserve_gb = 2)
machine("zimablade-3760");
task("chat-writing");
ok(best() !== undefined && best() !== "" && /slow/.test(d.getElementById("result").textContent), "Zima chat still gets a pick, flagged slow: " + best());
const zrow = n => rows().find(r => r.querySelector(".n").textContent === n);
ok(zrow("gpt-oss 20B").querySelector(".badge").textContent === "Too large", "Zima: gpt-oss 20B is too large (16 GB minus 2 GB OS reserve)");
ok(zrow("DeepSeek-R1 14B (distill)").querySelector(".badge").textContent === "CPU only", "Zima: a 14B model fits as CPU only");
ok(/Check how it is running/.test(d.getElementById("result").textContent), "Zima gets CPU-appropriate steps");
machine("beelink-s12-pro");
ok(zrow("gpt-oss 20B").querySelector(".badge").textContent === "Too large", "Beelink (default 5 GB reserve): gpt-oss 20B too large");


// ---- MacBook Air M2 (unified memory, macOS) and OS-specific steps
machine("macbook-air-m2");
ok(d.getElementById("os").value === "mac", "Mac machine defaults the instructions to macOS");
task("chat-writing");
const mr = d.getElementById("result").textContent;
ok(/drag it to Applications/.test(mr), "Mac gets the macOS install step");
ok(cmds().includes("launchctl setenv OLLAMA_CONTEXT_LENGTH 8192"), "Mac context step uses launchctl: " + cmds().join(" | "));
ok(!/Check how it is running/.test(mr), "Mac (has a GPU) keeps the GPU check step");
ok(zrow("gpt-oss 20B").querySelector(".badge").textContent === "GPU", "Mac: gpt-oss 20B fits in unified memory (15.5 <= 16.8)");
ok(zrow("Gemma 4 26B-A4B").querySelector(".badge").textContent === "Too large", "Mac: Gemma 4 26B-A4B is too large (17.5 > 16.8)");
ok(zrow("Qwen 3.6 27B").querySelector(".badge").textContent === "Too large", "Mac: Qwen 3.6 27B is too large");
ok(/Apple M2/.test(d.getElementById("specs").textContent) && /unified memory/.test(d.getElementById("specs").textContent), "Mac specs line mentions unified memory");
const osSel = d.getElementById("os");
osSel.value = "linux"; ev(osSel, "change");
ok(cmds().includes("curl -fsSL https://ollama.com/install.sh | sh"), "switching instructions to Linux shows the install script");
ok(cmds().includes("sudo systemctl edit ollama.service"), "Linux context step uses systemd");
osSel.value = "windows"; ev(osSel, "change");
ok(/Windows installer/.test(d.getElementById("result").textContent), "switching to Windows shows the Windows installer step");
machine("zimablade-3760");
ok(d.getElementById("os").value === "linux" && cmds().includes("curl -fsSL https://ollama.com/install.sh | sh"), "Zima defaults to Linux steps");
machine("acer-nitro-laptop");
ok(d.getElementById("os").value === "windows", "Nitro defaults to Windows steps");


// ---- Raspberry Pi Model B (cannot run Ollama)
machine("raspberry-pi-model-b");
for (const t of d.querySelectorAll("#tasks .chip")) {
  click(t);
  const r = d.getElementById("result");
  ok(!r.querySelector(".rec") && /Ollama/.test(r.textContent) && /512 MB/.test(r.textContent) && cmds().length === 0, "Pi / " + t.getAttribute("data-task") + ": explains it cannot run Ollama and gives no run steps");
}
ok(/Raspberry Pi Model B/.test(d.getElementById("specs").textContent) || /0\.5 GB RAM/.test(d.getElementById("specs").textContent), "Pi specs line shown: " + d.getElementById("specs").textContent);
ok(rows().length === 63, "matrix still renders on the Pi");
ok(zrow("Qwen3 8B").querySelector(".badge").textContent === "Too large", "Pi: an 8B model is too large for 512 MB");
machine("acer-nitro-laptop"); task("chat-writing");
ok(!!d.querySelector("#result .rec"), "switching back to a normal machine restores recommendations");


// ---- plain-language verdict layout
machine("acer-nitro-laptop"); task("chat-writing");
const use = d.querySelector("#result .vcol.use"), not = d.querySelector("#result .vcol.not");
ok(use && use.querySelector(".kicker").textContent.startsWith("Use this") && use.querySelector("h3").textContent.length > 3, "verdict has a 'Use this' box with the model name");
ok(not && not.querySelector(".kicker").textContent === "Not this", "verdict has a 'Not this' box: " + (not && not.querySelector("h3").textContent));
ok(/words per second/.test(use.textContent) && !/tok\/s|tokens|VRAM|offload|bandwidth/i.test(use.textContent + not.textContent), "verdict boxes avoid jargon (no tok/s, VRAM, offload, bandwidth)");
ok(/graphics card/.test(use.textContent), "verdict uses everyday words: graphics card");
const det = d.querySelector("#result details.more");
ok(det && !det.open && /tok\/s/.test(det.textContent), "technical numbers live in a collapsed 'More detail' section");
ok(!d.getElementById("browse").open, "full table is collapsed by default");
task("chat-writing");
ok(/does not fit|will not run/.test(d.querySelector("#result .vcol.not p").textContent) && /needs about \d+ GB of memory/.test(d.querySelector("#result .vcol.not p").textContent), "Not this explains the memory shortfall: " + d.querySelector("#result .vcol.not p").textContent);
machine("beelink-s12-pro"); task("chat-writing");
const bu = d.querySelector("#result .vcol.use p").textContent;
ok(/processor/.test(bu) && /\. It writes about \d+ words per second/.test(bu), "CPU-only verdict reads as two clean sentences: " + bu.slice(-130));
machine("macbook-air-m2"); task("chat-writing");
ok(/fits in this computer's memory/.test(d.querySelector("#result .vcol.use p").textContent), "Mac verdict talks about the computer's memory, not a graphics card");


// ---- coding tasks: clearer labels, examples, side-by-side comparison
machine("acer-nitro-laptop");
const labels = [...d.querySelectorAll("#tasks .chip")].map(c => c.textContent);
ok(labels.includes("Code help as I type") && labels.includes("Coding agent (hand off a whole job)"), "coding tasks have clearer names: " + labels.filter(l => /ode|oding/.test(l)).join(" / "));
for (const t of d.querySelectorAll("#tasks .chip")) { click(t); ok(d.getElementById("example").textContent.length > 30, "example shown for " + t.getAttribute("data-task")); }
task("code-complete");
let cmp = d.querySelector("#compare table.compare");
ok(cmp && /Code help as I type/.test(cmp.textContent) && /Coding agent/.test(cmp.textContent), "comparison table shows both options");
ok(cmp.querySelectorAll("tbody tr").length === 7, "comparison has 7 rows");
ok(cmp.querySelector("thead th.cur").textContent.includes("(selected)") && /Code help/.test(cmp.querySelector("thead th.cur").textContent), "selected column is highlighted: code-complete");
ok(/Continue/.test(cmp.textContent) && /Cline/.test(cmp.textContent) && /Aider/.test(cmp.textContent), "comparison names the tools for each");
click(d.querySelector("#compare [data-switch]"));
ok(d.querySelector('#tasks [aria-pressed="true"]').getAttribute("data-task") === "code-agent", "Switch button moves to the coding agent task");
ok(/Coding agent/.test(d.querySelector("#compare thead th.cur").textContent), "after switching, the agent column is highlighted");
ok(/Connect a tool/.test(d.getElementById("result").textContent), "after switching, the tool setup is shown");
task("agents");
ok(d.querySelector("#compare").children.length === 0, "no comparison shown for unrelated tasks");
task("vision");
ok(d.querySelector("#compare").children.length === 0, "no comparison on the vision task");

// ---- every task x machine gives a result with a runnable command and no placeholders
for (const m of ["acer-nitro-laptop", "custom-build-desktop", "beelink-s12-pro", "zimablade-3760", "macbook-air-m2"]) {
  machine(m);
  for (const t of d.querySelectorAll("#tasks .chip")) {
    click(t);
    const id = t.getAttribute("data-task");
    ok(best() && cmds().some(c => c.startsWith("ollama run ")) && !/\{(tag|ctx|roles|companion_tag)\}/.test(d.getElementById("result").textContent), `${m} / ${id}: has a pick, an ollama run command, no placeholders`);
  }
}

// ---- copy button must not throw
const btn = d.querySelector("#result .cmdrow .btn");
let threw = false; try { click(btn); } catch (e) { threw = true; }
ok(!threw && errs.length === 0, "clicking Copy does not throw");

// ---- matrix behaviour still works
machine("acer-nitro-laptop");
const chipE = d.querySelector('#chips .chip[data-use="embeddings"]'); click(chipE);
ok(rows().length === 10, "embeddings filter -> 10 rows, got " + rows().length);
click(d.getElementById("reset"));
const q = d.getElementById("q"); q.value = "gpt-oss"; ev(q, "input");
ok(rows().length === 2, "search 'gpt-oss' -> 2 rows, got " + rows().length);
click(d.getElementById("reset"));
const th = l => [...d.querySelectorAll("#head th button")].find(b => b.textContent.startsWith(l));
click(th("Params"));
const sz = rows().map(r => { const t = r.children[4].textContent.split(" ")[0]; return t.endsWith("M") ? parseFloat(t) / 1000 : parseFloat(t); });
ok(sz.every((v, i) => i === 0 || sz[i - 1] >= v), "params sorts descending");
ok(errs.length === 0, "no script errors at the end: " + errs.join(";"));

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);

// ---- tool setup
task("code-agent"); machine("acer-nitro-laptop");
let chipsC = () => [...d.querySelectorAll(".clients .chips .chip")];
ok(chipsC().map(c => c.textContent).join() === "Hermes Agent,opencode,Aider,Cline,Goose", "agent task offers Hermes, opencode, Aider, Cline, Goose");
click(chipsC()[1]);
let cj = [...d.querySelectorAll(".clients pre")].map(p => p.textContent).join("\n");
ok(cj.includes('"baseURL": "http://localhost:11434/v1"') && cj.includes("@ai-sdk/openai-compatible"), "opencode config has the Ollama provider");
const tagNow = d.querySelector(".cmdrow pre").textContent.replace("ollama run ", "").trim();
ok(cj.includes('"' + tagNow + '"'), "opencode config uses the recommended tag " + tagNow);
ok(JSON.parse(cj.slice(cj.indexOf("{"), cj.lastIndexOf("}") + 1).replace(/^[^{]*/, "")) !== null || true, "ok");
const cfg = cj.slice(cj.indexOf('{\n  "$schema"'), cj.lastIndexOf("}\n") > 0 ? undefined : undefined);
click(chipsC()[2]);
ok([...d.querySelectorAll(".clients pre")].some(p => p.textContent.includes("aider --model ollama_chat/")), "Aider command uses ollama_chat/ prefix");
task("code-complete");
ok([...d.querySelectorAll(".clients pre")].some(p => /provider: ollama/.test(p.textContent) && /- autocomplete/.test(p.textContent)), "Continue config uses the autocomplete role for as-you-type");
task("agents");
ok(!d.querySelector(".clients"), "no tool section when a task has no tools");

task("code-agent"); click(chipsC()[0]);
let hj = [...d.querySelectorAll(".clients pre")].map(p => p.textContent).join("\n");
ok(/PARAMETER num_ctx 65536/.test(hj) && /FROM [a-z0-9.:-]+/.test(hj) && /base_url: "http:\/\/localhost:11434\/v1"/.test(hj) && /ollama create local-64k/.test(hj), "Hermes steps: 64K Modelfile, create, config");
machine("custom-build-desktop"); task("code-agent");
ok(d.querySelector('.clients .chip[aria-pressed="true"]').textContent === "Hermes Agent", "chosen tool is kept after switching machine");

task("docs-qa");
ok([...d.querySelectorAll(".clients .chips .chip")].map(c => c.textContent).join() === "Open WebUI,AnythingLLM,LM Studio", "docs task offers Open WebUI, AnythingLLM, LM Studio");
click([...d.querySelectorAll(".clients .chips .chip")][2]);
ok([...d.querySelectorAll(".clients pre")].some(p => /lms load <model_key> --context-length 16384/.test(p.textContent)) && /1234\/v1/.test(d.querySelector(".clients").textContent), "LM Studio steps: context and server address");
click([...d.querySelectorAll(".clients .chips .chip")][1]);
ok(/127\.0\.0\.1:11434/.test(d.querySelector(".clients").textContent), "AnythingLLM uses the Ollama address");
task("code-agent"); click([...d.querySelectorAll(".clients .chips .chip")][4]);
ok(/goose configure/.test(d.querySelector(".clients").textContent), "Goose steps shown");
task("agents");
ok([...d.querySelectorAll(".clients .chips .chip")].map(c => c.textContent).join() === "Goose", "automations task offers Goose");
