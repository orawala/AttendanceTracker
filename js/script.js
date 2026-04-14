let subjects = JSON.parse(localStorage.getItem("subjects")) || ["DSA","NA","OOP","MP","SE"];
let attendance = JSON.parse(localStorage.getItem("attendance")) || {};
let tempMark = {};

let currentDate = new Date().toISOString().split("T")[0];
let currentMonth = new Date();

function saveAll() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
  localStorage.setItem("attendance", JSON.stringify(attendance));
}

function renderDashboard() {
  const d = document.getElementById("dashboard-data");
  d.innerHTML = "";

  subjects.forEach(sub => {
    let p = 0, a = 0;

    Object.values(attendance[sub] || {}).forEach(e => {
      if (e.status === "present") p += e.count;
      if (e.status === "absent") a += e.count;
    });

    const total = p + a;
    const percent = total ? ((p / total) * 100).toFixed(1) : 0;

    let msg = percent >= 75
      ? "You can miss " + Math.max(0, Math.floor((p - 0.75 * total) / 0.75)) + " classes"
      : "Attend " + Math.ceil((0.75 * total - p) / 0.25) + " classes";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<b>${sub}</b><br>${percent}%<br>${msg}`;
    d.appendChild(card);
  });
}

function createCard(sub) {
  const existing = attendance[sub]?.[currentDate];
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="row"><span>${sub}</span></div>
    <div class="row">
      <select>
        ${[1,2,3,4].map(n => `<option ${existing?.count == n ? "selected" : ""}>${n}</option>`).join("")}
      </select>
      <div class="actions">
        <button class="btn present">Present</button>
        <button class="btn absent">Absent</button>
        <button class="btn none">Not Conducted</button>
      </div>
    </div>
  `;

  const btns = card.querySelectorAll(".btn");
  const select = card.querySelector("select");

  if (existing) {
    card.querySelector(`.${existing.status}`)?.classList.add("active");
  }

  btns.forEach(btn => {
    btn.onclick = () => {
      const status = btn.classList.contains("present")
        ? "present"
        : btn.classList.contains("absent")
        ? "absent"
        : "none";

      tempMark[sub] = { status, count: Number(select.value) };

      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  return card;
}

function submitAttendance() {
  Object.keys(tempMark).forEach(sub => {
    if (!attendance[sub]) attendance[sub] = {};
    attendance[sub][currentDate] = tempMark[sub];
  });

  tempMark = {};
  saveAll();
  render();
  showScreen("dashboard");
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  days.forEach(d => {
    const div = document.createElement("div");
    div.className = "day header";
    div.innerText = d;
    cal.appendChild(div);
  });

  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();

  document.getElementById("monthLabel").innerText =
    currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < first; i++) {
    cal.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= total; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const div = document.createElement("div");
    div.className = "day";
    div.innerText = d;

    div.onclick = () => {
      currentDate = dateStr;
      document.getElementById("markDateTitle").innerText = "Editing: " + formatDate(dateStr);
      showScreen("mark");
      renderMark();
    };

    cal.appendChild(div);
  }
}

function changeMonth(dir) {
  currentMonth.setMonth(currentMonth.getMonth() + dir);
  renderCalendar();
}

function renderMark() {
  const c = document.getElementById("subjects-container");
  c.innerHTML = "";

  if (subjects.length === 0) {
    c.innerHTML = "<div class='card'>No subjects added yet</div>";
    return;
  }

  subjects.forEach(s => c.appendChild(createCard(s)));
}

function renderSubjects() {
  const list = document.getElementById("subject-list");
  list.innerHTML = "";

  subjects.forEach((s, i) => {
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML = `${s} <button onclick="deleteSubject(${i})">Delete</button>`;
    list.appendChild(d);
  });
}

function render() {
  renderDashboard();
  renderCalendar();
  renderMark();
  renderSubjects();
}

function addSubject() {
  const input = document.getElementById("new-subject");
  if (!input.value.trim()) return;

  subjects.push(input.value.trim());
  input.value = "";

  saveAll();
  render();
}

function deleteSubject(i) {
  subjects.splice(i, 1);
  saveAll();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify({ subjects, attendance })]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "attendance.json";
  a.click();
}

function handleImport() {
  const file = document.getElementById("importFile").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    subjects = data.subjects || [];
    attendance = data.attendance || {};

    saveAll();
    render();
  };

  reader.readAsText(file);
}

function resetData() {
  if (confirm("Reset?")) {
    subjects = [];
    attendance = {};
    saveAll();
    render();
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".navbar button").forEach(btn => {
    btn.classList.toggle("active", btn.innerText.toLowerCase() === id);
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(dateStr);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return `${days[date.getDay()]}, ${d}-${m}-${y}`;
}

document.getElementById("date").innerText = "Today • " + formatDate(currentDate);

render();