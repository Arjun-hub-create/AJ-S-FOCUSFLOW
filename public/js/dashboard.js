// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loading...');
    if (!localStorage.getItem('token')) { window.location.href = '/'; return; }
    loadUserInfo();
    await loadDashboardData();
    setupEventListeners();
    setupRealtimeListeners();
    initializeTimer();
    initializeMobileMenu();
    initializeModals();
    initializeSearch();
    initializeNotifications();
    initializeStreak();
    initializeLabelSelector();
    initializePomodoro();
    console.log('Dashboard loaded successfully');
});

// ===== TOAST =====
function showMessage(message, type = 'info') {
    const ex = document.querySelector('.toast-message'); if (ex) ex.remove();
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'rgba(0,255,136,0.9)':type==='error'?'rgba(255,87,87,0.9)':'rgba(0,212,255,0.9)'};color:#000;padding:15px 25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10000;font-weight:500;animation:slideInRight 0.3s ease-out;`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar;
    }
}

// ===== DASHBOARD DATA =====
let allTasks = [];
let allProjects = [];

async function loadDashboardData() {
    try {
        const analyticsData = await api.getAnalyticsOverview();
        if (analyticsData.success) updateStatsCards(analyticsData.analytics);

        const projectsData = await api.getProjects();
        if (projectsData.success) {
            allProjects = projectsData.projects;
            displayProjects(projectsData.projects.slice(0, 4));
            populateProjectSelect(projectsData.projects);
        }

        const tasksData = await api.getTasks();
        if (tasksData.success) {
            allTasks = tasksData.tasks;
            displayTasks(tasksData.tasks.slice(0, 10));
            updateDailyProgress(tasksData.tasks);
        }
    } catch (error) { console.error('Error loading dashboard:', error); }
}

function updateStatsCards(analytics) {
    document.getElementById('totalTasks').textContent = analytics.tasks.total;
    document.getElementById('completedTasks').textContent = analytics.tasks.completed;
    document.getElementById('inProgressTasks').textContent = analytics.tasks.inProgress;
    document.getElementById('totalHours').textContent = analytics.time.totalHours + 'h';
}

function displayProjects(projects) {
    const container = document.getElementById('projectsList');
    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><h4>No Projects Yet</h4><p>Create your first project to get started</p></div>';
        return;
    }
    container.innerHTML = projects.map(project => {
        const statusBadge = project.status === 'completed' ? '<span class="project-completed-badge"><i class="fas fa-check-circle"></i> Completed</span>' : '';
        return `<div class="project-card ${project.status === 'completed' ? 'completed-project' : ''}" style="--project-color: ${project.color}" onclick="window.location.href='/projects'">
            <h4>${project.name} ${statusBadge}</h4><p>${project.description || 'No description'}</p>
            <div class="project-meta"><span><i class="fas fa-users"></i> ${project.members.length} members</span><span><i class="fas fa-calendar"></i> ${new Date(project.createdAt).toLocaleDateString()}</span></div></div>`;
    }).join('');
}

