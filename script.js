// ------------------------------
// 🎯 INITIAL DATA (ค่าเริ่มต้น)
// ------------------------------
const SEED = [
  { name: "เข็มกลัด", start: 1520 },
  { name: "สติ๊กเกอร์", start: 1400 },
  { name: "ปากกา", start: 1242 },
  { name: "พวงกุญแจ", start: 1200 },
  { name: "บัตรกำนัล SF", start: 0 },
  { name: "บัตรส่วนลด 15%", start: 0 },
  { name: "Bingo Jumbo", start: 24 },
  { name: "ซุปเปอร์เศรษฐี", start: 21 },
  { name: "แบทเทิลรีเจ้น", start: 20 },
  { name: "ท่องเที่ยว (กรุงเทพ)", start: 20 },
  { name: "Uno", start: 19 },
  { name: "Uno Flip", start: 16 },
  { name: "Who is it", start: 11 },
  { name: "Domino", start: 10 },
  { name: "หมากล้อม", start: 10 },
  { name: "Magneties", start: 10 },
  { name: "โจรสลัด", start: 4 },
  { name: "วอร์ออฟเดอะริง", start: 2 },
  { name: "Monopoly", start: 2 },
  { name: "The Hopbit", start: 2 },
  { name: "Bingo สัตว์", start: 2 },
  { name: "Duel", start: 1 },
  { name: "Azul", start: 1 },
  { name: "Kombo Klush", start: 1 },
  { name: "Stone Age", start: 1 },
  { name: "I'm The Boss", start: 1 },
].map((x, i) => ({
  id: i + 1,
  name: x.name,
  start: x.start,
  d1: 0,
  d2: 0,
  d3: 0,
}));

let state = [];
let currentDay = 1;

// elements
const body = document.getElementById("body");
const saveHintEl = document.getElementById("saveHint");
const lastUpdatedEl = document.getElementById("lastUpdated");
const dayPills = document.getElementById("dayPills");

// ------------------------------
// 🧮 CALCULATIONS
// ------------------------------
function calcRow(item) {
  const total = (item.d1 || 0) + (item.d2 || 0) + (item.d3 || 0);

  // ถ้าสตาร์ทเป็น 0 ให้ remain = "-" (ไม่รู้จำนวนจริง)
  const remain = item.start === 0 ? "-" : Math.max(item.start - total, 0);

  return { total, remain };
}


