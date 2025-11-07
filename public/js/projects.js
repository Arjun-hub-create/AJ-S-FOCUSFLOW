// Projects page functionality
let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    // Load user info
    loadUserInfo();

    // Load projects
    await loadProjects();

    // Setup event listeners
    setupEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar;
    }
}

async function loadProjects() {
    try {
        const data = await api.getProjects();
        
        if (data.success) {
            displayProjects(data.projects);
            document.getElementById('projectCount').textContent = `${data.count} project${data.count !== 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function displayProjects(projects) {
    const container = document.getElementById('projectsGrid');
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h4>No Projects Yet</h4>
                <p>Create your first project to get started with task management</p>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => {
        const statusBadge = project.status === 'completed' 
            ? '<span class="project-completed-badge"><i class="fas fa-check-circle"></i> Completed</span>' 
            : '';
        
        return `
            <div class="project-card ${project.status === 'completed' ? 'completed-project' : ''}" 
                 style="--project-color: ${project.color}" 
                 data-project-id="${project._id}">
                <h4>${project.name} ${statusBadge}</h4>
                <p>${project.description || 'No description provided'}</p>
                <div class="project-meta">
                    <div class="project-members">
                        ${project.members.slice(0, 3).map(m => `
                            <img src="${m.user.avatar}" alt="${m.user.name}" class="member-avatar" title="${m.user.name}">
                        `).join('')}
                        ${project.members.length > 3 ? `<span>+${project.members.length - 3}</span>` : ''}
                    </div>
                    <span><i class="fas fa-calendar"></i> ${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${project.tags && project.tags.length > 0 ? project.tags.map(tag => `
                        <span style="background: rgba(0, 212, 255, 0.1); color: #00d4ff; padding: 4px 12px; border-radius: 12px; font-size: 11px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            ${tag}
                        </span>
                    `).join('') : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.projectId;
            viewProjectDetails(projectId);
        });
    });
}

function viewProjectDetails(projectId) {
    currentProject = projectId;
    
    // Hide projects list, show details view
    document.getElementById('projectsListView').style.display = 'none';
    document.getElementById('projectDetailsView').style.display = 'block';
    
    // Load project details and tasks
    loadProjectDetails(projectId);
}

async function loadProjectDetails(projectId) {
    try {
        // Get project details
        const projectData = await api.getProjects();
        const project = projectData.projects.find(p => p._id === projectId);
        
        if (project) {
            document.getElementById('projectDetailName').textContent = project.name;
            document.getElementById('projectDetailDesc').textContent = project.description || 'No description';
            
            // Show/hide complete/reopen buttons based on status
            const completeBtn = document.getElementById('completeProjectBtn');
            const reopenBtn = document.getElementById('reopenProjectBtn');
            const newTaskBtn = document.getElementById('newTaskBtn');
            
            if (project.status === 'completed') {
                completeBtn.style.display = 'none';
                reopenBtn.style.display = 'inline-flex';
                newTaskBtn.style.display = 'none';
                
                // Add completed badge
                const nameElement = document.getElementById('projectDetailName');
                if (!nameElement.querySelector('.project-completed-badge')) {
                    nameElement.innerHTML += ' <span class="project-completed-badge"><i class="fas fa-check-circle"></i> Completed</span>';
                }
            } else {
                completeBtn.style.display = 'inline-flex';
                reopenBtn.style.display = 'none';
                newTaskBtn.style.display = 'inline-flex';
            }
        }
        
        // Get project tasks
        const tasksData = await api.getTasks({ project: projectId });
        
        if (tasksData.success) {
            displayTasks(tasksData.tasks);
            updateProjectStats(tasksData.tasks);
        }
    } catch (error) {
        console.error('Error loading project details:', error);
    }
}

