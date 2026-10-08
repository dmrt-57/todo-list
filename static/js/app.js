/**
 * Modern Todo List (TaskFlow Pro) - Frontend Application Logic
 */

// Application State
const state = {
    lists: [],
    tasks: [],
    currentListId: 'all', // 'all' or numeric list ID
    filter: 'all',        // 'all', 'pending', 'completed'
    priority: 'all',      // 'all', 'high', 'medium', 'low'
    searchQuery: '',
    deleteAction: null,   // Holds callback function for confirmation modal
    theme: localStorage.getItem('taskflow_theme') || 'dark'
};

// DOM Elements
const elements = {
    // Nav & Lists
    sidebar: document.getElementById('sidebar'),
    dynamicListsContainer: document.getElementById('dynamicListsContainer'),
    navItemAll: document.getElementById('navItemAll'),
    badgeAllCount: document.getElementById('badgeAllCount'),
    btnOpenNewListModal: document.getElementById('btnOpenNewListModal'),
    mobileMenuOpen: document.getElementById('mobileMenuOpen'),
    mobileSidebarClose: document.getElementById('mobileSidebarClose'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

    // Stats
    statMiniRate: document.getElementById('statMiniRate'),
    sidebarProgressBar: document.getElementById('sidebarProgressBar'),
    statCompletedBadge: document.getElementById('statCompletedBadge'),
    statPendingBadge: document.getElementById('statPendingBadge'),

    // Search
    searchInput: document.getElementById('searchInput'),
    searchSubmitBtn: document.getElementById('searchSubmitBtn'),
    searchClearBtn: document.getElementById('searchClearBtn'),

    // View Header
    currentViewIcon: document.getElementById('currentViewIcon'),
    currentViewTitle: document.getElementById('currentViewTitle'),
    currentViewSubtitle: document.getElementById('currentViewSubtitle'),
    currentListActions: document.getElementById('currentListActions'),
    btnDeleteCurrentList: document.getElementById('btnDeleteCurrentList'),

    // Task Create Form
    taskCreateForm: document.getElementById('taskCreateForm'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskListSelect: document.getElementById('taskListSelect'),
    taskPrioritySelect: document.getElementById('taskPrioritySelect'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskNotesInput: document.getElementById('taskNotesInput'),

    // Filters
    filterTabs: document.querySelectorAll('.filter-tab'),
    priorityFilterSelect: document.getElementById('priorityFilterSelect'),
    filterCountAll: document.getElementById('filterCountAll'),
    filterCountPending: document.getElementById('filterCountPending'),
    filterCountCompleted: document.getElementById('filterCountCompleted'),

    // Task Lists
    pendingSectionCount: document.getElementById('pendingSectionCount'),
    pendingTasksList: document.getElementById('pendingTasksList'),
    completedSection: document.getElementById('completedSection'),
    completedSectionToggle: document.getElementById('completedSectionToggle'),
    completedSectionCount: document.getElementById('completedSectionCount'),
    completedTasksList: document.getElementById('completedTasksList'),
    emptyStateContainer: document.getElementById('emptyStateContainer'),

    // Modals
    modalCreateList: document.getElementById('modalCreateList'),
    createListForm: document.getElementById('createListForm'),
    newListNameInput: document.getElementById('newListNameInput'),
    newListIconInput: document.getElementById('newListIconInput'),
    newListColorInput: document.getElementById('newListColorInput'),
    emojiPicker: document.getElementById('emojiPicker'),
    colorPicker: document.getElementById('colorPicker'),

    modalConfirmDelete: document.getElementById('modalConfirmDelete'),
    confirmModalTitle: document.getElementById('confirmModalTitle'),
    confirmModalDesc: document.getElementById('confirmModalDesc'),
    btnConfirmDelete: document.getElementById('btnConfirmDelete'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),

    modalEditTask: document.getElementById('modalEditTask'),
    editTaskForm: document.getElementById('editTaskForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskTitle: document.getElementById('editTaskTitle'),
    editTaskNotes: document.getElementById('editTaskNotes'),
    editTaskPriority: document.getElementById('editTaskPriority'),
    editTaskDueDate: document.getElementById('editTaskDueDate'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// =============================================================================
// API HELPERS
// =============================================================================

async function api(endpoint, options = {}) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        const res = await fetch(endpoint, config);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || `Sunucu hatası (${res.status})`);
        }
        return data;
    } catch (err) {
        if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
            showToast('Sunucu bağlantısı kurulamadı! Terminalde "python3 app.py" çalıştığından emin olun.', 'danger');
        } else {
            showToast(err.message, 'danger');
        }
        throw err;
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function init() {
    initTheme();
    setupEventListeners();
    await loadInitialData();
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('taskflow_theme', state.theme);
}

async function loadInitialData() {
    await fetchLists();
    await fetchTasks();
    await fetchStats();
}

// =============================================================================
// DATA FETCHING & RENDERING
// =============================================================================

async function fetchLists() {
    const lists = await api('/api/lists');
    state.lists = lists;
    renderLists();
    populateListSelect();
}

async function fetchStats() {
    const stats = await api('/api/stats');
    elements.statMiniRate.textContent = `${stats.completion_rate}%`;
    elements.sidebarProgressBar.style.width = `${stats.completion_rate}%`;
    elements.statCompletedBadge.textContent = `${stats.completed_tasks} Tamamlandı`;
    elements.statPendingBadge.textContent = `${stats.pending_tasks} Bekleyen`;
}

async function fetchTasks() {
    const params = new URLSearchParams();
    if (state.currentListId !== 'all') {
        params.append('list_id', state.currentListId);
    }
    if (state.searchQuery) {
        params.append('search', state.searchQuery);
    }
    if (state.filter !== 'all') {
        params.append('status', state.filter);
    }
    if (state.priority !== 'all') {
        params.append('priority', state.priority);
    }

    const tasks = await api(`/api/tasks?${params.toString()}`);
    state.tasks = tasks;
    renderTasks();
}

// Render dynamic lists in sidebar
function renderLists() {
    elements.dynamicListsContainer.innerHTML = '';
    let totalAllCount = 0;

    state.lists.forEach(lst => {
        totalAllCount += lst.total_tasks;
        const btn = document.createElement('button');
        btn.className = `nav-item ${state.currentListId == lst.id ? 'active' : ''}`;
        btn.dataset.listId = lst.id;
        btn.innerHTML = `
            <span class="nav-icon">${lst.icon || '📁'}</span>
            <span class="nav-name">${escapeHtml(lst.name)}</span>
            <span class="nav-badge">${lst.pending_tasks}</span>
        `;
        btn.addEventListener('click', () => switchList(lst.id));
        elements.dynamicListsContainer.appendChild(btn);
    });

    elements.badgeAllCount.textContent = totalAllCount;
    elements.navItemAll.classList.toggle('active', state.currentListId === 'all');
}

// Populate list dropdown in new task creation
function populateListSelect() {
    elements.taskListSelect.innerHTML = '';
    state.lists.forEach(lst => {
        const option = document.createElement('option');
        option.value = lst.id;
        option.textContent = `${lst.icon} ${lst.name}`;
        if (state.currentListId != 'all' && state.currentListId == lst.id) {
            option.selected = true;
        }
        elements.taskListSelect.appendChild(option);
    });
}

// Switch active view/list
function switchList(listId) {
    state.currentListId = listId;

    // Close mobile menu if open
    elements.sidebar.classList.remove('open');

    // Update active highlight in sidebar
    document.querySelectorAll('.lists-nav .nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.listId == listId);
    });

    // Update View Header Banner
    if (listId === 'all') {
        elements.currentViewIcon.textContent = '📋';
        elements.currentViewTitle.textContent = 'Tüm Görevler';
        elements.currentViewSubtitle.textContent = 'Tüm listelerdeki aktif ve tamamlanmış görevleriniz';
        elements.currentListActions.style.display = 'none';
    } else {
        const current = state.lists.find(l => l.id == listId);
        if (current) {
            elements.currentViewIcon.textContent = current.icon || '📁';
            elements.currentViewTitle.textContent = current.name;
            elements.currentViewSubtitle.textContent = `${current.total_tasks} görev (${current.pending_tasks} bekliyor, ${current.completed_tasks} tamamlandı)`;
            elements.currentListActions.style.display = 'block';

            // Auto-select this list in create task form
            elements.taskListSelect.value = current.id;
        }
    }

    fetchTasks();
}

// Render tasks on screen
function renderTasks() {
    const pendingTasks = state.tasks.filter(t => !t.completed);
    const completedTasks = state.tasks.filter(t => t.completed);

    // Update filter counts
    elements.filterCountAll.textContent = state.tasks.length;
    elements.filterCountPending.textContent = pendingTasks.length;
    elements.filterCountCompleted.textContent = completedTasks.length;

    elements.pendingSectionCount.textContent = `${pendingTasks.length} görev`;
    elements.completedSectionCount.textContent = `${completedTasks.length} görev`;

    // Render Pending
    elements.pendingTasksList.innerHTML = '';
    if (pendingTasks.length > 0) {
        pendingTasks.forEach(task => {
            elements.pendingTasksList.appendChild(createTaskElement(task));
        });
    }

    // Render Completed
    elements.completedTasksList.innerHTML = '';
    if (completedTasks.length > 0) {
        completedTasks.forEach(task => {
            elements.completedTasksList.appendChild(createTaskElement(task));
        });
        elements.completedSection.style.display = 'block';
    } else {
        elements.completedSection.style.display = state.filter === 'pending' ? 'none' : 'block';
    }

    // Empty state handling
    if (state.tasks.length === 0) {
        elements.emptyStateContainer.style.display = 'block';
        if (state.searchQuery) {
            elements.emptyStateContainer.querySelector('.empty-title').textContent = `"${state.searchQuery}" için sonuç bulunamadı`;
            elements.emptyStateContainer.querySelector('.empty-desc').textContent = 'Farklı bir kelime aramayı deneyin veya aramayı temizleyin.';
        } else {
            elements.emptyStateContainer.querySelector('.empty-title').textContent = 'Bu listede henüz görev yok';
            elements.emptyStateContainer.querySelector('.empty-desc').textContent = 'Yukarıdaki alanı kullanarak yeni bir görev ekleyin!';
        }
    } else {
        elements.emptyStateContainer.style.display = 'none';
    }
}

// Create a single Task Card DOM element
function createTaskElement(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.dataset.taskId = task.id;

    const priorityLabels = {
        high: '🔴 Yüksek',
        medium: '🟡 Orta',
        low: '🟢 Düşük'
    };

    let metaHtml = `
        <span class="meta-chip priority-${task.priority}">
            ${priorityLabels[task.priority] || '🟡 Orta'}
        </span>
    `;

    if (state.currentListId === 'all' && task.list_name) {
        metaHtml += `
            <span class="meta-chip meta-list-tag">
                ${task.list_icon || '📁'} ${escapeHtml(task.list_name)}
            </span>
        `;
    }

    if (task.due_date) {
        metaHtml += `
            <span class="meta-chip meta-due-date">
                📅 ${task.due_date}
            </span>
        `;
    }

    item.innerHTML = `
        <div class="task-checkbox-wrap" title="${task.completed ? 'Tamamlanmadı yap' : 'Tamamlandı işaretle'}">
            <div class="custom-checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        </div>
        <div class="task-content">
            <div class="task-title">${highlightText(escapeHtml(task.title), state.searchQuery)}</div>
            ${task.notes ? `<div class="task-notes">${highlightText(escapeHtml(task.notes), state.searchQuery)}</div>` : ''}
            <div class="task-meta">${metaHtml}</div>
        </div>
        <div class="task-actions">
            <button class="btn-icon edit" title="Düzenle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
            </button>
            <button class="btn-icon delete" title="Sil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    // Toggle completion listener
    item.querySelector('.task-checkbox-wrap').addEventListener('click', () => toggleTask(task.id));

    // Edit listener
    item.querySelector('.btn-icon.edit').addEventListener('click', () => openEditModal(task));

    // Delete listener (with prompt confirmation)
    item.querySelector('.btn-icon.delete').addEventListener('click', () => promptDeleteTask(task));

    return item;
}

// =============================================================================
// TASK ACTIONS
// =============================================================================

async function handleCreateTask(e) {
    e.preventDefault();
    const title = elements.taskTitleInput.value.trim();
    if (!title) return;

    let targetListId = elements.taskListSelect.value;
    if (!targetListId || isNaN(parseInt(targetListId))) {
        if (state.currentListId !== 'all') {
            targetListId = state.currentListId;
        } else if (state.lists.length > 0) {
            targetListId = state.lists[0].id;
        }
    }

    if (!targetListId) {
        showToast('Lütfen önce bir liste oluşturun veya seçin!', 'danger');
        return;
    }

    const payload = {
        list_id: parseInt(targetListId),
        title: title,
        notes: elements.taskNotesInput.value.trim(),
        priority: elements.taskPrioritySelect.value,
        due_date: elements.taskDueDateInput.value || null
    };

    const submitBtn = elements.taskCreateForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    try {
        await api('/api/tasks', { method: 'POST', body: payload });
        showToast('Görev başarıyla eklendi 🎉', 'success');
        elements.taskTitleInput.value = '';
        elements.taskNotesInput.value = '';
        elements.taskDueDateInput.value = '';

        await fetchLists();
        await fetchTasks();
        await fetchStats();
    } catch (err) {
        console.error('Görev ekleme hatası:', err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
}

async function toggleTask(taskId) {
    try {
        const updated = await api(`/api/tasks/${taskId}/toggle`, { method: 'POST' });
        showToast(updated.completed ? 'Görev tamamlandı! 🎉' : 'Görev tekrar aktife alındı', 'info');
        await fetchLists();
        await fetchTasks();
        await fetchStats();
    } catch (err) {
        console.error(err);
    }
}

// Confirmation Prompt for Task Deletion
function promptDeleteTask(task) {
    elements.confirmModalTitle.textContent = `"${task.title}" görevini silmek istiyor musunuz?`;
    elements.confirmModalDesc.textContent = 'Bu işlem geri alınamaz ve bu görev veritabanından kalıcı olarak silinecektir.';

    state.deleteAction = async () => {
        try {
            await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
            showToast('Görev başarıyla silindi', 'success');
            closeModal('modalConfirmDelete');
            await fetchLists();
            await fetchTasks();
            await fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    openModal('modalConfirmDelete');
}

// Confirmation Prompt for List Deletion
function promptDeleteCurrentList() {
    if (state.currentListId === 'all') return;
    const currentList = state.lists.find(l => l.id == state.currentListId);
    if (!currentList) return;

    elements.confirmModalTitle.textContent = `"${currentList.name}" listesini silmek istiyor musunuz?`;
    elements.confirmModalDesc.textContent = `Bu listeyi ve içindeki ${currentList.total_tasks} görevi kalıcı olarak silmek üzeresiniz. Onaylıyor musunuz?`;

    state.deleteAction = async () => {
        try {
            await api(`/api/lists/${currentList.id}`, { method: 'DELETE' });
            showToast('Liste ve görevleri silindi', 'success');
            closeModal('modalConfirmDelete');
            state.currentListId = 'all';
            await fetchLists();
            switchList('all');
            await fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    openModal('modalConfirmDelete');
}

// Open Edit Task Modal
function openEditModal(task) {
    elements.editTaskId.value = task.id;
    elements.editTaskTitle.value = task.title;
    elements.editTaskNotes.value = task.notes || '';
    elements.editTaskPriority.value = task.priority || 'medium';
    elements.editTaskDueDate.value = task.due_date || '';
    openModal('modalEditTask');
}

async function handleEditTaskSubmit(e) {
    e.preventDefault();
    const taskId = elements.editTaskId.value;
    const payload = {
        title: elements.editTaskTitle.value.trim(),
        notes: elements.editTaskNotes.value.trim(),
        priority: elements.editTaskPriority.value,
        due_date: elements.editTaskDueDate.value || null
    };

    try {
        await api(`/api/tasks/${taskId}`, { method: 'PUT', body: payload });
        showToast('Görev başarıyla güncellendi', 'success');
        closeModal('modalEditTask');
        await fetchTasks();
        await fetchStats();
    } catch (err) {
        console.error(err);
    }
}

// =============================================================================
// LIST CREATION
// =============================================================================

async function handleCreateListSubmit(e) {
    e.preventDefault();
    const name = elements.newListNameInput.value.trim();
    const icon = elements.newListIconInput.value.trim() || '📋';
    const color = elements.newListColorInput.value.trim() || '#6366f1';

    if (!name) return;

    try {
        const newList = await api('/api/lists', {
            method: 'POST',
            body: { name, icon, color }
        });
        showToast(`"${newList.name}" listesi oluşturuldu`, 'success');
        elements.newListNameInput.value = '';
        closeModal('modalCreateList');

        await fetchLists();
        switchList(newList.id);
    } catch (err) {
        console.error(err);
    }
}

// =============================================================================
// SEARCH & FILTER HANDLING
// =============================================================================

function executeSearch() {
    state.searchQuery = elements.searchInput.value.trim();
    elements.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
    fetchTasks();
}

function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClearBtn.style.display = 'none';
    fetchTasks();
}

// =============================================================================
// MODAL & UTILITY FUNCTIONS
// =============================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightText(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(245, 158, 11, 0.35); color: inherit; padding: 0 2px; border-radius: 3px;">$1</mark>');
}

// =============================================================================
// EVENT LISTENERS SETUP
// =============================================================================

function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Mobile Sidebar Drawer
    elements.mobileMenuOpen.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
    });
    elements.mobileSidebarClose.addEventListener('click', () => {
        elements.sidebar.classList.remove('open');
    });

    // "Tüm Görevler" Nav Click
    elements.navItemAll.addEventListener('click', () => switchList('all'));

    // Search Box
    elements.searchSubmitBtn.addEventListener('click', executeSearch);
    elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeSearch();
        }
    });
    // Live search as user types
    elements.searchInput.addEventListener('input', () => {
        elements.searchClearBtn.style.display = elements.searchInput.value ? 'block' : 'none';
        state.searchQuery = elements.searchInput.value.trim();
        fetchTasks();
    });
    elements.searchClearBtn.addEventListener('click', clearSearch);

    // Filter Tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filter = tab.dataset.filter;
            fetchTasks();
        });
    });

    // Priority Filter
    elements.priorityFilterSelect.addEventListener('change', () => {
        state.priority = elements.priorityFilterSelect.value;
        fetchTasks();
    });

    // Collapsible Completed Section
    elements.completedSectionToggle.addEventListener('click', () => {
        elements.completedSectionToggle.classList.toggle('collapsed');
        elements.completedTasksList.style.display = elements.completedSectionToggle.classList.contains('collapsed') ? 'none' : 'flex';
    });

    // Form Submissions
    elements.taskCreateForm.addEventListener('submit', handleCreateTask);
    elements.createListForm.addEventListener('submit', handleCreateListSubmit);
    elements.editTaskForm.addEventListener('submit', handleEditTaskSubmit);

    // Delete List Action
    elements.btnDeleteCurrentList.addEventListener('click', promptDeleteCurrentList);

    // Delete Confirmation Modal Actions
    elements.btnConfirmDelete.addEventListener('click', () => {
        if (typeof state.deleteAction === 'function') {
            state.deleteAction();
        }
    });
    elements.btnCancelDelete.addEventListener('click', () => closeModal('modalConfirmDelete'));

    // Modal Triggers
    elements.btnOpenNewListModal.addEventListener('click', () => openModal('modalCreateList'));

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    // Close Modals on Overlay Click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Emoji Picker Select
    elements.emojiPicker.querySelectorAll('.emoji-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.emojiPicker.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            elements.newListIconInput.value = btn.dataset.emoji;
        });
    });

    // Color Picker Select
    elements.colorPicker.querySelectorAll('.color-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.colorPicker.querySelectorAll('.color-opt').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            elements.newListColorInput.value = btn.dataset.color;
        });
    });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
