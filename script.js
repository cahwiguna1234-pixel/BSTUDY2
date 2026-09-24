const defaultData = {
  tasks: [
    { id: 1, title: "Latihan soal integral", subject: "Matematika", due: "Hari ini, 20:00", priority: "high", done: false },
    { id: 2, title: "Rangkuman Revolusi Industri", subject: "Sejarah", due: "Besok, 18:00", priority: "medium", done: false },
    { id: 3, title: "Kuis struktur sel", subject: "Biologi", due: "Jum, 25 Sep", priority: "low", done: false },
    { id: 4, title: "Esai argumentative text", subject: "Bahasa Inggris", due: "Sen, 28 Sep", priority: "medium", done: true }
  ],
  schedules: [
    { id: 1, time: "09:00", duration: "45 mnt", title: "Kalkulus: Integral", subject: "Matematika" },
    { id: 2, time: "13:30", duration: "30 mnt", title: "Struktur Sel", subject: "Biologi" },
    { id: 3, time: "19:00", duration: "25 mnt", title: "Latihan Kosakata", subject: "Bahasa Inggris" }
  ],
  subjects: [
    { id: 1, name: "Matematika", description: "Kalkulus, aljabar, dan statistika", progress: 68, lessons: 24, color: "#6658eb", symbol: "∫", status: "active" },
    { id: 2, name: "Biologi", description: "Sel, genetika, dan ekosistem", progress: 52, lessons: 18, color: "#2fa483", symbol: "⌬", status: "active" },
    { id: 3, name: "Bahasa Inggris", description: "Grammar, writing, dan vocabulary", progress: 81, lessons: 30, color: "#e58c4d", symbol: "Aa", status: "active" },
    { id: 4, name: "Sejarah", description: "Sejarah dunia dan Indonesia", progress: 43, lessons: 16, color: "#477fcb", symbol: "IV", status: "active" },
    { id: 5, name: "Fisika", description: "Mekanika dan gelombang", progress: 100, lessons: 20, color: "#d65e72", symbol: "λ", status: "completed" },
    { id: 6, name: "Kimia", description: "Atom, senyawa, dan reaksi", progress: 35, lessons: 14, color: "#9671d6", symbol: "CH", status: "active" }
  ],
  notes: [
    { id: 1, title: "Rumus Integral Dasar", subject: "Matematika", content: "Integral merupakan kebalikan dari turunan. Catat aturan pangkat, substitusi, dan integral parsial untuk latihan berikutnya.", date: "24 Sep 2026", color: "#6658eb" },
    { id: 2, title: "Struktur dan Fungsi Sel", subject: "Biologi", content: "Membran sel mengatur pertukaran zat, inti menyimpan materi genetik, dan mitokondria menghasilkan energi.", date: "23 Sep 2026", color: "#2fa483" },
    { id: 3, title: "Industrial Revolution", subject: "Sejarah", content: "Revolusi Industri bermula di Inggris dan mengubah sistem produksi, urbanisasi, serta hubungan sosial masyarakat.", date: "21 Sep 2026", color: "#e58c4d" },
    { id: 4, title: "Argumentative Essay", subject: "Bahasa Inggris", content: "Struktur utama: thesis statement, arguments with evidence, counterargument, dan conclusion.", date: "19 Sep 2026", color: "#477fcb" }
  ],
  flashcards: [
    { question: "Apa yang dimaksud dengan integral tentu?", answer: "Integral dengan batas atas dan bawah yang menghasilkan nilai numerik berupa luas bersih di bawah kurva." },
    { question: "Apa rumus dasar integral pangkat?", answer: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C, dengan syarat n ≠ -1." },
    { question: "Apa fungsi utama mitokondria?", answer: "Menghasilkan energi dalam bentuk ATP melalui respirasi seluler." },
    { question: "Kapan Revolusi Industri pertama dimulai?", answer: "Sekitar tahun 1760 di Inggris, kemudian menyebar ke Eropa dan Amerika." }
  ],
  focusSeconds: 75 * 60,
  focusSessions: 3
};

const SUPABASE_URL = "https://yosmpjianhlvuctgnhum.supabase";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc21wamlhbmhsdnVjdGduaHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNjE1NjksImV4cCI6MjEwNTgzNzU2OX0.3ahWJ3n1LpgKCS8LIezHwwnkFxqiTeanuZNcPd_qo1E";
const supabaseConfigured = !SUPABASE_URL.includes("YOUR_PROJECT_ID") && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
const supabaseClient = supabaseConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const clone = value => JSON.parse(JSON.stringify(value));
const data = clone(defaultData);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let currentUser = null;
let authMode = "signin";
let cloudSaveTimer = null;
let currentTaskFilter = "all";
let currentSubjectFilter = "all";
let currentCard = 0;
let timerSeconds = 25 * 60;
let timerTotal = timerSeconds;
let timerInterval = null;
let modalType = "task";

function getStorageKey() {
  return currentUser ? `bstudy-data:${currentUser.id}` : "bstudy-data:local";
}

function loadLocalData() {
  const current = localStorage.getItem(getStorageKey());
  const legacy = currentUser ? null : localStorage.getItem("bstudy-data");
  const saved = JSON.parse(current || legacy || "null");
  Object.assign(data, clone(defaultData), saved || {});
}

function saveData() {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
  if (!supabaseClient || !currentUser) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(async () => {
    const { error } = await supabaseClient.from("bstudy_data").upsert({
      user_id: currentUser.id,
      data,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) console.error("Gagal menyinkronkan data BSTUDY:", error.message);
  }, 350);
}

async function loadCloudData() {
  const { data: row, error } = await supabaseClient
    .from("bstudy_data")
    .select("data")
    .eq("user_id", currentUser.id)
    .maybeSingle();
  if (error) {
    loadLocalData();
    showToast("Sinkronisasi gagal. Data lokal tetap dapat digunakan.");
    return;
  }
  Object.assign(data, clone(defaultData), row?.data || {});
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
  if (!row) saveData();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function navigate(view) {
  const target = document.getElementById(`${view}View`);
  if (!target) return;
  $$(".view").forEach(item => item.classList.remove("active"));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  target.classList.add("active");
  $("#sidebar").classList.remove("open");
  $("#mobileOverlay").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function priorityLabel(priority) {
  return { high: "TINGGI", medium: "SEDANG", low: "RENDAH" }[priority];
}

function renderTasks() {
  const pending = data.tasks.filter(task => !task.done);
  $("#dashboardTaskList").innerHTML = pending.slice(0, 3).map(taskTemplate).join("") || emptyState("Semua tugas sudah selesai.");
  const filtered = data.tasks.filter(task => currentTaskFilter === "all" || (currentTaskFilter === "done" ? task.done : !task.done));
  $("#fullTaskList").innerHTML = filtered.map(task => taskTemplate(task, true)).join("") || emptyState("Belum ada tugas pada kategori ini.");
  $("#allTaskCount").textContent = data.tasks.length;
  $("#pendingTaskCount").textContent = pending.length;
  $("#doneTaskCount").textContent = data.tasks.length - pending.length;
  $("#taskBadge").textContent = pending.length;
  $("#completedStat").textContent = 18 + data.tasks.filter(task => task.done).length;
  $("#focusTaskSelect").innerHTML = pending.map(task => `<option>${escapeHtml(task.title)}</option>`).join("") || "<option>Belajar mandiri</option>";
}

function taskTemplate(task, deletable = false) {
  return `<div class="task-item ${task.done ? "done" : ""}" data-id="${task.id}">
    <input class="task-check" type="checkbox" ${task.done ? "checked" : ""} aria-label="Tandai ${escapeHtml(task.title)} selesai">
    <div class="task-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject)} · ${escapeHtml(task.due)}</small></div>
    <span class="priority ${task.priority}">${priorityLabel(task.priority)}</span>
    ${deletable ? '<button class="task-delete" aria-label="Hapus tugas">×</button>' : ""}
  </div>`;
}

function renderSchedules() {
  $("#scheduleList").innerHTML = data.schedules.slice(0, 3).map(item => `<div class="schedule-item">
    <div class="schedule-time"><strong>${escapeHtml(item.time)}</strong><small>${escapeHtml(item.duration)}</small></div>
    <span class="schedule-color"></span>
    <div class="schedule-detail"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subject)}</small></div>
  </div>`).join("") || emptyState("Belum ada agenda hari ini.");
}

function renderSubjects() {
  const subjects = data.subjects.filter(item => currentSubjectFilter === "all" || item.status === currentSubjectFilter);
  $("#subjectGrid").innerHTML = subjects.map(item => `<article class="panel subject-card" style="--card-color:${item.color}">
    <div class="subject-cover"><small>${item.status === "completed" ? "SELESAI" : "SEDANG DIPELAJARI"}</small><span class="subject-symbol">${escapeHtml(item.symbol)}</span></div>
    <div class="subject-content"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="progress-line"><span style="width:${item.progress}%;background:${item.color}"></span></div>
      <div class="subject-meta"><span>${item.progress}% selesai</span><span>${item.lessons} materi</span></div>
    </div>
  </article>`).join("") || emptyState("Belum ada pelajaran pada kategori ini.");
}

function renderNotes() {
  $("#notesGrid").innerHTML = data.notes.map(note => `<article class="panel note-card" style="--note-color:${note.color}" data-id="${note.id}">
    <div class="note-top"><span>${escapeHtml(note.subject)}</span><span>${escapeHtml(note.date)}</span></div>
    <h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.content)}</p>
    <button class="note-delete" aria-label="Hapus catatan">Hapus</button>
  </article>`).join("") || emptyState("Belum ada catatan. Buat catatan pertamamu.");
}

function renderFlashcard() {
  if (!data.flashcards.length) return;
  currentCard = Math.min(currentCard, data.flashcards.length - 1);
  const card = data.flashcards[currentCard];
  $("#flashQuestion").textContent = card.question;
  $("#flashAnswer").textContent = card.answer;
  $("#cardCounter").textContent = `Kartu ${currentCard + 1} dari ${data.flashcards.length}`;
  $("#flashcard").classList.remove("flipped");
  $("#deckList").innerHTML = `<h3>Koleksi kartu</h3>
    <button class="deck-item active"><strong>Campuran pelajaran</strong><span>${data.flashcards.length} kartu · Dipelajari hari ini</span></button>
    <button class="deck-item"><strong>Matematika</strong><span>12 kartu</span></button>
    <button class="deck-item"><strong>Biologi</strong><span>8 kartu</span></button>`;
}

function renderProgress() {
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const values = [58, 76, 42, 88, 64, 95, 70];
  $("#barChart").innerHTML = values.map((value, index) => `<div class="bar-column"><div class="bar" style="height:${value}%" title="${Math.round(value * 1.8)} menit"></div><span>${days[index]}</span></div>`).join("");
  $("#subjectProgressList").innerHTML = data.subjects.slice(0, 5).map(item => `<div class="subject-progress-item"><div class="subject-progress-top"><span>${escapeHtml(item.name)}</span><span>${item.progress}%</span></div><div class="progress-line"><span style="width:${item.progress}%;background:${item.color}"></span></div></div>`).join("");
}

function emptyState(message) {
  return `<p style="color:var(--muted);font-size:12px;padding:18px 0">${message}</p>`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function setCurrentDate() {
  const formatted = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  $("#currentDate").textContent = formatted.toUpperCase();
}

function setAuthMessage(message, success = false) {
  $("#authMessage").textContent = message;
  $("#authMessage").classList.toggle("success", success);
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignUp = mode === "signup";
  $("#authNameField").hidden = !isSignUp;
  $("#authName").required = isSignUp;
  $("#authPassword").autocomplete = isSignUp ? "new-password" : "current-password";
  $("#authTitle").textContent = isSignUp ? "Buat akun baru" : "Masuk ke akunmu";
  $("#authSubtitle").textContent = isSignUp ? "Mulai ruang belajar yang tersinkron di semua perangkat." : "Lanjutkan perjalanan belajar dari tempat terakhir.";
  $("#authSubmit").textContent = isSignUp ? "Daftar akun" : "Masuk";
  $("#authSwitchPrompt").textContent = isSignUp ? "Sudah punya akun?" : "Belum punya akun?";
  $("#authSwitch").textContent = isSignUp ? "Masuk" : "Daftar sekarang";
  setAuthMessage("");
}

function showAuth() {
  $("#authOverlay").classList.remove("closed");
  $("#authOverlay").setAttribute("aria-hidden", "false");
}

function hideAuth() {
  if ($("#authOverlay").contains(document.activeElement)) document.activeElement.blur();
  $("#authOverlay").classList.add("closed");
  $("#authOverlay").setAttribute("aria-hidden", "true");
}

function updateAccount() {
  if (!currentUser) {
    $("#accountName").textContent = "Mode lokal";
    $("#accountEmail").textContent = "Belum masuk";
    $("#profileInitials").textContent = "BS";
    $("#logoutButton").hidden = true;
    return;
  }
  const name = currentUser.user_metadata?.full_name || currentUser.email.split("@")[0];
  $("#accountName").textContent = name;
  $("#accountEmail").textContent = currentUser.email;
  $("#profileInitials").textContent = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  $("#logoutButton").hidden = false;
}

async function completeLogin(user) {
  currentUser = user;
  await loadCloudData();
  updateAccount();
  renderAll();
  hideAuth();
  showToast("Login berhasil. Data BSTUDY sudah tersinkron.");
}

async function initAuth() {
  if (!supabaseClient) {
    $("#authConfigNote").hidden = false;
    showAuth();
    return;
  }
  const { data: sessionData, error } = await supabaseClient.auth.getSession();
  if (error) setAuthMessage(error.message);
  if (sessionData?.session?.user) await completeLogin(sessionData.session.user);
  else showAuth();
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user && currentUser?.id !== session.user.id) completeLogin(session.user);
    if (event === "SIGNED_OUT") {
      currentUser = null;
      Object.assign(data, clone(defaultData));
      updateAccount();
      renderAll();
      showAuth();
    }
  });
}

async function submitAuth(event) {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthMessage("Isi SUPABASE_URL dan SUPABASE_ANON_KEY di script.js terlebih dahulu.");
    return;
  }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const name = $("#authName").value.trim();
  $("#authSubmit").disabled = true;
  $("#authSubmit").textContent = "Memproses...";
  try {
    if (authMode === "signup") {
      const { data: result, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) throw error;
      if (result.session) await completeLogin(result.user);
      else setAuthMessage("Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.", true);
    } else {
      const { data: result, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await completeLogin(result.user);
    }
  } catch (error) {
    setAuthMessage(error.message || "Autentikasi gagal. Silakan coba lagi.");
  } finally {
    $("#authSubmit").disabled = false;
    $("#authSubmit").textContent = authMode === "signup" ? "Daftar akun" : "Masuk";
  }
}

async function signOut() {
  if (supabaseClient && currentUser) await supabaseClient.auth.signOut();
  currentUser = null;
  updateAccount();
  showAuth();
}

function openModal(type) {
  modalType = type;
  const configurations = {
    task: {
      eyebrow: "RENCANAKAN",
      title: "Tambah tugas baru",
      fields: `<div class="form-group"><label for="itemTitle">Nama tugas</label><input id="itemTitle" name="title" required placeholder="Contoh: Latihan bab 5"></div>
        <div class="form-row"><div class="form-group"><label for="itemSubject">Pelajaran</label><input id="itemSubject" name="subject" required placeholder="Matematika"></div><div class="form-group"><label for="itemDue">Tenggat</label><input id="itemDue" name="due" required placeholder="Besok, 19:00"></div></div>
        <div class="form-group"><label for="itemPriority">Prioritas</label><select id="itemPriority" name="priority"><option value="high">Tinggi</option><option value="medium" selected>Sedang</option><option value="low">Rendah</option></select></div>`
    },
    note: {
      eyebrow: "CATAT IDE",
      title: "Buat catatan baru",
      fields: `<div class="form-group"><label for="itemTitle">Judul catatan</label><input id="itemTitle" name="title" required placeholder="Judul yang mudah dicari"></div>
        <div class="form-group"><label for="itemSubject">Pelajaran</label><input id="itemSubject" name="subject" required placeholder="Nama pelajaran"></div>
        <div class="form-group"><label for="itemContent">Isi catatan</label><textarea id="itemContent" name="content" required placeholder="Tulis rangkuman atau ide penting..."></textarea></div>`
    },
    subject: {
      eyebrow: "PELAJARAN BARU",
      title: "Tambah pelajaran",
      fields: `<div class="form-group"><label for="itemTitle">Nama pelajaran</label><input id="itemTitle" name="title" required placeholder="Contoh: Geografi"></div>
        <div class="form-group"><label for="itemContent">Deskripsi</label><input id="itemContent" name="content" required placeholder="Topik yang akan dipelajari"></div>
        <div class="form-group"><label for="itemSymbol">Simbol singkat</label><input id="itemSymbol" name="symbol" maxlength="2" required placeholder="G"></div>`
    },
    schedule: {
      eyebrow: "AGENDA HARI INI",
      title: "Tambah jadwal belajar",
      fields: `<div class="form-group"><label for="itemTitle">Materi</label><input id="itemTitle" name="title" required placeholder="Materi yang dipelajari"></div>
        <div class="form-group"><label for="itemSubject">Pelajaran</label><input id="itemSubject" name="subject" required placeholder="Nama pelajaran"></div>
        <div class="form-row"><div class="form-group"><label for="itemTime">Waktu</label><input id="itemTime" name="time" type="time" required></div><div class="form-group"><label for="itemDuration">Durasi</label><select id="itemDuration" name="duration"><option>25 mnt</option><option>30 mnt</option><option>45 mnt</option><option>60 mnt</option></select></div></div>`
    },
    flashcard: {
      eyebrow: "ACTIVE RECALL",
      title: "Buat flashcard",
      fields: `<div class="form-group"><label for="itemQuestion">Pertanyaan</label><textarea id="itemQuestion" name="question" required placeholder="Tulis pertanyaan..."></textarea></div>
        <div class="form-group"><label for="itemAnswer">Jawaban</label><textarea id="itemAnswer" name="answer" required placeholder="Tulis jawaban ringkas..."></textarea></div>`
    }
  };
  const config = configurations[type];
  $("#modalEyebrow").textContent = config.eyebrow;
  $("#modalTitle").textContent = config.title;
  $("#modalForm").innerHTML = `${config.fields}<button class="primary-btn wide" type="submit">Simpan</button>`;
  $("#modalOverlay").classList.add("open");
  $("#modalOverlay").setAttribute("aria-hidden", "false");
  setTimeout(() => $("#modalForm input, #modalForm textarea")?.focus(), 50);
}

function closeModal() {
  if ($("#modalOverlay").contains(document.activeElement)) document.activeElement.blur();
  $("#modalOverlay").classList.remove("open");
  $("#modalOverlay").setAttribute("aria-hidden", "true");
}

function submitModal(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const nextId = Date.now();
  if (modalType === "task") data.tasks.unshift({ id: nextId, title: form.get("title"), subject: form.get("subject"), due: form.get("due"), priority: form.get("priority"), done: false });
  if (modalType === "note") data.notes.unshift({ id: nextId, title: form.get("title"), subject: form.get("subject"), content: form.get("content"), date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date()), color: "#6658eb" });
  if (modalType === "subject") data.subjects.unshift({ id: nextId, name: form.get("title"), description: form.get("content"), progress: 0, lessons: 0, color: "#6658eb", symbol: form.get("symbol"), status: "active" });
  if (modalType === "schedule") data.schedules.push({ id: nextId, title: form.get("title"), subject: form.get("subject"), time: form.get("time"), duration: form.get("duration") });
  if (modalType === "flashcard") data.flashcards.push({ question: form.get("question"), answer: form.get("answer") });
  saveData();
  renderAll();
  closeModal();
  showToast("Berhasil disimpan ke BSTUDY.");
}

function toggleTask(id, done) {
  const task = data.tasks.find(item => item.id === id);
  if (!task) return;
  task.done = done;
  saveData();
  renderTasks();
  showToast(done ? "Tugas ditandai selesai." : "Tugas dikembalikan ke daftar aktif.");
}

function setupSearch() {
  const input = $("#globalSearch");
  const results = $("#searchResults");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) return results.classList.remove("open");
    const items = [
      ...data.tasks.map(item => ({ title: item.title, meta: `Tugas · ${item.subject}`, view: "tasks" })),
      ...data.notes.map(item => ({ title: item.title, meta: `Catatan · ${item.subject}`, view: "notes" })),
      ...data.subjects.map(item => ({ title: item.name, meta: "Pelajaran", view: "subjects" }))
    ].filter(item => `${item.title} ${item.meta}`.toLowerCase().includes(query)).slice(0, 7);
    results.innerHTML = items.map(item => `<button class="search-result" data-result-view="${item.view}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></button>`).join("") || emptyState("Tidak ada hasil yang ditemukan.");
    results.classList.add("open");
  });
  results.addEventListener("click", event => {
    const item = event.target.closest("[data-result-view]");
    if (!item) return;
    navigate(item.dataset.resultView);
    results.classList.remove("open");
    input.value = "";
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".search-wrap")) results.classList.remove("open");
  });
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape") {
      results.classList.remove("open");
      closeModal();
    }
  });
}

