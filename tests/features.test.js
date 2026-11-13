const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync(require("path").join(__dirname, "..") + "/index.html", "utf8");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("FAIL:", m); } else console.log("ok:  ", m); };
function make(opts = {}) {
  const errs = [];
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/", virtualConsole: new VirtualConsole().on("jsdomError", e => errs.push(e.message)),
    beforeParse(w) { if (opts.fetch) w.fetch = opts.fetch; if (opts.storage) for (const k in opts.storage) w.localStorage.setItem(k, opts.storage[k]); } });
  const d = dom.window.document;
  const ev = (el, t) => el.dispatchEvent(new dom.window.Event(t, { bubbles: true }));
  const click = el => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const set = (id, v) => { const e = d.getElementById(id); if (e.type === "checkbox") e.checked = v; else e.value = v; };
  const machine = id => { const s = d.getElementById("machine"); s.value = id; ev(s, "change"); };
  const task = id => click(d.querySelector(`#tasks [data-task="${id}"]`));
  return { dom, d, errs, ev, click, set, machine, task, w: dom.window };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // ---- add a machine
  let t = make();
  t.set("m-name", "Test box"); t.set("m-cpu", "Ryzen 5"); t.set("m-ram", "32"); t.set("m-mts", "3200"); t.set("m-ch", "2");
  t.set("m-vram", "8"); t.set("m-vbw", "256"); t.set("m-gpu", "RTX 4060");
  t.ev(t.d.getElementById("mform"), "submit");
  let sel = t.d.getElementById("machine");
  ok([...sel.options].some(o => o.textContent === "Test box (mine)"), "added machine appears in the list marked (mine)");
  ok(sel.value.startsWith("custom-"), "added machine is selected");
  ok(/32 GB RAM/.test(t.d.getElementById("specs").textContent) && /8 GB VRAM/.test(t.d.getElementById("specs").textContent), "specs line shows the new machine");
  ok(!!t.d.querySelector("#result .rec"), "new machine gets a recommendation");
  const saved = JSON.parse(t.w.localStorage.getItem("localai.machines.v1"));
  ok(saved.length === 1 && Math.abs(saved[0].ram_bandwidth_gbps - 51.2) < 0.01, "saved in localStorage, bandwidth worked out as 51.2 GB/s from 3200 MT/s x 2 channels");
  ok(t.errs.length === 0, "no script errors adding a machine");
  // validation
  t.set("m-name", "Bad"); t.set("m-cpu", "x"); t.set("m-ram", ""); t.ev(t.d.getElementById("mform"), "submit");
  ok(/RAM in GB/.test(t.d.getElementById("m-status").textContent), "missing RAM is rejected with a message");
  t.set("m-ram", "16"); t.set("m-mts", ""); t.set("m-bw", ""); t.ev(t.d.getElementById("mform"), "submit");
  ok(/RAM speed/.test(t.d.getElementById("m-status").textContent), "missing bandwidth is rejected");
  t.set("m-bw", "52"); t.set("m-vram", "6"); t.set("m-vbw", ""); t.ev(t.d.getElementById("mform"), "submit");
  ok(/graphics card bandwidth/.test(t.d.getElementById("m-status").textContent), "GPU without bandwidth is rejected");
  // export/import
  t.click(t.d.getElementById("m-export"));
  const exp = JSON.parse(t.d.getElementById("m-json").value);
  ok(exp.length === 1 && exp[0].name === "Test box" && !("custom" in exp[0]), "export lists only my machines");
  // delete
  t.click(t.d.getElementById("m-del"));
  ok(![...t.d.getElementById("machine").options].some(o => /Test box/.test(o.textContent)) && JSON.parse(t.w.localStorage.getItem("localai.machines.v1")).length === 0, "removing a machine updates list and storage");
  // persistence across reload + import + hostile storage
  t = make({ storage: { "localai.machines.v1": JSON.stringify([saved[0], { id: "evil", name: "x", cpu: "y", ram_gb: -5, ram_bandwidth_gbps: 1 }]) } });
  ok([...t.d.getElementById("machine").options].filter(o => /\(mine\)/.test(o.textContent)).length === 1, "saved machines load on start; invalid stored entries are ignored");
  t = make({ storage: { "localai.machines.v1": "{not json" } });
  ok(t.errs.length === 0 && t.d.querySelectorAll("#machine option").length === 7, "corrupt storage does not break the page");
  t.d.getElementById("m-json").value = JSON.stringify([{ id: "imp1", name: "Imported", cpu: "c", ram_gb: 8, ram_bandwidth_gbps: 20, vram_gb: 0, os_family: "linux" }, { id: "bad" }]);
  t.click(t.d.getElementById("m-import"));
  ok(/Imported 1 machine/.test(t.d.getElementById("m-status").textContent) && /skipped 1/.test(t.d.getElementById("m-status").textContent), "import adds valid machines and skips invalid ones");

  // ---- measured speeds
  t = make();
  t.machine("acer-nitro-laptop"); t.task("chat-writing");
  const before = t.d.querySelector("#result details.more").textContent;
  ok(/est\. ~/.test(before), "estimated speeds are shown with ~");
  // verify the override through a custom machine with measured field via import
  t.d.getElementById("m-json").value = JSON.stringify([{ id: "meas", name: "Measured box", cpu: "c", ram_gb: 64, ram_bandwidth_gbps: 52, vram_gb: 0, os_family: "linux", measured: { "gpt-oss:20b": 42.4 } }]);
  t.click(t.d.getElementById("m-import")); t.machine("meas");
  t.click(t.d.getElementById("browse").querySelector("summary"));
  const row = [...t.d.querySelectorAll("#body tr")].find(r => /gpt-oss 20B/.test(r.textContent));
  ok(row && /42 \(measured\)/.test(row.textContent), "measured speed replaces the estimate and is labeled");

  // ---- filters, comparison, ranking
  t = make();
  const all = t.d.querySelectorAll("#body tr").length;
  t.set("conf", "yes"); t.ev(t.d.getElementById("conf"), "change");
  const n = t.d.querySelectorAll("#body tr").length;
  ok(n > 0 && n < all, "hide-unconfirmed filter removes some rows: " + n + " of " + all);
  t.task("reasoning");
  const heads = [...t.d.querySelectorAll("#compare thead th")].map(h => h.textContent);
  ok(heads.length === 4 && /Hard reasoning \(selected\)/.test(heads.join("|")), "three-column comparison shows on the reasoning task");
  ok(t.d.querySelectorAll("#compare [data-switch]").length === 2, "two switch buttons for the other two tasks");
  t.machine("custom-build-desktop"); t.task("code-agent");
  ok(/Qwen 3\.8/.test(t.d.querySelector("#result").textContent), "code agent task mentions Qwen 3.8");
  t.machine("acer-nitro-laptop"); t.task("code-complete");
  ok((t.d.querySelector("#result .rec h3") || {}).textContent === "Qwen2.5-Coder 7B", "typing help on the Acer picks Qwen2.5-Coder 7B");
  t.machine("beelink-s12-pro");
  ok(/1\.5B|7B/.test((t.d.querySelector("#result .rec h3") || {}).textContent || ""), "typing help on a CPU-only box picks a small Qwen2.5-Coder");
  t.machine("macbook-air-m2"); t.task("chat-writing");
  ok(/short by about \d+ GB/.test(t.d.getElementById("result").textContent) || !/Better models that need more memory/.test(t.d.getElementById("result").textContent), "shortfall wording, when shown, says how much memory is missing");
  t.machine("acer-nitro-laptop"); t.task("chat-writing");
  ok(/Sources for this model last read: 2026-/.test(t.d.querySelector(".about").textContent), "About box shows when its sources were last read");

  // ---- remote data
  const dataObj = JSON.parse(fs.readFileSync(require("path").join(__dirname, "..") + "/data.json", "utf8"));
  ok(dataObj.schema === 1 && dataObj.data.models.length === 63 && dataObj.version === require("fs").readFileSync(require("path").join(__dirname, "..", "VERSION"), "utf8").trim(), "data.json bundle is well formed");
  const newer = JSON.parse(JSON.stringify(dataObj)); newer.data.updated = "2099-01-01"; newer.data.models[0].name = "REMOTE MODEL NAME";
  t = make({ fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(newer) }) });
  await sleep(52);
  ok(/newer data loaded from GitHub/.test(t.d.getElementById("sub").textContent) && /REMOTE MODEL NAME/.test(t.d.getElementById("body").textContent), "newer remote data is used");
  const same = JSON.parse(JSON.stringify(dataObj)); same.data.models[0].name = "SHOULD NOT SHOW";
  t = make({ fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(same) }) }); await sleep(52);
  ok(!/SHOULD NOT SHOW/.test(t.d.getElementById("body").textContent), "remote data that is not newer is ignored");
  const broken = JSON.parse(JSON.stringify(newer)); broken.tasks.tasks[0].ranked[0].id = "does-not-exist";
  t = make({ fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(broken) }) }); await sleep(52);
  ok(!/newer data loaded/.test(t.d.getElementById("sub").textContent) && t.d.querySelectorAll("#body tr").length === 63, "inconsistent remote data is rejected");
  t = make({ fetch: () => Promise.reject(new Error("offline")) }); await sleep(52);
  ok(t.d.querySelectorAll("#body tr").length === 63 && t.errs.length === 0, "page works when the remote fetch fails");
  t = make({ fetch: () => Promise.resolve({ ok: false }) }); await sleep(52);
  ok(t.d.querySelectorAll("#tasks .chip").length === 8, "page works when the repo is private (404)");
  const evil = JSON.parse(JSON.stringify(newer)); evil.data.sources[Object.keys(evil.data.sources)[0]].url = "javascript:alert(1)";
  t = make({ fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(evil) }) }); await sleep(52);
  ok(![...t.d.querySelectorAll("#srcs a")].some(a => /^javascript:/i.test(a.getAttribute("href"))), "non-https links from remote data are not rendered as links");

  // ---- speech models
  t = make();
  ok(!!t.d.querySelector('#chips [data-use="speech"]'), "Speech use-case filter exists");
  t.click(t.d.querySelector('#chips [data-use="speech"]'));
  const sp = [...t.d.querySelectorAll("#body tr")];
  ok(sp.length === 3 && sp.some(r => /Phonon/.test(r.textContent)) && sp.some(r => /Granite 4\.1 Speech/.test(r.textContent)) && sp.some(r => /LFM3-Audio/.test(r.textContent)), "Speech filter shows the three speech models");
  ok(sp.every(r => r.children[r.children.length - 2].textContent === "—"), "speech models show no tokens/s estimate");
  ok(sp.some(r => /ollama run phonon|macOS only/.test(r.textContent)) && sp.some(r => /community upload|personal upload/i.test(r.textContent)), "speech rows carry the macOS-only and community-upload warnings");
  ok(!/\bspeech\b/i.test([...t.d.querySelectorAll("#tasks .chip")].map(c => c.textContent).join(" ")), "no speech task yet (recommender unchanged)");

  // ---- tutorials
  const path = require("path"), root = path.join(__dirname, "..");
  const { execSync: run } = require("child_process");
  t = make(); t.machine("custom-build-desktop");
  const seen = {};
  for (const task of ["chat-writing", "code-complete", "code-agent", "docs-qa"]) {
    t.task(task);
    for (const chip of [...t.d.querySelectorAll(".clients .chips .chip")]) {
      t.click(chip);
      const tut = t.d.querySelector(".clients details.tut");
      if (tut) seen[chip.textContent] = tut.textContent;
    }
  }
  ok(["opencode", "Aider", "Cline", "Continue", "Hermes Agent", "Open WebUI"].every(n => seen[n]), "tutorial exists for opencode, Aider, Cline, Continue, Hermes, Open WebUI");
  ok(!seen["Goose"] && !seen["LM Studio"] && !seen["AnythingLLM"], "no tutorial for tools whose docs were not read");
  ok(/\/init/.test(seen["opencode"]) && /Tab/.test(seen["opencode"]) && /\/undo/.test(seen["opencode"]), "opencode tutorial covers /init, Tab and /undo");
  ok(/Plan mode/.test(seen["Cline"]) && /YOLO/.test(seen["Cline"]), "Cline tutorial covers Plan/Act and the YOLO warning");
  ok(/Esc/.test(seen["Continue"]) && /Tab/.test(seen["Continue"]), "Continue tutorial covers accepting and rejecting suggestions");
  ok(/No screenshots yet/.test(seen["opencode"]), "without screenshots the page says so instead of faking them");
  t.task("chat-writing"); t.click([...t.d.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "Open WebUI"));
  ok(!t.d.querySelector(".clients details.tut").hasAttribute("open"), "tutorial is collapsed by default");
  t.task("code-agent"); t.click([...t.d.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "opencode"));
  ok(!!t.d.querySelector(".clients details.tut .cmdrow"), "tutorial prompts have copy buttons");
  fs.writeFileSync(path.join(root, "screens", "opencode-start.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  run("cd " + root + " && python3 build.py");
  const withShot = fs.readFileSync(path.join(root, "index.html"), "utf8");
  ok(/data:image\/png;base64,/.test(withShot), "a screenshot file in screens/ is embedded in the page");
  const html2 = withShot;
  const dom2 = new JSDOM(html2, { runScripts: "dangerously", pretendToBeVisual: true });
  const d2 = dom2.window.document;
  d2.querySelector('#tasks [data-task="code-agent"]').dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  [...d2.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "opencode").dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  ok(!!d2.querySelector(".clients figure.shot img"), "the screenshot shows in the matching tutorial step");
  fs.unlinkSync(path.join(root, "screens", "opencode-start.png"));
  run("cd " + root + " && python3 build.py");
  ok(!/data:image\/png;base64,/.test(fs.readFileSync(path.join(root, "index.html"), "utf8")), "removing the file removes it from the page");

  // ---- stack diagram
  t = make(); t.machine("acer-nitro-laptop"); t.task("code-agent");
  let st = t.d.querySelector(".stack");
  ok(!!st && ["You", "Tool", "Engine", "Settings", "Model", "Hardware"].every(n => [...st.querySelectorAll(".lname")].some(x => x.textContent === n)), "stack shows You, Tool, Engine, Settings, Model, Hardware");
  ok(/This computer \(Acer Nitro Laptop\)/.test(st.textContent) && /http:\/\/localhost:11434/.test(st.textContent), "local stack: one computer, Ollama address");
  ok(/65536/.test(st.textContent) && /noticeably more/.test(st.textContent), "long-context tool warns that the memory estimate is for a short context");
  t.click(t.d.getElementById("stack-remote"));
  st = t.d.querySelector(".stack");
  ok(/Computer A/.test(st.textContent) && /Computer B/.test(st.textContent) && /MODEL-COMPUTER-ADDRESS/.test(st.textContent) && /OLLAMA_HOST/.test(st.textContent), "remote stack: two computers, address placeholder and OLLAMA_HOST note");
  ok(t.d.getElementById("stack-remote").checked, "remote choice is kept");
  t.task("docs-qa"); t.click([...t.d.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "LM Studio"));
  st = t.d.querySelector(".stack");
  ok(/LM Studio \(replaces Ollama\)/.test(st.textContent) && /1234\/v1/.test(st.textContent) && !/OLLAMA_HOST/.test(st.textContent), "LM Studio stack uses its own engine and port");

  // ---- operating system advice
  t = make();
  const verdict = (m, task) => { t.machine(m); t.task(task); const o = t.d.querySelector(".osadv"); return o ? o.querySelector("p strong").textContent.trim() : null; };
  ok(verdict("macbook-air-m2", "chat-writing") === "Stay on macOS." && !t.d.getElementById("os-server"), "Apple silicon: stay on macOS, no server toggle");
  ok(verdict("zimablade-3760", "chat-writing") === "Stay on Linux.", "Linux machine: stay on Linux");
  ok(verdict("custom-build-desktop", "code-agent") === "Stay on Windows." && /11 GB/.test(t.d.querySelector(".osadv").textContent), "11 GB card on Windows: stay on Windows, mentions the card size");
  ok(verdict("acer-nitro-laptop", "chat-writing") === "Stay on Windows." && /evidence is thin/.test(t.d.querySelector(".osadv").textContent), "6 GB card: stay on Windows but say Linux could help a little and the evidence is thin");
  t.click(t.d.getElementById("os-server"));
  ok(/Linux is worth trying/.test(t.d.querySelector(".osadv").textContent) && /all the time/.test(t.d.querySelector(".osadv").textContent), "always-on server tips the advice to Linux");
  t.machine("raspberry-pi-model-b");
  ok(!t.d.querySelector(".osadv"), "no OS advice for a machine that cannot run Ollama");
  t.d.getElementById("m-json").value = JSON.stringify([{ id: "tiny-win", name: "Tiny Windows PC", cpu: "c", ram_gb: 8, ram_bandwidth_gbps: 25, vram_gb: 0, os_family: "windows" }]);
  t.click(t.d.getElementById("m-import")); t.machine("tiny-win"); t.task("chat-writing");
  const oa = t.d.querySelector(".osadv");
  ok(!!oa && (/instead of/.test(oa.textContent) ? /Linux is worth trying/.test(oa.textContent) : /would not change/.test(oa.textContent)), "on a small-RAM Windows PC the advice says whether Linux would change the recommended model: " + oa.querySelector("p strong").textContent);
  ok(/Sources:/.test(oa.textContent) && !!oa.querySelector("a[href^='https://']"), "OS advice lists its sources with https links");

  // ---- phone (app only, no Ollama)
  t = make(); t.machine("pixel-9a"); t.task("chat-writing");
  let pr = t.d.getElementById("result").textContent;
  ok(/PocketPal AI/.test(pr) && /does not use Ollama/.test(pr), "phone: chat task shows the PocketPal path");
  ok(!/ollama run|OLLAMA_HOST/.test(pr) && !t.d.querySelector(".osadv"), "phone: no Ollama commands and no OS advice");
  ok(/runs on the phone's processor/.test(pr), "phone: plain fit wording mentions the phone");
  ok(/SmolLM3 3B is in the app's built-in list/.test(pr) && /Models already in the app's list/.test(pr), "phone: chat pick is a model from the app's built-in list, and the list is shown");
  t.task("reasoning"); ok(/Qwen3 1\.7B is in the app's built-in list/.test(t.d.getElementById("result").textContent), "phone: reasoning pick is built in too"); t.task("chat-writing");
  t.task("code-agent");
  ok(!/PocketPal/.test(t.d.getElementById("result").textContent), "phone: tasks without a phone app say so instead of showing computer tools");

  // ---- memory and context file tips
  t = make(); t.machine("zimablade-3760"); t.task("code-agent");
  let ctxd = t.d.querySelector(".clients details.evid");
  const allCtx = [...t.d.querySelectorAll(".clients details.evid")].find(d => /memory and context files/.test(d.querySelector("summary").textContent));
  ok(!!allCtx && /AGENTS\.md/.test(allCtx.textContent) && /Hermes itself caps/.test(allCtx.textContent), "context tips show for the default tool (Hermes) with its files");
  t.click([...t.d.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "opencode"));
  const oc = [...t.d.querySelectorAll(".clients details.evid")].find(d => /memory and context files/.test(d.querySelector("summary").textContent));
  ok(/~\/\.config\/opencode\/AGENTS\.md/.test(oc.textContent) && !!oc.querySelector("a[href^='https://opencode.ai']"), "opencode tips list its global file and link their source");
  t.click([...t.d.querySelectorAll(".clients .chips .chip")].find(c => c.textContent === "Goose"));
  const gs = [...t.d.querySelectorAll(".clients details.evid")].find(d => /memory and context files/.test(d.querySelector("summary").textContent));
  ok(/has not looked up/.test(gs.textContent), "a tool with no researched files says so instead of guessing");

  // ---- finance task
  t = make(); t.machine("custom-build-desktop"); t.task("finance");
  let fr = t.d.getElementById("result").textContent;
  ok(/Qwen 3\.8 27B/.test(t.d.querySelector("#result .vcol.use h3").textContent) && /Write the math, not do it|write the math/i.test(fr), "finance on the desktop picks Qwen 3.8 27B and shows the approach steps");
  ok(/Make it quote its source/.test(fr) && /Check the figures against the source/.test(fr) && /ollama pull/.test(fr), "finance steps include sourcing, checking and the search-model download");
  const ev = [...t.d.querySelectorAll("#result details.more a")].filter(a => /^https:\/\//.test(a.href));
  ok(ev.length >= 5 && /Evidence for this task \(checked 2026-11-06\)/.test(t.d.getElementById("result").textContent), "finance lists its evidence links and the date they were checked");
  t.machine("acer-nitro-laptop"); t.task("finance");
  ok(!!t.d.querySelector("#result .vcol.use h3"), "finance gives the Acer laptop a model");
  t.machine("pixel-9a"); t.task("finance");
  ok(/no phone app/.test(t.d.getElementById("result").textContent), "finance on the phone says no phone app is listed");

  // ---- model change log
  const mlog = t.d.getElementById("modellog-body");
  ok(!!mlog && /2026-11-06/.test(mlog.textContent) && /Added: Ornith 1\.5 9B/.test(mlog.textContent), "change log lists models added, with dates");
  ok(/first published on 2026-10-24 with 38 models/.test(mlog.textContent), "change log says how many models the first list had");

  // ---- public build strips hostnames (uses a temporary test hostname, then restores the file)
  const { execSync } = require("child_process");
  const mpath = root + "/machines.json", orig = fs.readFileSync(mpath, "utf8");
  try {
    const md = JSON.parse(orig); (Array.isArray(md) ? md : md.machines)[0].hostname = "TEST-HOST-1";
    fs.writeFileSync(mpath, JSON.stringify(md, null, 2));
    execSync("cd " + root + " && python3 build.py --public");
    ok(!/TEST-HOST-1/.test(fs.readFileSync(root + "/index.html", "utf8")), "public build has no hostnames");
    execSync("cd " + root + " && python3 build.py");
    ok(/TEST-HOST-1/.test(fs.readFileSync(root + "/index.html", "utf8")), "normal build keeps hostnames");
  } finally {
    fs.writeFileSync(mpath, orig);
    execSync("cd " + root + " && python3 build.py");
  }
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
})();