// ------------------------------
// 🖼️ RENDER TABLE
// ------------------------------
function render() {
  body.innerHTML = "";
  state.forEach((item) => {
    const { total, remain } = calcRow(item);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="name">${item.name}</td>
      <td class="qty">${item.start}</td>
      <td class="qty">${item.d1}</td>
      <td class="qty">${item.d2}</td>
      <td class="qty">${item.d3}</td>
      <td class="qty">${total}</td>
      <td class="qty">${remain}</td>
      <td>
        <div class="row-controls">
          <button class="mini edit" data-act="edit" data-id="${item.id}">✏️</button>
          <button class="mini green" data-act="plus1" data-id="${item.id}">+1</button>
          <button class="mini red" data-act="minus1" data-id="${item.id}">−1</button>
          <input class="num-in" type="number" placeholder="จำนวน"/>
          <button class="mini green" data-act="bulkPlus" data-id="${item.id}">+ หลาย</button>
          <button class="mini red" data-act="bulkMinus" data-id="${item.id}">− หลาย</button>
        </div>
      </td>`;
    body.appendChild(tr);
  });
}


// ------------------------------
// 🔍 FIND ITEM
// ------------------------------
function findItem(id) {
  return state.find((x) => x.id === id);
}

// ------------------------------
// 💾 SAVE TO FIREBASE
// (ต้องมี window.DB_REF มาจากการ init Firebase ใน index.html)
// ------------------------------
async function saveState() {
  if (!window.DB_REF || typeof window.DB_REF.set !== "function") {
    console.error("DB_REF ยังไม่ถูกกำหนด หรือไม่ได้ใช้ Realtime DB compat API");
    toast("⚠️ ระบบบันทึกยังไม่พร้อม (DB)", true);
    return;
  }

  saveHintEl.textContent = "⏳ กำลังบันทึก...";
  try {
    const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    await window.DB_REF.set({
      updatedAt: now,
      items: state
    });
    saveHintEl.textContent = "✓ บันทึกแล้ว (Firebase)";
    saveHintEl.classList.add("success");
    if (lastUpdatedEl) lastUpdatedEl.textContent = `อัปเดตล่าสุดเมื่อ: ${now}`;
  } catch (err) {
    console.error("❌ Sync failed:", err);
    saveHintEl.textContent = "⚠️ บันทึกไม่สำเร็จ";
    saveHintEl.classList.add("danger");
  } finally {
    setTimeout(() => {
      saveHintEl.textContent = "";
      saveHintEl.classList.remove("success", "danger");
    }, 1500);
  }
}

// ------------------------------
// 🧠 LOAD FROM FIREBASE (LIVE SYNC)
// ------------------------------
function loadFromFirebase() {
  if (!window.DB_REF || typeof window.DB_REF.on !== "function") {
    console.error("DB_REF ยังไม่ถูกกำหนด หรือไม่ได้ใช้ Realtime DB compat API");
    // fallback: ใช้ SEED
    state = SEED.map((x) => ({ ...x }));
    render();
    return;
  }

  window.DB_REF.on("value", (snapshot) => {
    const data = snapshot.val();

    if (data && data.items) {
      state = data.items;
      render();
      if (data.updatedAt && lastUpdatedEl) {
        lastUpdatedEl.textContent = `อัปเดตล่าสุดเมื่อ: ${data.updatedAt}`;
      }
      console.log("✅ Loaded data from Firebase");
    } else {
      // ถ้าไม่มี data ใน DB ให้ seed แล้วเซฟขึ้นไป
      state = SEED.map((x) => ({ ...x }));
      render();
      saveState();
      console.log("📦 Initialized with SEED data");
    }
  });
}

// ------------------------------
// ⚙️ TABLE BUTTON ACTIONS
// ------------------------------
body.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const id = +btn.dataset.id;
  const act = btn.dataset.act;
  const row = findItem(id);
  if (!row) return;

  const dayKey = ["d1", "d2", "d3"][currentDay - 1];
  const input = btn.parentElement.querySelector("input");
  const val = input?.value ? +input.value : 0;
  const { remain } = calcRow(row);

  // ✏️ EDIT MODE
  if (act === "edit") {
    const newName = prompt("แก้ไขชื่อของรางวัล:", row.name);
    if (!newName || !newName.trim()) return;

    const newStartStr = prompt("แก้ไขจำนวนเริ่มต้น:", row.start);
    const newStart = Number(newStartStr);
    if (isNaN(newStart) || newStart < 0)
      return alert("จำนวนเริ่มต้นไม่ถูกต้อง");

    row.name = newName.trim();
    row.start = newStart;

    render();
    saveState();
    return;
  }

  // +1
  if (act === "plus1") {
    row[dayKey]++; 
  }
  // -1
  else if (act === "minus1" && row[dayKey] > 0) {
    row[dayKey]--;
  }
  // + หลาย
  else if (act === "bulkPlus" && val > 0) {
    row[dayKey] += val;
    input.value = "";
  }
  // - หลาย
  else if (act === "bulkMinus" && val > 0) {
    row[dayKey] = Math.max((row[dayKey] || 0) - val, 0);
    input.value = "";
  }
  else {
    return;
  }

  render();
  saveState();
});


// ------------------------------
// 📅 CHANGE DAY
// ------------------------------
function markDay() {
  [...dayPills.querySelectorAll(".pill")].forEach((b) =>
    b.classList.toggle("active", +b.dataset.day === currentDay)
  );
}
dayPills.addEventListener("click", (e) => {
  const b = e.target.closest(".pill");
  if (!b) return;
  currentDay = +b.dataset.day;
  markDay();
});

// ------------------------------
// ⬇️ EXPORT CSV
// ------------------------------
function exportCSV() {
  const header = ["ชื่อของรางวัล", "เริ่มต้น", "วันที่1", "วันที่2", "วันที่3", "แจกรวม", "คงเหลือ"];
  const rows = state.map((it) => {
    const { total, remain } = calcRow(it);
    return [it.name, it.start, it.d1, it.d2, it.d3, total, remain];
  });
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gift-oph-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ------------------------------
// 🔄 RESET TO DEFAULT
// ------------------------------
async function resetToDefault() {
  if (!confirm("⚠️ ต้องการรีเซ็ตข้อมูลกลับค่าเริ่มต้นจริงหรือไม่?")) return;
  state = SEED.map((x) => ({ ...x }));
  render();
  await saveState();
  alert("✅ รีเซ็ตสำเร็จแล้ว!");
}

// ------------------------------
// 🔘 WIRE UP BUTTONS
// ------------------------------
document.getElementById("saveBtn").addEventListener("click", saveState);
document.getElementById("exportBtn").addEventListener("click", exportCSV);
document.getElementById("resetBtn").addEventListener("click", resetToDefault);

// ------------------------------
// 🧁 SMALL TOAST (optional)
// ------------------------------
function toast(msg, isError = false) {
  saveHintEl.textContent = msg;
  saveHintEl.classList.toggle("danger", isError);
  saveHintEl.classList.toggle("success", !isError);
  setTimeout(() => {
    saveHintEl.textContent = "";
    saveHintEl.classList.remove("danger", "success");
  }, 1500);
}

// ------------------------------
// 🚀 INIT
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {

  const autoDayInfo = document.getElementById("autoDayInfo");

  // --- เลือกวันที่จริงอัตโนมัติ ---
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1; // JS: 0 = January

  let autoDay = 1;

  if (m === 11) { // เดือนพฤศจิกายน
    if (d === 13) autoDay = 1;
    else if (d === 14) autoDay = 2;
    else if (d === 15) autoDay = 3;
    else autoDay = 1;
  }

  currentDay = autoDay;
  markDay();

  // แสดงข้อความว่าระบบเลือกวันไหนให้
  autoDayInfo.textContent = `วันนี้คือ: วันที่ ${autoDay} (เลือกอัตโนมัติ)`;

  loadFromFirebase();
});

// ------------------------------
// ➕ ADD NEW ITEM
// ------------------------------
document.getElementById("addNewBtn").addEventListener("click", () => {
  const name = prompt("🎁 ชื่อของรางวัลใหม่:");
  if (!name || !name.trim()) return;

  const startStr = prompt("จำนวนเริ่มต้น (ถ้าไม่รู้ให้ใส่ 0):");
  const start = Number(startStr);
  if (isNaN(start) || start < 0) return alert("จำนวนเริ่มต้นไม่ถูกต้อง");

  // เพิ่มเข้า state
  const newItem = {
    id: state.length ? Math.max(...state.map(x => x.id)) + 1 : 1,
    name: name.trim(),
    start: start,
    d1: 0,
    d2: 0,
    d3: 0,
  };

  state.push(newItem);
  render();
  saveState();
});
