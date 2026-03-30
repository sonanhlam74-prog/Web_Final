// ================================================================
// tasks.js – Task Manager: CRUD, LocalStorage, Filter, Validation
// ================================================================

const TASKS_KEY = 'taskManager_tasks';
const THEME_KEY = 'taskManager_theme';

// ──────────────────────────────────────────────
// LocalStorage Service
// ──────────────────────────────────────────────
const TaskService = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch {
      showToast('Không thể lưu – bộ nhớ LocalStorage đầy!', 'error');
    }
  },

  add(data) {
    const tasks = this.getAll();
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      ...data
    };
    tasks.push(task);
    this.save(tasks);
    return task;
  },

  update(id, data) {
    const tasks = this.getAll().map(t => t.id === id ? { ...t, ...data } : t);
    this.save(tasks);
  },

  remove(id) {
    this.save(this.getAll().filter(t => t.id !== id));
  },

  clear() {
    localStorage.removeItem(TASKS_KEY);
  }
};

// ──────────────────────────────────────────────
// App State
// ──────────────────────────────────────────────
const state = {
  search: '',
  filterStatus: 'all',
  filterPriority: 'all',
  sortBy: 'default',
  editingId: null,
  deletingId: null
};

// ──────────────────────────────────────────────
// DOM helper
// ──────────────────────────────────────────────
const $id = id => document.getElementById(id);

// ──────────────────────────────────────────────
// Toast notification
// ──────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const toast = $id('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function isOverdue(deadline, status) {
  if (!deadline || status === 'Done' || status === 'Cancelled' || status === 'Delivering') return false;
  return deadline < getTodayStr();
}

function calculatePriority(deadline) {
  if (!deadline) return 'Low';
  
  const today = new Date(getTodayStr());
  const dueDate = new Date(deadline);
  
  // Calculate difference in days
  const timeDiff = dueDate - today;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) return 'High';      // 1 day or less
  if (daysDiff <= 3) return 'Medium';    // 1-3 days
  return 'Low';                           // More than 3 days
}

const PRIORITY_LABEL = { High: '🔴 Cao', Medium: '🟡 Trung bình', Low: '🟢 Thấp' };
const PRIORITY_CLASS  = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };

// ──────────────────────────────────────────────
// Filter + Sort
// ──────────────────────────────────────────────
function getFiltered() {
  let tasks = TaskService.getAll();

  if (state.search) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }

  if (state.filterStatus !== 'all') {
    tasks = tasks.filter(t => t.status === state.filterStatus);
  }

  if (state.filterPriority !== 'all') {
    tasks = tasks.filter(t => t.priority === state.filterPriority);
  }

  if (state.sortBy === 'deadline-asc') {
    tasks.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
  } else if (state.sortBy === 'deadline-desc') {
    tasks.sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
  } else if (state.sortBy === 'priority-high') {
    const order = { High: 0, Medium: 1, Low: 2 };
    tasks.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
  }

  return tasks;
}

