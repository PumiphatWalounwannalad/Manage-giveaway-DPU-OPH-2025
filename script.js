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

const KEY = "gift-inventory-3day-v3";
let state = JSON.parse(localStorage.getItem(KEY)) || SEED;
let currentDay = 1;
const body = document.getElementById("body");

function calcRow(item) {
  const total = (item.d1 || 0) + (item.d2 || 0) + (item.d3 || 0);
  const remain = Math.max(item.start - total, 0);
  return { total, remain };
}

function render() {
  body.innerHTML = "";
  state.forEach((item) => {
    const { total, remain } = calcRow(item);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="name" data-label="ชื่อของรางวัล">${item.name}</td>
      <td class="qty" data-label="เริ่มต้น">${item.start}</td>
      <td class="qty" data-label="วัน1">${item.d1}</td>
      <td class="qty" data-label="วัน2">${item.d2}</td>
      <td class="qty" data-label="วัน3">${item.d3}</td>
      <td class="qty" data-label="แจกรวม">${total}</td>
      <td class="qty" data-label="คงเหลือ">${remain}</td>
      <td data-label="จัดการ">
      <div class="row-controls">
        <button class="mini" data-act="plus1" data-id="${item.id}" aria-label="แจก 1">+</button>
        <button class="mini" data-act="minus1" data-id="${item.id}" aria-label="คืน 1">−</button>
        <input class="num-in" type="number" placeholder="จำนวน"/>
        <button class="mini" data-act="bulkPlus" data-id="${item.id}">แจกหลายรายการ</button>
        <button class="mini" data-act="bulkMinus" data-id="${item.id}">ลบหลายรายการ</button>

      </div>
      </td>`;
    body.appendChild(tr);
  });
}

function findItem(id) {
  return state.find((x) => x.id === id);
}

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

async function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
  const el = document.getElementById("saveHint");
  el.textContent = "⏳ กำลังบันทึก...";
  el.classList.add("saving");

  try {
    // คำนวณ total / remain ก่อนส่งขึ้นชีต
    const rows = state.map((it) => {
      const { total, remain } = calcRow(it);
      return {
        name: it.name,
        start: it.start,
        d1: it.d1,
        d2: it.d2,
        d3: it.d3,
        total,
        remain,
      };
    });

    // ส่งข้อมูลทั้งหมดไปยัง Google Apps Script
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    const result = await res.json();
    console.log("✅ Synced to Google Sheet:", result);

    el.textContent = "✅ บันทึกและซิงก์สำเร็จ!";
    el.classList.remove("saving");
    el.classList.add("success");
    setTimeout(() => {
      el.textContent = "";
      el.classList.remove("success");
    }, 1200);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    el.textContent = "⚠️ บันทึกไม่สำเร็จ (ตรวจ API URL)";
    el.classList.remove("saving");
  }
}


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

document.getElementById("saveBtn").addEventListener("click", saveState);
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("รีเซ็ตข้อมูลทั้งหมด?")) {
    state = SEED.map((x) => ({ ...x }));
    saveState();
    render();
  }
});
document.getElementById("exportBtn").addEventListener("click", () => {
  const header = [
    "ชื่อของรางวัล",
    "เริ่มต้น",
    "วัน1",
    "วัน2",
    "วัน3",
    "แจกรวม",
    "คงเหลือ",
  ];
  const rows = state.map((it) => {
    const { total, remain } = calcRow(it);
    return [it.name, it.start, it.d1, it.d2, it.d3, total, remain];
  });
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "inventory-light.csv";
  a.click();
});

// Import CSV
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const lines = ev.target.result.split(/\r?\n/).filter((x) => x.trim());
    const newState = [];
    for (let i = 1; i < lines.length; i++) {
      const [name, start, d1, d2, d3] = lines[i].split(",");
      if (!name) continue;
      newState.push({
        id: i,
        name,
        start: +start || 0,
        d1: +d1 || 0,
        d2: +d2 || 0,
        d3: +d3 || 0,
      });
    }
    if (newState.length) {
      state = newState;
      saveState();
      render();
      alert("✅ โหลดข้อมูลจาก CSV สำเร็จ!");
    } else alert("⚠️ ไฟล์ไม่ถูกต้องหรือว่างเปล่า");
  };
  reader.readAsText(file, "utf-8");
});

  // set CSS variable --header-h to the header height so sticky table headers sit below the page header
  function updateHeaderHeight(){
    const headerEl = document.querySelector('header');
    const h = headerEl ? headerEl.getBoundingClientRect().height : 0;
    // add small gap
    document.documentElement.style.setProperty('--header-h', (h + 6) + 'px');
    // also set the table header height so we can reserve space for it
    const th = document.querySelector('th');
    const thh = th ? Math.ceil(th.getBoundingClientRect().height) : 44;
    document.documentElement.style.setProperty('--thead-h', (thh) + 'px');
  }
  window.addEventListener('resize', updateHeaderHeight);
  window.addEventListener('DOMContentLoaded', updateHeaderHeight);
  // run once now (script is at end of body but ensure value set)
  updateHeaderHeight();

  render();
  markDay();

  // Track whether the table header is stuck and toggle a class to reserve space only when stuck
  let ticking = false;
  function checkHeaderStuck(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const tbl = document.querySelector('table#tbl');
      if(!tbl){
        document.documentElement.classList.remove('thead-stuck');
        ticking = false;
        return;
      }
      const rect = tbl.getBoundingClientRect();
      // if the table's top has reached the header offset (meaning the thead will stick), mark stuck
      if(rect.top <= headerH + 1){
        document.documentElement.classList.add('thead-stuck');
      } else {
        document.documentElement.classList.remove('thead-stuck');
      }
      ticking = false;
    });
  }

  window.addEventListener('scroll', checkHeaderStuck, { passive: true });
  window.addEventListener('resize', ()=>{ updateHeaderHeight(); checkHeaderStuck(); });
  // run a check after rendering
  checkHeaderStuck();

  // --- IntersectionObserver sentinel approach for more reliable stuck detection ---
  // create a sentinel just before the table to observe when it scrolls under the header
  function ensureSentinel(){
    let sentinel = document.getElementById('thead-sentinel');
    const tbl = document.querySelector('table#tbl');
    if(!tbl) return null;
    if(!sentinel){
      sentinel = document.createElement('div');
      sentinel.id = 'thead-sentinel';
      // visually hidden, tiny
      sentinel.style.position = 'absolute';
      sentinel.style.width = '1px';
      sentinel.style.height = '1px';
      sentinel.style.top = '0';
      sentinel.style.left = '0';
      tbl.parentElement.insertBefore(sentinel,tbl);
    }
    return sentinel;
  }

  let io = null;
  function setupSentinelObserver(){
    const sentinel = ensureSentinel();
    if(!sentinel) return;
    if(io) io.disconnect();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    io = new IntersectionObserver((entries)=>{
      const e = entries[0];
      // when sentinel is NOT intersecting the root (i.e., scrolled past), the header should be stuck
      if(!e.isIntersecting){
        document.documentElement.classList.add('thead-stuck');
      } else {
        document.documentElement.classList.remove('thead-stuck');
      }
    },{ root: null, rootMargin: `-${headerH}px 0px 0px 0px`, threshold: 0 });
    io.observe(sentinel);
  }

  // call after initial layout
  setupSentinelObserver();
  // also recreate observer when header/table sizes change
  window.addEventListener('resize', ()=>{ updateHeaderHeight(); setupSentinelObserver(); });
  window.addEventListener('load', ()=>{ updateHeaderHeight(); setupSentinelObserver(); });

  // --- Google Sheets Integration ---
const SHEET_ID = "1s_CBpE216lMswcGtEUl-qu0u958naypYod6NZ2ne1YE";
const API_KEY = "AIzaSyDE_O3jXQNPSXmnA51zKJ4KXGtM7D_PGZ0";
const RANGE = "ชีต1";

async function loadFromSheet() {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
    );
    const data = await res.json();
    if (!data.values || data.values.length <= 1) {
      console.warn("No data rows found in sheet");
      return;
    }

    // แปลงข้อมูลจาก Google Sheet เป็น state ที่เว็บใช้
    const headers = data.values[0];
    const rows = data.values.slice(1).map((row, i) => ({
      id: i + 1,
      name: row[0] || "",
      start: Number(row[1] || 0),
      d1: Number(row[2] || 0),
      d2: Number(row[3] || 0),
      d3: Number(row[4] || 0),
    }));

    state = rows;
    saveState();
    render();
    console.log("✅ Loaded data from Google Sheets");
  } catch (err) {
    console.error("❌ Error loading from Google Sheets:", err);
  }
}

window.addEventListener("DOMContentLoaded", loadFromSheet);

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzd335zd0rsbzLkB2DaYSrtC77boVVRoDgMFhuyVT-UOujYMk5NoiS5TgIzzohU09V4eQ/exec" ;

