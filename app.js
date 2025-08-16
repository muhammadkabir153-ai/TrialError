/***********************
 * Data & Persistence
 ************************/
const LS_KEY = "kayanMiyaDataV1";
let data = JSON.parse(localStorage.getItem(LS_KEY)) || {}; // { [date]: { items:[], debtors:[] } }
let currentDate = new Date().toISOString().split("T")[0];

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/***********************
 * Helpers
 ************************/
function byId(id) { return document.getElementById(id); }
function fmtN(n)  { return Number(n || 0); }
function todayISO() { return new Date().toISOString().split("T")[0]; }

/***********************
 * Tabs
 ************************/
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    byId(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "tab-due") renderDueDebtors();
  });
});

/***********************
 * Init Date & Section
 ************************/
function ensureDate(dateStr) {
  if (!data[dateStr]) data[dateStr] = { items: [], debtors: [] };
}
function setCurrentDate(dateStr) {
  currentDate = dateStr || todayISO();
  ensureDate(currentDate);
  byId("currentDateLabel").textContent = `Current: ${currentDate}`;
  byId("salesDate").value = currentDate;
  save();
  renderSalesTable();
  renderDebtors();
}

byId("openSalesBtn").addEventListener("click", () => {
  const d = byId("salesDate").value;
  if (!d) return;
  setCurrentDate(d);
});

/***********************
 * Items / Sales
 ************************/
byId("itemForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = byId("itemName").value.trim();
  const cost = fmtN(byId("itemCost").value);
  const portionPrice = fmtN(byId("portionPrice").value);
  if (!name || !cost || !portionPrice) return;

  ensureDate(currentDate);
  data[currentDate].items.push({ name, cost, portionPrice, sold: 0 });
  save();
  renderSalesTable();
  e.target.reset();
});

function sellItem(index, delta) {
  ensureDate(currentDate);
  const items = data[currentDate].items;
  if (!items[index]) return;
  items[index].sold = Math.max(0, fmtN(items[index].sold) + delta);
  save();
  renderSalesTable();
}

function renderSalesTable() {
  ensureDate(currentDate);
  const tbody = byId("salesTable");
  tbody.innerHTML = "";
  const items = data[currentDate].items;

  let totalProfit = 0;
  items.forEach((it, idx) => {
    const profit = (fmtN(it.portionPrice) * fmtN(it.sold)) - fmtN(it.cost);
    totalProfit += profit;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.name}</td>
      <td>${fmtN(it.cost)}</td>
      <td>${fmtN(it.portionPrice)}</td>
      <td>${fmtN(it.sold)}</td>
      <td>${profit}</td>
      <td class="actions">
        <button class="btn-plus"  aria-label="Add one"    onclick="sellItem(${idx}, 1)">+1</button>
        <button class="btn-minus" aria-label="Remove one" onclick="sellItem(${idx}, -1)">-1</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  byId("totalProfit").textContent = totalProfit;
}

/***********************
 * Debtors (per date)
 ************************/
byId("debtorForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = byId("debtorName").value.trim();
  const item = byId("debtorItem").value.trim();
  const amount = fmtN(byId("debtorAmount").value);
  const due = byId("debtorDue").value;

  if (!name || !item || !amount || !due) return;

  ensureDate(currentDate);
  data[currentDate].debtors.push({
    name, item, amount, due,
    createdAt: new Date().toISOString()
  });
  save();
  renderDebtors();
  e.target.reset();
});

function renderDebtors() {
  ensureDate(currentDate);
  const list = byId("debtorList");
  list.innerHTML = "";

  data[currentDate].debtors.forEach(d => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div><strong>${d.name}</strong> owes <strong>₦${fmtN(d.amount)}</strong> for <em>${d.item}</em></div>
      <div class="muted">Due: ${d.due} &middot; Added: ${new Date(d.createdAt).toLocaleString()}</div>
    `;
    list.appendChild(li);
  });
}

/***********************
 * Due Debtors (All Dates)
 ************************/
byId("debtorSearch").addEventListener("input", renderDueDebtors);

function collectAllDebtors() {
  const rows = [];
  Object.keys(data).forEach(dateKey => {
    (data[dateKey].debtors || []).forEach(d => {
      rows.push({ ...d, saleDate: dateKey });
    });
  });
  return rows;
}

function renderDueDebtors() {
  const search = byId("debtorSearch").value.toLowerCase().trim();
  const container = byId("dueDebtorsList");
  container.innerHTML = "";

  const today = todayISO();
  const all = collectAllDebtors()
    .filter(d => !search || d.name.toLowerCase().includes(search) || (d.due || "").includes(search))
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  all.forEach(d => {
    let badgeClass = "future", badgeText = "🟢 Future";
    if (d.due < today) { badgeClass = "overdue"; badgeText = "🔴 Overdue"; }
    else if (d.due === today) { badgeClass = "today"; badgeText = "🟠 Due Today"; }

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="row" style="justify-content:space-between;">
        <div>
          <strong>${d.name}</strong> — ₦${fmtN(d.amount)} for <em>${d.item}</em><br>
          <span class="muted">Recorded on: ${d.saleDate}</span>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="muted">Due: ${d.due}</div>
    `;
    container.appendChild(div);
  });

  if (all.length === 0) {
    const empty = document.createElement("div");
    empty.className = "item";
    empty.textContent = "No matching debtors.";
    container.appendChild(empty);
  }
}

/***********************
 * Backup / Restore
 ************************/
byId("backupBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kayan_miya_backup_${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

byId("restoreBtn").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && typeof parsed === "object") {
          data = parsed;
          save();
          // Re-render all views
          setCurrentDate(currentDate);
          renderDueDebtors();
          alert("Restore successful ✅");
        } else {
          alert("Invalid file.");
        }
      } catch {
        alert("Could not read file.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

/***********************
 * Boot
 ************************/
setCurrentDate(currentDate);