// ──────────────────────────────────────────────
// Render tasks
// ──────────────────────────────────────────────
function renderTasks() {
  const list    = $id('taskList');
  const empty   = $id('emptyState');
  const tasks   = getFiltered();
  const allTasks = TaskService.getAll();

  if (!list) return;

  // Update stats chips
  const total   = allTasks.length;
  const done    = allTasks.filter(t => t.status === 'Done').length;
  const pending = allTasks.filter(t => t.status === 'Pending').length;
  const overdue = allTasks.filter(t => isOverdue(t.deadline, t.status)).length;

  const setChip = (id, val) => {
    const el = $id(id);
    if (el) el.querySelector('span').textContent = val;
  };
  setChip('statTotal',   total);
  setChip('statDone',    done);
  setChip('statPending', pending);
  setChip('statOverdue', overdue);

  // Empty state
  if (tasks.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = tasks.map(task => {
    const overdueCls = isOverdue(task.deadline, task.status) ? 'task-overdue' : '';
    const doneCls    = task.status === 'Done' ? 'task-done' : '';
    const calculatedPriority = calculatePriority(task.deadline);
    return `
    <div class="task-card ${doneCls} ${overdueCls}" data-id="${escapeHtml(task.id)}">
      <div class="task-card-header">
        <div class="task-title-row">
          <button class="toggle-btn ${task.status === 'Done' ? 'toggled' : ''}"
                  data-id="${escapeHtml(task.id)}"
                  title="${task.status === 'Done' ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}">
            <i class='bx ${task.status === 'Done' ? 'bxs-check-circle' : 'bx-circle'}'></i>
          </button>
          <h3 class="task-title ${task.status === 'Done' ? 'done-text' : ''}">${escapeHtml(task.title)}</h3>
        </div>
        <div class="task-tags">
          <span class="tag ${PRIORITY_CLASS[calculatedPriority] || ''}">${PRIORITY_LABEL[calculatedPriority] || calculatedPriority}</span>
          <span class="tag ${task.status === 'Done' ? 'status-done' : (task.status === 'Delivering' ? 'bg-primary text-white' : (task.status === 'Cancelled' ? 'bg-danger text-white' : 'status-pending'))}">
            ${task.status === 'Done' ? '✅ Hoàn thành' : (task.status === 'Delivering' ? '🚚 Đang giao' : (task.status === 'Cancelled' ? '❌ Đã hủy' : '⏳ Chờ xử lý'))}
          </span>
          ${isOverdue(task.deadline, task.status) ? '<span class="tag status-overdue">⚠️ Quá hạn</span>' : ''}
        </div>
      </div>
      <p class="task-desc ${task.status === 'Done' ? 'done-text' : ''}">${escapeHtml(task.description)}</p>
      <div class="task-card-footer">
        <span class="task-deadline"><i class='bx bx-calendar'></i> ${formatDate(task.deadline)}</span>
        <div class="task-actions">
          <button class="btn-icon btn-edit"   data-id="${escapeHtml(task.id)}" title="Sửa task"><i class='bx bx-edit'></i></button>
          <button class="btn-icon btn-delete" data-id="${escapeHtml(task.id)}" title="Xóa task"><i class='bx bx-trash'></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Attach events on newly rendered cards
  list.querySelectorAll('.toggle-btn').forEach(btn =>
    btn.addEventListener('click', () => toggleDone(btn.dataset.id))
  );
  list.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(btn.dataset.id))
  );
  list.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => openDeleteConfirm(btn.dataset.id))
  );
}

// ──────────────────────────────────────────────
// Toggle Done
// ──────────────────────────────────────────────
function toggleDone(id) {
  const tasks = TaskService.getAll();
  const task  = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'Done' ? 'Pending' : 'Done';
  TaskService.save(tasks);
  renderTasks();
  showToast(task.status === 'Done' ? '✅ Đã hoàn thành!' : '↩️ Đã đánh dấu chưa xong');
}

// ──────────────────────────────────────────────
// Modal helpers
// ──────────────────────────────────────────────
function showModal(id) {
  $id(id)?.classList.add('active');
  $id('modalOverlay')?.classList.add('active');
}

function hideModal(id) {
  $id(id)?.classList.remove('active');
  if (!document.querySelector('.modal.active')) {
    $id('modalOverlay')?.classList.remove('active');
  }
}

function hideAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  $id('modalOverlay')?.classList.remove('active');
}

// ──────────────────────────────────────────────
// Add / Edit modal
// ──────────────────────────────────────────────
function openAddModal() {
  state.editingId = null;
  const titleEl = $id('modalTitle');
  if (titleEl) titleEl.textContent = 'Thêm công việc mới';
  $id('taskForm')?.reset();
  clearErrors();
  const dl = $id('taskDeadline');
  if (dl) dl.min = getTodayStr();
  updateCharCount();
  showModal('taskModal');
  setTimeout(() => $id('taskTitle')?.focus(), 100);
}

function openEditModal(id) {
  const task = TaskService.getAll().find(t => t.id === id);
  if (!task) return;
  state.editingId = id;
  const titleEl = $id('modalTitle');
  if (titleEl) titleEl.textContent = 'Sửa công việc';
  $id('taskTitle').value    = task.title;
  $id('taskDesc').value     = task.description;
  $id('taskDeadline').value = task.deadline;
  $id('taskPriority').value = task.priority;
  const dl = $id('taskDeadline');
  if (dl) dl.min = getTodayStr();
  clearErrors();
  updateCharCount();
  showModal('taskModal');
  setTimeout(() => $id('taskTitle')?.focus(), 100);
}

function openDeleteConfirm(id) {
  state.deletingId = id;
  showModal('confirmModal');
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────
function clearErrors() {
  ['titleError', 'descError', 'deadlineError'].forEach(id => {
    const el = $id(id);
    if (el) el.textContent = '';
  });
  ['taskTitle', 'taskDesc', 'taskDeadline'].forEach(id => {
    $id(id)?.classList.remove('input-error');
  });
}

function setError(inputId, errorId, msg) {
  $id(inputId)?.classList.add('input-error');
  const err = $id(errorId);
  if (err) err.textContent = msg;
}

function validate() {
  let valid = true;
  clearErrors();

  const title    = ($id('taskTitle')?.value || '').trim();
  const desc     = ($id('taskDesc')?.value || '').trim();
  const deadline = $id('taskDeadline')?.value || '';

  if (!title) {
    setError('taskTitle', 'titleError', 'Tiêu đề không được để trống');
    valid = false;
  }

  if (desc.length < 10) {
    setError('taskDesc', 'descError', `Mô tả cần ít nhất 10 ký tự (còn thiếu ${10 - desc.length})`);
    valid = false;
  }

  if (!deadline) {
    setError('taskDeadline', 'deadlineError', 'Vui lòng chọn hạn hoàn thành');
    valid = false;
  } else if (deadline < getTodayStr()) {
    setError('taskDeadline', 'deadlineError', 'Deadline không được nhỏ hơn ngày hôm nay');
    valid = false;
  }

  return valid;
}

// Real-time validation
function setupRealtimeValidation() {
  $id('taskTitle')?.addEventListener('input', () => {
    if (($id('taskTitle').value || '').trim()) {
      $id('taskTitle').classList.remove('input-error');
      $id('titleError').textContent = '';
    }
  });

  $id('taskDesc')?.addEventListener('input', () => {
    updateCharCount();
    const len = ($id('taskDesc').value || '').trim().length;
    if (len >= 10) {
      $id('taskDesc').classList.remove('input-error');
      $id('descError').textContent = '';
    } else {
      $id('descError').textContent = `Còn thiếu ${10 - len} ký tự`;
    }
  });

  $id('taskDeadline')?.addEventListener('change', () => {
    const val = $id('taskDeadline').value;
    if (val >= getTodayStr()) {
      $id('taskDeadline').classList.remove('input-error');
      $id('deadlineError').textContent = '';
    }
  });
}

function updateCharCount() {
  const len    = ($id('taskDesc')?.value || '').length;
  const countEl = $id('descCount');
  if (countEl) countEl.textContent = `${len}/500`;
}

// ──────────────────────────────────────────────
// Form submit (Add / Edit)
// ──────────────────────────────────────────────
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const data = {
    title:       ($id('taskTitle').value || '').trim(),
    description: ($id('taskDesc').value || '').trim(),
    deadline:    $id('taskDeadline').value,
    priority:    $id('taskPriority').value
  };

  if (state.editingId) {
    TaskService.update(state.editingId, data);
    showToast('✏️ Đã cập nhật công việc!');
  } else {
    TaskService.add(data);
    showToast('✅ Đã thêm công việc mới!');
  }

  hideAllModals();
  renderTasks();
}

// ──────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────
function confirmDelete() {
  if (!state.deletingId) return;
  TaskService.remove(state.deletingId);
  state.deletingId = null;
  hideAllModals();
  renderTasks();
  showToast('🗑️ Đã xóa công việc!', 'warning');
}

// ──────────────────────────────────────────────
// Export / Import JSON
// ──────────────────────────────────────────────
function exportJSON() {
  const tasks = TaskService.getAll();
  if (tasks.length === 0) {
    showToast('Không có task nào để xuất!', 'warning');
    return;
  }
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `tasks_${getTodayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Đã xuất file JSON!');
}

function importJSON(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.name.endsWith('.json')) {
    showToast('Vui lòng chọn file .json!', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('Not an array');
      TaskService.save(data);
      renderTasks();
      showToast(`📤 Đã nhập ${data.length} công việc!`);
    } catch {
      showToast('File JSON không hợp lệ!', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ──────────────────────────────────────────────
// Dark Mode
// ──────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  showToast(isDark ? '🌙 Đã bật Dark Mode' : '☀️ Đã bật Light Mode');
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard
  if (window.Auth) {
    window.Auth.requireLogin?.({ redirectTo: '../login&register/Login/login.html' });
  }

  initTheme();
  setupRealtimeValidation();
  renderTasks();

  // ── Toolbar buttons ──
  $id('addTaskBtn')?.addEventListener('click', openAddModal);
  $id('emptyAddBtn')?.addEventListener('click', openAddModal);
  $id('exportBtn')?.addEventListener('click', exportJSON);
  $id('importFileInput')?.addEventListener('change', importJSON);
  $id('clearAllBtn')?.addEventListener('click', () => showModal('clearAllModal'));

  // ── Task form ──
  $id('taskForm')?.addEventListener('submit', handleFormSubmit);

  // ── Task modal close ──
  $id('modalClose')?.addEventListener('click',  () => hideModal('taskModal'));
  $id('cancelBtn')?.addEventListener('click',   () => hideModal('taskModal'));
  $id('modalOverlay')?.addEventListener('click', hideAllModals);

  // ── Delete confirm ──
  $id('cancelDeleteBtn')?.addEventListener('click',  () => hideModal('confirmModal'));
  $id('confirmDeleteBtn')?.addEventListener('click', confirmDelete);

  // ── Clear all confirm ──
  $id('cancelClearBtn')?.addEventListener('click',  () => hideModal('clearAllModal'));
  $id('confirmClearBtn')?.addEventListener('click', () => {
    TaskService.clear();
    hideAllModals();
    renderTasks();
    showToast('🗑️ Đã xóa tất cả công việc!', 'warning');
  });

  // ── Search & Filters ──
  $id('searchInput')?.addEventListener('input', e => {
    state.search = e.target.value;
    renderTasks();
  });
  $id('filterStatus')?.addEventListener('change', e => {
    state.filterStatus = e.target.value;
    renderTasks();
  });
  $id('filterPriority')?.addEventListener('change', e => {
    state.filterPriority = e.target.value;
    renderTasks();
  });
  $id('sortBy')?.addEventListener('change', e => {
    state.sortBy = e.target.value;
    renderTasks();
  });

  // ── Keyboard: Escape closes modals ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideAllModals();
  });
});