function setTimer(minutes) {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = minutes * 60;
  timerTotal = timerSeconds;
  $("#startTimer").textContent = "Mulai fokus";
  $("#timerStatus").textContent = "SIAP DIMULAI";
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (timerSeconds % 60).toString().padStart(2, "0");
  $("#timerDisplay").textContent = `${minutes}:${seconds}`;
  const progress = ((timerTotal - timerSeconds) / timerTotal) * 100;
  $("#timerRing").style.setProperty("--timer-progress", `${progress}%`);
  document.title = timerInterval ? `${minutes}:${seconds} — BSTUDY` : "BSTUDY — Ruang Belajar Pribadi";
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    $("#startTimer").textContent = "Lanjutkan";
    $("#timerStatus").textContent = "DIJEDA";
    updateTimerDisplay();
    return;
  }
  $("#startTimer").textContent = "Jeda";
  $("#timerStatus").textContent = "SEDANG FOKUS";
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      data.focusSessions++;
      data.focusSeconds += timerTotal;
      saveData();
      $("#sessionCount").textContent = data.focusSessions;
      $("#focusMinutes").textContent = Math.round(data.focusSeconds / 60);
      showToast("Sesi selesai. Saatnya beristirahat!");
      setTimer(5);
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function renderAll() {
  renderTasks();
  renderSchedules();
  renderSubjects();
  renderNotes();
  renderFlashcard();
  renderProgress();
  $("#sessionCount").textContent = data.focusSessions;
  $("#focusMinutes").textContent = Math.round(data.focusSeconds / 60);
}

