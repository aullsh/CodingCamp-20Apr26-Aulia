/* ===================================================
   Personal Dashboard — app.js
   Challenges implemented:
     1. Light / Dark mode
     2. Custom name in greeting
     3. Prevent duplicate tasks
     4. Sort tasks
   =================================================== */

// ── Storage helpers ──────────────────────────────────
const store = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};

// ── Greeting & DateTime ──────────────────────────────
function updateDateTime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('datetime').textContent = `${dateStr} · ${timeStr}`;

  const hour = now.getHours();
  const period = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = store.get('userName', '');
  document.getElementById('greeting').textContent = name ? `${period}, ${name}!` : `${period}!`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// ── Custom Name ──────────────────────────────────────
const nameModal  = document.getElementById('nameModal');
const nameInput  = document.getElementById('nameInput');

document.getElementById('nameBtn').addEventListener('click', () => {
  nameInput.value = store.get('userName', '');
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

document.getElementById('saveName').addEventListener('click', () => {
  const val = nameInput.value.trim();
  store.set('userName', val);
  nameModal.classList.add('hidden');
  updateDateTime();
});

document.getElementById('cancelName').addEventListener('click', () => {
  nameModal.classList.add('hidden');
});

nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) nameModal.classList.add('hidden');
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('saveName').click();
});

// ── Theme Toggle ─────────────────────────────────────
const html = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

applyTheme(store.get('theme', 'light'));

// ── Focus Timer ──────────────────────────────────────
let timerInterval = null;
let timerSeconds  = 0;
let timerRunning  = false;

const timerDisplay  = document.getElementById('timerDisplay');
const startBtn      = document.getElementById('startBtn');
const stopBtn       = document.getElementById('stopBtn');
const resetBtn      = document.getElementById('resetBtn');
const timerMinutes  = document.getElementById('timerMinutes');

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setTimerFromInput() {
  const mins = Math.max(1, Math.min(99, parseInt(timerMinutes.value) || 25));
  timerMinutes.value = mins;
  timerSeconds = mins * 60;
  timerDisplay.textContent = formatTime(timerSeconds);
}

setTimerFromInput();

startBtn.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  timerMinutes.disabled = true;

  timerInterval = setInterval(() => {
    timerSeconds--;
    timerDisplay.textContent = formatTime(timerSeconds);
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      timerMinutes.disabled = false;
      timerDisplay.textContent = '00:00';
      // Simple audio beep via Web Audio API
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (_) {}
    }
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  timerMinutes.disabled = false;
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  timerMinutes.disabled = false;
  setTimerFromInput();
});

timerMinutes.addEventListener('change', () => {
  if (!timerRunning) setTimerFromInput();
});

// ── To-Do List ───────────────────────────────────────
let todos = store.get('todos', []);

function saveTodos() { store.set('todos', todos); }

function getSortedTodos() {
  const sort = document.getElementById('sortSelect').value;
  const copy = [...todos];
  if (sort === 'az')   return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')   return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = '';
  const sorted = getSortedTodos();

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = todo.done;
    cb.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => startEdit(todo.id, li, span));

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.title = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    list.appendChild(li);
  });

  const total = todos.length;
  const done  = todos.filter(t => t.done).length;
  document.getElementById('taskCount').textContent =
    total ? `${done}/${total} done` : 'No tasks yet';
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text  = input.value.trim();
  if (!text) return;

  // Challenge: prevent duplicates (case-insensitive)
  const duplicate = todos.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    input.style.borderColor = 'var(--danger)';
    input.title = 'Task already exists!';
    setTimeout(() => { input.style.borderColor = ''; input.title = ''; }, 1500);
    return;
  }

  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  input.value = '';
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEdit(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.text;
  li.replaceChild(editInput, span);
  editInput.focus();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (newText && newText !== todo.text) {
      // Prevent duplicate on edit
      const dup = todos.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
      if (dup) { editInput.style.borderColor = 'var(--danger)'; return; }
      todo.text = newText;
      saveTodos();
    }
    renderTodos();
  }

  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') renderTodos();
  });
}

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
document.getElementById('sortSelect').addEventListener('change', renderTodos);

renderTodos();

// ── Quick Links ──────────────────────────────────────
let links = store.get('quickLinks', []);

function saveLinks() { store.set('quickLinks', links); }

function renderLinks() {
  const container = document.getElementById('linksList');
  container.innerHTML = '';

  links.forEach((link) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const favicon = document.createElement('img');
    try {
      const url = new URL(link.url);
      favicon.src = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`;
    } catch (_) {}
    favicon.width = 16;
    favicon.height = 16;
    favicon.style.borderRadius = '3px';
    favicon.onerror = () => { favicon.style.display = 'none'; };

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-link';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    chip.append(favicon, a, removeBtn);
    container.appendChild(chip);
  });
}

function addLink() {
  const nameEl = document.getElementById('linkName');
  const urlEl  = document.getElementById('linkUrl');
  const name   = nameEl.value.trim();
  let   url    = urlEl.value.trim();

  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  nameEl.value = '';
  urlEl.value  = '';
}

document.getElementById('addLinkBtn').addEventListener('click', addLink);
document.getElementById('linkUrl').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

renderLinks();