function displayTasks(tasks) {
    const container = document.getElementById('tasksList');
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><h4>No Tasks Yet</h4><p>Create your first task to get started</p></div>';
        return;
    }
    container.innerHTML = tasks.map(task => {
        const labels = (task.labels || []).map(l => `<span class="label-chip-small" style="--chip-color:${l.color||'#00d4ff'}">${l.name}</span>`).join('');
        return `<div class="task-item">
            <div class="task-left">
                <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" onclick="toggleTaskStatus('${task._id}', '${task.status}')"></div>
                <div class="task-info"><h5>${task.title}</h5><p>${task.project?.name || 'No project'} • ${task.assignees.length} assignees ${labels}</p></div>
            </div>
            <div class="task-right">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                ${task.dueDate ? `<span style="color:rgba(0,212,255,0.6);font-size:12px;"><i class="fas fa-clock"></i> ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                <button class="task-delete-btn" onclick="deleteTask('${task._id}')" title="Delete task"><i class="fas fa-trash"></i></button>
            </div></div>`;
    }).join('');
}

function populateProjectSelect(projects) {
    const select = document.getElementById('taskProject');
    if (select) select.innerHTML = '<option value="">Select Project</option>' + projects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
}

async function toggleTaskStatus(taskId, currentStatus) {
    try {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        await api.updateTask(taskId, { status: newStatus });
        await loadDashboardData();
    } catch (error) { console.error('Error updating task:', error); }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const result = await api.deleteTask(taskId);
        if (result.success) { showMessage('Task deleted successfully', 'success'); await loadDashboardData(); }
    } catch (error) { showMessage('Failed to delete task', 'error'); }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async (e) => { e.preventDefault(); await api.logout(); });

    const projectModal = document.getElementById('projectModal');
    const newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn && projectModal) newProjectBtn.addEventListener('click', (e) => { e.preventDefault(); projectModal.classList.add('active'); });

    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const projectData = { name: document.getElementById('projectName').value, description: document.getElementById('projectDescription').value, color: document.getElementById('projectColor').value };
            try {
                const data = await api.createProject(projectData);
                if (data.success) { projectModal.classList.remove('active'); e.target.reset(); await loadDashboardData(); showMessage('Project created successfully!', 'success'); }
                else showMessage(data.message || 'Failed to create project', 'error');
            } catch (error) { showMessage('Failed to create project', 'error'); }
        });
    }

    const taskModal = document.getElementById('taskModal');
    const newTaskBtn = document.getElementById('newTaskBtn');
    if (newTaskBtn && taskModal) newTaskBtn.addEventListener('click', (e) => { e.preventDefault(); taskModal.classList.add('active'); });

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedLabels = Array.from(document.querySelectorAll('.label-chip.selectable.selected')).map(el => ({ name: el.dataset.label, color: el.dataset.color }));
            const taskData = {
                title: document.getElementById('taskTitle').value, description: document.getElementById('taskDescription').value,
                project: document.getElementById('taskProject').value, priority: document.getElementById('taskPriority').value,
                dueDate: document.getElementById('taskDueDate').value || undefined, labels: selectedLabels
            };
            try {
                const data = await api.createTask(taskData);
                if (data.success) { taskModal.classList.remove('active'); e.target.reset(); document.querySelectorAll('.label-chip.selectable').forEach(c => c.classList.remove('selected')); await loadDashboardData(); showMessage('Task created successfully!', 'success'); }
                else showMessage(data.message || 'Failed to create task', 'error');
            } catch (error) { showMessage('Failed to create task', 'error'); }
        });
    }
}

function setupRealtimeListeners() {
    ['task-update', 'task-create', 'task-delete', 'timer-stopped'].forEach(evt => {
        window.addEventListener(evt, () => loadDashboardData());
    });
}

function initializeTimer() {
    if (typeof Timer !== 'undefined') {
        const timer = new Timer(); timer.checkActiveTimer();
        const timerToggle = document.getElementById('timerToggle');
        if (timerToggle) timerToggle.addEventListener('click', () => timer.toggle());
    }
}

function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    if (!mobileMenuToggle || !sidebar || !overlay) return;
    if (window.innerWidth <= 1024) mobileMenuToggle.style.display = 'flex';
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) mobileMenuToggle.style.display = 'flex';
        else { mobileMenuToggle.style.display = 'none'; sidebar.classList.remove('active'); overlay.classList.remove('active'); }
    });
    mobileMenuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
}

function initializeModals() {
    document.querySelectorAll('.modal-close').forEach(btn => { btn.addEventListener('click', () => btn.closest('.modal').classList.remove('active')); });
    document.querySelectorAll('.modal').forEach(modal => { modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); }); });
}

// ===== GLOBAL SEARCH =====
function initializeSearch() {
    const input = document.getElementById('globalSearchInput');
    const resultsDiv = document.getElementById('searchResults');
    if (!input || !resultsDiv) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) { resultsDiv.style.display = 'none'; return; }
        const matchedTasks = allTasks.filter(t => t.title.toLowerCase().includes(query) || (t.description||'').toLowerCase().includes(query)).slice(0, 5);
        const matchedProjects = allProjects.filter(p => p.name.toLowerCase().includes(query) || (p.description||'').toLowerCase().includes(query)).slice(0, 3);

        if (matchedTasks.length === 0 && matchedProjects.length === 0) {
            resultsDiv.innerHTML = '<div class="search-empty">No results found</div>';
        } else {
            let html = '';
            if (matchedProjects.length) {
                html += '<div class="search-group-label">Projects</div>';
                html += matchedProjects.map(p => `<div class="search-result-item" onclick="window.location.href='/projects'"><i class="fas fa-folder"></i><span>${p.name}</span></div>`).join('');
            }
            if (matchedTasks.length) {
                html += '<div class="search-group-label">Tasks</div>';
                html += matchedTasks.map(t => `<div class="search-result-item" onclick="window.location.href='/projects'"><i class="fas fa-check-circle"></i><span>${t.title}</span><small class="task-priority priority-${t.priority}">${t.priority}</small></div>`).join('');
            }
            resultsDiv.innerHTML = html;
        }
        resultsDiv.style.display = 'block';
    });

    input.addEventListener('blur', () => setTimeout(() => resultsDiv.style.display = 'none', 200));
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) resultsDiv.style.display = 'block'; });
}

// ===== NOTIFICATIONS =====
async function initializeNotifications() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notificationBadge');
    const markAllBtn = document.getElementById('markAllRead');
    if (!bell) return;

    bell.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('active'); if (dropdown.classList.contains('active')) loadNotifications(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('#notificationWrapper')) dropdown.classList.remove('active'); });
    if (markAllBtn) markAllBtn.addEventListener('click', async () => { await api.markAllNotificationsRead(); badge.style.display = 'none'; badge.textContent = '0'; loadNotifications(); });

    // Load unread count
    try {
        const data = await api.getUnreadCount();
        if (data.success && data.count > 0) { badge.textContent = data.count; badge.style.display = 'flex'; }
    } catch (e) { /* silent */ }
}

async function loadNotifications() {
    const list = document.getElementById('notificationList');
    try {
        const data = await api.getNotifications(1, 15);
        if (data.success && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}" onclick="markAndNav('${n._id}','${n.link}')">
                <div class="notif-icon"><i class="fas fa-${getNotifIcon(n.type)}"></i></div>
                <div class="notif-body"><p>${n.message}</p><small>${timeAgo(n.createdAt)}</small></div>
            </div>`).join('');
        } else {
            list.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
        }
    } catch (e) { console.error('Notification load error:', e); }
}

