// 1) Paste your deployed Apps Script web app URL (ends with /exec)
const SCRIPT_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

// 2) Must match API_TOKEN in Code.gs
const TOKEN = "PASTE_THE_SAME_LONG_RANDOM_STRING_HERE";

const grid = document.getElementById("grid");
const meta = document.getElementById("meta");
const errorBox = document.getElementById("error");
document.getElementById("refreshBtn").addEventListener("click", load);

function setError(msg) {
  errorBox.textContent = msg || "";
}

function dueColor(counterDays, targetDays) {
  return (Number(counterDays) >= Number(targetDays)) ? "#c62828" : "#2e7d32"; // red/green
}

function render(chores) {
  grid.innerHTML = "";
  chores.forEach(ch => {
    const btn = document.createElement("button");
    btn.className = "chore";
    btn.style.background = dueColor(ch.counterDays, ch.targetDays);

    btn.innerHTML = `
      <div>${escapeHtml(ch.chore)} <span class="small">(${escapeHtml(ch.responsible || "—")})</span></div>
      <div class="line2">${Number(ch.counterDays)} / ${Number(ch.targetDays)} days</div>
      <div class="small">Click to mark done</div>
    `;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      setError("");
      try {
        await reset(ch.id);
        await load();
      } catch (e) {
        setError(String(e));
      } finally {
        btn.disabled = false;
      }
    });

    grid.appendChild(btn);
  });
}

async function load() {
  setError("");
  meta.textContent = "Loading…";
  try {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set("action", "list");
    url.searchParams.set("token", TOKEN);

    const res = await fetch(url.toString(), { method: "GET" });
    const data = await res.json();

    if (!data.chores) throw new Error("Unexpected response: " + JSON.stringify(data, null, 2));

    meta.textContent = `Last updated: ${new Date().toLocaleString()}`;
    render(data.chores);
  } catch (e) {
    meta.textContent = "Failed to load.";
    setError(String(e));
  }
}

async function reset(id) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset", token: TOKEN, id })
  });

  const data = await res.json();
  if (!data.ok) throw new Error("Reset failed: " + JSON.stringify(data, null, 2));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

load();