$("#authForm").addEventListener("submit", submitAuth);
$("#authSwitch").addEventListener("click", () => setAuthMode(authMode === "signin" ? "signup" : "signin"));
$("#togglePassword").addEventListener("click", () => {
  const password = $("#authPassword");
  const visible = password.type === "text";
  password.type = visible ? "password" : "text";
  $("#togglePassword").textContent = visible ? "Lihat" : "Sembunyi";
});
$("#localModeButton").addEventListener("click", () => {
  currentUser = null;
  loadLocalData();
  updateAccount();
  renderAll();
  hideAuth();
  showToast("BSTUDY berjalan dalam mode lokal.");
});
$("#logoutButton").addEventListener("click", signOut);
$("#profileButton").addEventListener("click", () => { if (!currentUser) showAuth(); });

$$('[data-view]').forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
$$('[data-view-target]').forEach(button => button.addEventListener("click", () => navigate(button.dataset.viewTarget)));

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.add("open");
  $("#mobileOverlay").classList.add("open");
});
$("#mobileOverlay").addEventListener("click", () => {
  $("#sidebar").classList.remove("open");
  $("#mobileOverlay").classList.remove("open");
});

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("bstudy-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

$("#dashboardTaskList").addEventListener("change", event => {
  if (event.target.matches(".task-check")) toggleTask(Number(event.target.closest(".task-item").dataset.id), event.target.checked);
});
$("#fullTaskList").addEventListener("change", event => {
  if (event.target.matches(".task-check")) toggleTask(Number(event.target.closest(".task-item").dataset.id), event.target.checked);
});
$("#fullTaskList").addEventListener("click", event => {
  const button = event.target.closest(".task-delete");
  if (!button) return;
  const id = Number(button.closest(".task-item").dataset.id);
  data.tasks = data.tasks.filter(task => task.id !== id);
  saveData();
  renderTasks();
  showToast("Tugas dihapus.");
});

$$('[data-task-filter]').forEach(button => button.addEventListener("click", () => {
  currentTaskFilter = button.dataset.taskFilter;
  $$('[data-task-filter]').forEach(item => item.classList.toggle("active", item === button));
  renderTasks();
}));
$$('[data-subject-filter]').forEach(button => button.addEventListener("click", () => {
  currentSubjectFilter = button.dataset.subjectFilter;
  $$('[data-subject-filter]').forEach(item => item.classList.toggle("active", item === button));
  renderSubjects();
}));

$("#notesGrid").addEventListener("click", event => {
  const button = event.target.closest(".note-delete");
  if (!button) return;
  data.notes = data.notes.filter(note => note.id !== Number(button.closest(".note-card").dataset.id));
  saveData();
  renderNotes();
  showToast("Catatan dihapus.");
});

$("#flashcard").addEventListener("click", () => $("#flashcard").classList.toggle("flipped"));
$("#prevCard").addEventListener("click", () => { currentCard = (currentCard - 1 + data.flashcards.length) % data.flashcards.length; renderFlashcard(); });
$("#nextCard").addEventListener("click", () => { currentCard = (currentCard + 1) % data.flashcards.length; renderFlashcard(); });
$$('[data-rating]').forEach(button => button.addEventListener("click", () => {
  currentCard = (currentCard + 1) % data.flashcards.length;
  renderFlashcard();
  showToast(button.dataset.rating === "easy" ? "Bagus! Kartu ditandai mudah." : "Kartu ini akan diulang lebih sering.");
}));

$$('[data-action]').forEach(button => button.addEventListener("click", () => {
  const action = button.dataset.action;
  if (action === "add-task" || action === "quick-add") openModal("task");
  if (action === "add-note") openModal("note");
  if (action === "add-subject") openModal("subject");
  if (action === "add-schedule") openModal("schedule");
  if (action === "add-flashcard") openModal("flashcard");
  if (action === "continue-course") { navigate("focus"); showToast("Sesi Kalkulus siap dimulai."); }
}));

$("#modalClose").addEventListener("click", closeModal);
$("#modalOverlay").addEventListener("click", event => { if (event.target === $("#modalOverlay")) closeModal(); });
$("#modalForm").addEventListener("submit", submitModal);

$$('.mode-tabs button').forEach(button => button.addEventListener("click", () => {
  $$('.mode-tabs button').forEach(item => item.classList.toggle("active", item === button));
  setTimer(Number(button.dataset.minutes));
}));
$("#startTimer").addEventListener("click", toggleTimer);
$("#resetTimer").addEventListener("click", () => setTimer(Math.round(timerTotal / 60)));
$("#skipTimer").addEventListener("click", () => { setTimer(5); showToast("Beralih ke istirahat singkat."); });

if (localStorage.getItem("bstudy-theme") === "dark") document.body.classList.add("dark");
setCurrentDate();
renderAll();
setupSearch();
initAuth();