async function markAndNav(id, link) {
    try { await api.markNotificationRead(id); } catch(e) {}
    window.location.href = link || '/dashboard';
}

function getNotifIcon(type) {
    const icons = { task_created:'plus-circle', task_completed:'check-circle', task_assigned:'user-plus', comment_added:'comment', project_created:'folder-plus', project_completed:'trophy', timer_stopped:'stopwatch', member_added:'user-plus' };
    return icons[type] || 'bell';
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago'; return Math.floor(s/86400) + 'd ago';
}

// ===== STREAK & DAILY PROGRESS =====
function initializeStreak() {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    // Build 28 day heatmap cells
    const today = new Date();
    let html = '';
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        html += `<div class="heatmap-cell level-0" data-date="${dateStr}" title="${dateStr}"></div>`;
    }
    grid.innerHTML = html;

    // Color cells based on completed tasks
    const completedByDay = {};
    let streak = 0;
    allTasks.forEach(t => {
        if (t.status === 'done' && t.completedAt) {
            const day = new Date(t.completedAt).toISOString().split('T')[0];
            completedByDay[day] = (completedByDay[day] || 0) + 1;
        }
    });

    // Calculate streak
    for (let i = 0; i <= 27; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        if (completedByDay[dayStr] && completedByDay[dayStr] > 0) streak++;
        else if (i > 0) break; // streak broken
    }
    document.getElementById('streakCount').textContent = `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;

    // Update heatmap cell colors
    grid.querySelectorAll('.heatmap-cell').forEach(cell => {
        const count = completedByDay[cell.dataset.date] || 0;
        cell.className = 'heatmap-cell';
        if (count === 0) cell.classList.add('level-0');
        else if (count <= 1) cell.classList.add('level-1');
        else if (count <= 3) cell.classList.add('level-2');
        else if (count <= 5) cell.classList.add('level-3');
        else cell.classList.add('level-4');
    });
}

function updateDailyProgress(tasks) {
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === today).length;
    const goal = 5;
    const el = document.getElementById('dailyProgress');
    if (el) el.textContent = `${todayCompleted}/${goal}`;

    const ring = document.getElementById('progressRingFill');
    if (ring) {
        const circumference = 2 * Math.PI * 60; // 377
        const pct = Math.min(todayCompleted / goal, 1);
        ring.style.strokeDashoffset = circumference * (1 - pct);
        ring.style.transition = 'stroke-dashoffset 1s ease';
        if (pct >= 1) ring.style.stroke = '#00ff88';
    }
}

// ===== LABEL SELECTOR =====
function initializeLabelSelector() {
    document.querySelectorAll('.label-chip.selectable').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });
}

// ===== POMODORO =====
function initializePomodoro() {
    const overlay = document.getElementById('pomodoroOverlay');
    const toggleBtn = document.getElementById('pomodoroToggle');
    const closeBtn = document.getElementById('pomodoroClose');
    if (!overlay || !toggleBtn) return;

    let pomoInterval = null;
    let pomoSeconds = 25 * 60;
    let pomoRunning = false;
    let pomoSessions = 0;
    const totalSec = () => pomoSeconds;

    toggleBtn.addEventListener('click', () => { overlay.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });

    function updatePomoDisplay() {
        const m = Math.floor(pomoSeconds / 60);
        const s = pomoSeconds % 60;
        document.getElementById('pomodoroTime').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        const ring = document.getElementById('pomodoroRing');
        const circumference = 2 * Math.PI * 115;
        const modeBtn = document.querySelector('.pomo-mode-btn.active');
        const totalSeconds = (modeBtn ? parseInt(modeBtn.dataset.minutes) : 25) * 60;
        const pct = 1 - (pomoSeconds / totalSeconds);
        ring.style.strokeDashoffset = circumference * (1 - pct);
    }

    document.getElementById('pomodoroStart').addEventListener('click', () => {
        if (pomoRunning) return;
        pomoRunning = true;
        document.getElementById('pomodoroStart').style.display = 'none';
        document.getElementById('pomodoroPause').style.display = 'inline-flex';
        pomoInterval = setInterval(() => {
            pomoSeconds--;
            updatePomoDisplay();
            if (pomoSeconds <= 0) {
                clearInterval(pomoInterval); pomoRunning = false;
                document.getElementById('pomodoroStart').style.display = 'inline-flex';
                document.getElementById('pomodoroPause').style.display = 'none';
                pomoSessions++;
                document.getElementById('pomodoroSessions').textContent = `Sessions: ${pomoSessions}`;
                // Play notification sound
                try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=880; o.connect(ctx.destination); o.start(); setTimeout(()=>o.stop(),300); } catch(e){}
                showMessage('🍅 Pomodoro complete! Take a break.', 'success');
            }
        }, 1000);
    });

    document.getElementById('pomodoroPause').addEventListener('click', () => {
        clearInterval(pomoInterval); pomoRunning = false;
        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroPause').style.display = 'none';
    });

    document.getElementById('pomodoroReset').addEventListener('click', () => {
        clearInterval(pomoInterval); pomoRunning = false;
        const modeBtn = document.querySelector('.pomo-mode-btn.active');
        pomoSeconds = (modeBtn ? parseInt(modeBtn.dataset.minutes) : 25) * 60;
        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroPause').style.display = 'none';
        updatePomoDisplay();
    });

    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clearInterval(pomoInterval); pomoRunning = false;
            pomoSeconds = parseInt(btn.dataset.minutes) * 60;
            document.getElementById('pomodoroStart').style.display = 'inline-flex';
            document.getElementById('pomodoroPause').style.display = 'none';
            document.getElementById('pomodoroTitle').textContent = btn.dataset.minutes === '25' ? 'Focus Time' : 'Break Time';
            const ring = document.getElementById('pomodoroRing');
            ring.style.stroke = btn.dataset.minutes === '25' ? '#00d4ff' : '#00ff88';
            updatePomoDisplay();
        });
    });

    updatePomoDisplay();
}

// My Tasks link
const myTasksLink = document.getElementById('myTasksLink');
if (myTasksLink) {
    myTasksLink.addEventListener('click', (e) => {
        e.preventDefault();
        const tasksSection = document.getElementById('tasksList');
        if (tasksSection) tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
