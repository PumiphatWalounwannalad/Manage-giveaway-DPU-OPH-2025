// ------------------------------
// 🎯 INITIAL DATA
// ------------------------------
const SEED = [
  { name: "เข็มกลัด", start: 1520 },
  { name: "ปากกา", start: 412 },
  { name: "สติ๊กเกอร์", start: 400 },
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
const body = document.getElementById("body");

// ------------------------------
// 🧮 CALCULATIONS
// ------------------------------
function calcRow(item) {
  const total = (item.d1 || 0) + (item.d2 || 0) + (item.d3 || 0);
  const remain = Math.max(item.start - total, 0);
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
// ------------------------------
// 💾 SAVE TO FIREBASE
async function saveState() {
  const el = document.getElementById("saveHint");
  const timeEl = document.getElementById("lastUpdated");
  el.textContent = "⏳ กำลังบันทึก...";
  try {
    const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    await window.DB_REF.set({
      updatedAt: now,
      items: state
    });
    el.textContent = "✓ บันทึกแล้ว (Firebase)";
    el.classList.add("success");
    timeEl.textContent = `อัปเดตล่าสุดเมื่อ: ${now}`;
  } catch (err) {
    console.error("❌ Sync failed:", err);
    el.textContent = "⚠️ บันทึกไม่สำเร็จ";
  }
  setTimeout(() => {
    el.textContent = "";
    el.classList.remove("success");
  }, 2000);
}


// ------------------------------
// 🧠 LOAD FROM FIREBASE
// ------------------------------
// 🧠 LOAD FROM FIREBASE
function loadFromFirebase() {
  window.DB_REF.on("value", (snapshot) => {
    const data = snapshot.val();
    const timeEl = document.getElementById("lastUpdated");

    if (data && data.items) {
      state = data.items;
      render();
      if (data.updatedAt) timeEl.textContent = `อัปเดตล่าสุดเมื่อ: ${data.updatedAt}`;
      console.log("✅ Loaded data from Firebase");
    } else {
      // ถ้าไม่มีข้อมูล ให้ใช้ SEED เริ่มต้น
      state = SEED.map((x) => ({ ...x }));
      saveState();
      render();
      console.log("📦 Initialized with SEED data");
    }
  });
}


// ------------------------------
// ⚙️ EVENT: TABLE BUTTONS
// ------------------------------
body.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = +btn.dataset.id,
    act = btn.dataset.act,
    row = findItem(id);
  const dayKey = ["d1", "d2", "d3"][currentDay - 1];
  const input = btn.parentElement.querySelector("input");
  const val = input?.value ? +input.value : 0;
  const { remain } = calcRow(row);

  if (act === "plus1" && remain > 0) row[dayKey]++;
  else if (act === "minus1" && row[dayKey] > 0) row[dayKey]--;
  else if (act === "bulkMinus" && val > 0) {
    row[dayKey] = Math.max((row[dayKey] || 0) - val, 0);
    input.value = "";
  } else if (act === "bulkPlus" && val > 0) {
    if (remain <= 0) return;
    row[dayKey] = (row[dayKey] || 0) + Math.min(val, remain);
    input.value = "";
  }

  saveState();
  render();
});

// ------------------------------
// 📅 CHANGE DAY
// ------------------------------
const dayPills = document.getElementById("dayPills");
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
// 🚀 INIT
// ------------------------------
window.addEventListener("DOMContentLoaded", () => {
  markDay();
  loadFromFirebase();
});
