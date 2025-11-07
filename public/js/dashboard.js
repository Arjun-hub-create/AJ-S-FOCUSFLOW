// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loading...');
    
    // Check authentication
    if (!localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    // Load user info
    loadUserInfo();

    // Load dashboard data
    await loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    // Listen for real-time updates
    setupRealtimeListeners();
    
    // Initialize Timer
    initializeTimer();
    
    // Initialize Mobile Menu
    initializeMobileMenu();
    
    // Initialize Modals
    initializeModals();
    
    console.log('Dashboard loaded successfully');
});

// Helper function to show messages
function showMessage(message, type = 'info') {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.9)' : type === 'error' ? 'rgba(255, 87, 87, 0.9)' : 'rgba(0, 212, 255, 0.9)'};
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar;
    }
}

async function loadDashboardData() {
    try {
        // Load analytics
        const analyticsData = await api.getAnalyticsOverview();
        if (analyticsData.success) {
            updateStatsCards(analyticsData.analytics);
        }

        // Load recent projects
        const projectsData = await api.getProjects();
        if (projectsData.success) {
            displayProjects(projectsData.projects.slice(0, 4));
        }

        // Load recent tasks
        const tasksData = await api.getTasks();
        if (tasksData.success) {
            displayTasks(tasksData.tasks.slice(0, 10));
        }

        // Load projects for task modal
        if (projectsData.success) {
            populateProjectSelect(projectsData.projects);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateStatsCards(analytics) {
    // Update task stats
    document.getElementById('totalTasks').textContent = analytics.tasks.total;
    document.getElementById('completedTasks').textContent = analytics.tasks.completed;
    document.getElementById('inProgressTasks').textContent = analytics.tasks.inProgress;
    document.getElementById('totalHours').textContent = analytics.time.totalHours + 'h';
    
    // Calculate and display completion percentage
    const completionRate = analytics.tasks.total > 0 
        ? Math.round((analytics.tasks.completed / analytics.tasks.total) * 100) 
        : 0;
    
    // Update projects stats if available
    if (analytics.projects) {
        const activeProjects = analytics.projects.active || 0;
        const completedProjects = analytics.projects.completed || 0;
        
        // You can display these stats somewhere on the dashboard
        console.log(`Active Projects: ${activeProjects}, Completed Projects: ${completedProjects}`);
    }
}

function displayProjects(projects) {
    const container = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><h4>No Projects Yet</h4><p>Create your first project to get started</p></div>';
        return;
    }

    container.innerHTML = projects.map(project => {
        const statusBadge = project.status === 'completed' 
            ? '<span class="project-completed-badge"><i class="fas fa-check-circle"></i> Completed</span>' 
            : '';
        
        return `
            <div class="project-card ${project.status === 'completed' ? 'completed-project' : ''}" 
                 style="--project-color: ${project.color}" 
                 onclick="window.location.href='/projects'">
                <h4>${project.name} ${statusBadge}</h4>
                <p>${project.description || 'No description'}</p>
                <div class="project-meta">
                    <span><i class="fas fa-users"></i> ${project.members.length} members</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function displayTasks(tasks) {
    const container = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><h4>No Tasks Yet</h4><p>Create your first task to get started</p></div>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-left">
                <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" 
                     onclick="toggleTaskStatus('${task._id}', '${task.status}')"></div>
                <div class="task-info">
                    <h5>${task.title}</h5>
                    <p>${task.project?.name || 'No project'} • ${task.assignees.length} assignees</p>
                </div>
            </div>
            <div class="task-right">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                ${task.dueDate ? `<span style="color: rgba(0, 212, 255, 0.6); font-size: 12px;">
                    <i class="fas fa-clock"></i> ${new Date(task.dueDate).toLocaleDateString()}
                </span>` : ''}
                <button class="task-delete-btn" onclick="deleteTask('${task._id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function populateProjectSelect(projects) {
    const select = document.getElementById('taskProject');
    if (select) {
        select.innerHTML = '<option value="">Select Project</option>' + 
            projects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
    }
}

async function toggleTaskStatus(taskId, currentStatus) {
    try {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        await api.updateTask(taskId, { status: newStatus });
        await loadDashboardData();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const result = await api.deleteTask(taskId);
        if (result.success) {
            showMessage('Task deleted successfully', 'success');
            await loadDashboardData();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Failed to delete task', 'error');
    }
}

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await api.logout();
        });
    }

    // New Project Modal
    const projectModal = document.getElementById('projectModal');
    const newProjectBtn = document.getElementById('newProjectBtn');
    
    if (newProjectBtn && projectModal) {
        newProjectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Opening project modal');
            projectModal.classList.add('active');
        });
    } else {
        console.error('Project modal or button not found', { projectModal, newProjectBtn });
    }

    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const projectData = {
                name: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                color: document.getElementById('projectColor').value
            };

            try {
                const data = await api.createProject(projectData);
                if (data.success) {
                    projectModal.classList.remove('active');
                    e.target.reset();
                    await loadDashboardData();
                    showMessage('Project created successfully!', 'success');
                } else {
                    showMessage(data.message || 'Failed to create project', 'error');
                }
            } catch (error) {
                console.error('Error creating project:', error);
                showMessage('Failed to create project', 'error');
            }
        });
    }

    // New Task Modal
    const taskModal = document.getElementById('taskModal');
    const newTaskBtn = document.getElementById('newTaskBtn');
    
    if (newTaskBtn && taskModal) {
        newTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Opening task modal');
            taskModal.classList.add('active');
        });
    } else {
        console.error('Task modal or button not found', { taskModal, newTaskBtn });
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const taskData = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                project: document.getElementById('taskProject').value,
                priority: document.getElementById('taskPriority').value,
                dueDate: document.getElementById('taskDueDate').value || undefined
            };

            try {
                const data = await api.createTask(taskData);
                if (data.success) {
                    taskModal.classList.remove('active');
                    e.target.reset();
                    await loadDashboardData();
                    showMessage('Task created successfully!', 'success');
                } else {
                    showMessage(data.message || 'Failed to create task', 'error');
                }
            } catch (error) {
                console.error('Error creating task:', error);
                showMessage('Failed to create task', 'error');
            }
        });
    }
}

function setupRealtimeListeners() {
    window.addEventListener('task-update', () => {
        loadDashboardData();
    });

    window.addEventListener('task-create', () => {
        loadDashboardData();
    });

    window.addEventListener('task-delete', () => {
        loadDashboardData();
    });

    window.addEventListener('timer-stopped', () => {
        loadDashboardData();
    });
}

// Initialize Timer
function initializeTimer() {
    if (typeof Timer !== 'undefined') {
        const timer = new Timer();
        timer.checkActiveTimer();

        const timerToggle = document.getElementById('timerToggle');
        if (timerToggle) {
            timerToggle.addEventListener('click', () => {
                timer.toggle();
            });
        }
    } else {
        console.warn('Timer class not loaded');
    }
}

// Mobile Menu Toggle
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');

    if (!mobileMenuToggle || !sidebar || !overlay) return;

    if (window.innerWidth <= 1024) {
        mobileMenuToggle.style.display = 'flex';
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            mobileMenuToggle.style.display = 'flex';
        } else {
            mobileMenuToggle.style.display = 'none';
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });

    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// Initialize modal close buttons
function initializeModals() {
    // Close modal functionality
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// My Tasks link handler
const myTasksLink = document.getElementById('myTasksLink');
if (myTasksLink) {
    myTasksLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Scroll to tasks section
        const tasksSection = document.getElementById('tasksList');
        if (tasksSection) {
            tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}