function updateProjectStats(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const activeTasks = tasks.filter(t => t.status !== 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('totalTasksCount').textContent = totalTasks;
    document.getElementById('completedTasksCount').textContent = completedTasks;
    document.getElementById('activeTasksCount').textContent = activeTasks;
    document.getElementById('progressPercentage').textContent = progress + '%';
}

function displayTasks(tasks) {
    const todoContainer = document.getElementById('todoTasks');
    const inProgressContainer = document.getElementById('inProgressTasks');
    const doneContainer = document.getElementById('doneTasks');
    
    // Clear containers
    todoContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    doneContainer.innerHTML = '';
    
    // Filter tasks by status
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const doneTasks = tasks.filter(t => t.status === 'done');
    
    // Update counts
    document.getElementById('todoCount').textContent = todoTasks.length;
    document.getElementById('inProgressCount').textContent = inProgressTasks.length;
    document.getElementById('doneCount').textContent = doneTasks.length;
    
    // Render tasks
    renderTaskList(todoTasks, todoContainer);
    renderTaskList(inProgressTasks, inProgressContainer);
    renderTaskList(doneTasks, doneContainer);
}

function renderTaskList(tasks, container) {
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-task-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';
        
        return `
            <div class="task-card" data-task-id="${task._id}">
                <div class="task-card-header">
                    <h5 class="task-card-title">${task.title}</h5>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
                <div class="task-card-footer">
                    ${dueDate ? `
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${dueDate.toLocaleDateString()}
                        </span>
                    ` : '<span></span>'}
                    <div class="task-actions">
                        ${task.status !== 'done' ? `
                            <button class="task-action-btn" onclick="markTaskComplete('${task._id}')" title="Mark Complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <button class="task-action-btn" onclick="markTaskIncomplete('${task._id}')" title="Mark Incomplete">
                                <i class="fas fa-undo"></i>
                            </button>
                        `}
                        <button class="task-action-btn" onclick="changeTaskStatus('${task._id}', '${task.status}')" title="Change Status">
                            <i class="fas fa-arrows-alt"></i>
                        </button>
                        <button class="task-action-btn" onclick="deleteTask('${task._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function markTaskComplete(taskId) {
    try {
        const data = await api.updateTask(taskId, { status: 'done' });
        if (data.success) {
            showToast('Task marked as complete!', 'success');
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Failed to complete task', 'error');
    }
}

async function markTaskIncomplete(taskId) {
    try {
        const data = await api.updateTask(taskId, { status: 'todo' });
        if (data.success) {
            showToast('Task marked as incomplete', 'info');
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showToast('Failed to update task', 'error');
    }
}

async function changeTaskStatus(taskId, currentStatus) {
    const statuses = ['todo', 'in-progress', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
        const data = await api.updateTask(taskId, { status: newStatus });
        if (data.success) {
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const data = await api.deleteTask(taskId);
        if (data.success) {
            showToast('Task deleted successfully', 'success');
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
    }
}

async function completeProject() {
    if (!currentProject) return;
    
    const confirmed = confirm('Are you sure you want to mark this project as completed? This will close the project and prevent new tasks from being added.');
    if (!confirmed) return;
    
    try {
        const data = await api.completeProject(currentProject);
        if (data.success) {
            showToast('Project completed successfully! 🎉', 'success');
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error completing project:', error);
        showToast('Failed to complete project', 'error');
    }
}

async function reopenProject() {
    if (!currentProject) return;
    
    const confirmed = confirm('Are you sure you want to reopen this project?');
    if (!confirmed) return;
    
    try {
        const data = await api.reopenProject(currentProject);
        if (data.success) {
            showToast('Project reopened successfully', 'success');
            await loadProjectDetails(currentProject);
        }
    } catch (error) {
        console.error('Error reopening project:', error);
        showToast('Failed to reopen project', 'error');
    }
}

async function deleteProject() {
    if (!currentProject) return;
    
    const confirmed = confirm('Are you sure you want to DELETE this project? This will also delete all tasks in this project. This action cannot be undone!');
    if (!confirmed) return;
    
    try {
        const data = await api.deleteProject(currentProject);
        if (data.success) {
            showToast('Project deleted successfully', 'success');
            // Go back to projects list
            document.getElementById('projectDetailsView').style.display = 'none';
            document.getElementById('projectsListView').style.display = 'block';
            currentProject = null;
            await loadProjects();
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Failed to delete project', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#00d4ff',
        warning: '#ff9800'
    };
    
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await api.logout();
    });

    // Back to Projects
    document.getElementById('backToProjects').addEventListener('click', () => {
        document.getElementById('projectDetailsView').style.display = 'none';
        document.getElementById('projectsListView').style.display = 'block';
        currentProject = null;
        loadProjects(); // Reload projects to show updated stats
    });

    // Complete Project
    document.getElementById('completeProjectBtn').addEventListener('click', completeProject);
    
    // Reopen Project
    document.getElementById('reopenProjectBtn').addEventListener('click', reopenProject);

    // Delete Project
    document.getElementById('deleteProjectBtn').addEventListener('click', deleteProject);

    // New Project Modal
    const projectModal = document.getElementById('projectModal');
    const newProjectBtn = document.getElementById('newProjectBtn');
    
    newProjectBtn.addEventListener('click', () => {
        projectModal.classList.add('active');
    });

    // New Task Modal
    const taskModal = document.getElementById('taskModal');
    const newTaskBtn = document.getElementById('newTaskBtn');
    
    newTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('active');
    });

    // Close modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Project Form
    document.getElementById('projectForm').addEventListener('submit', async (e) => {
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
                await loadProjects();
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project: ' + (error.message || 'Unknown error'));
        }
    });

    // Task Form
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentProject) {
            alert('No project selected');
            return;
        }

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value || null,
            project: currentProject
        };

        try {
            const data = await api.createTask(taskData);
            if (data.success) {
                taskModal.classList.remove('active');
                e.target.reset();
                await loadProjectDetails(currentProject);
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task: ' + (error.message || 'Unknown error'));
        }
    });
}
