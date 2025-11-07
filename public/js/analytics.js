// Analytics page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    // Load user info
    loadUserInfo();

    // Load analytics
    await loadAnalytics();

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

async function loadAnalytics() {
    try {
        const data = await api.getAnalyticsOverview();
        
        if (data.success) {
            updateAnalyticsStats(data.analytics);
            createCharts(data.analytics);
        }

        // Load time entries
        const timeData = await api.getTimeEntries();
        if (timeData.success) {
            displayTimeEntries(timeData.entries);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateAnalyticsStats(analytics) {
    document.getElementById('analyticsTotalTasks').textContent = analytics.tasks.total;
    document.getElementById('analyticsCompletedTasks').textContent = analytics.tasks.completed;
    document.getElementById('analyticsInProgress').textContent = analytics.tasks.inProgress;
    document.getElementById('analyticsTotalHours').textContent = analytics.time.totalHours + 'h';
    document.getElementById('completionRate').textContent = analytics.tasks.completionRate + '% Complete';
    document.getElementById('avgHours').textContent = analytics.time.avgHoursPerTask + 'h avg per task';
}

function createCharts(analytics) {
    // Task Distribution Pie Chart
    const taskCtx = document.getElementById('taskDistributionChart');
    if (taskCtx) {
        new Chart(taskCtx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Completed'],
                datasets: [{
                    data: [
                        analytics.tasks.todo,
                        analytics.tasks.inProgress,
                        analytics.tasks.completed
                    ],
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(0, 255, 136, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(0, 212, 255, 1)',
                        'rgba(0, 255, 136, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#00d4ff',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Priority Breakdown Bar Chart
    const priorityCtx = document.getElementById('priorityChart');
    if (priorityCtx && analytics.productivity.byPriority) {
        const priorityData = analytics.productivity.byPriority;
        const labels = priorityData.map(p => p._id.charAt(0).toUpperCase() + p._id.slice(1));
        const counts = priorityData.map(p => p.count);

        new Chart(priorityCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks by Priority',
                    data: counts,
                    backgroundColor: [
                        'rgba(0, 255, 136, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(255, 87, 87, 0.8)',
                        'rgba(255, 0, 0, 0.8)'
                    ],
                    borderColor: [
                        'rgba(0, 255, 136, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(255, 87, 87, 1)',
                        'rgba(255, 0, 0, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#00d4ff',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 212, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#00d4ff'
                        },
                        grid: {
                            color: 'rgba(0, 212, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

function displayTimeEntries(entries) {
    const container = document.getElementById('timeEntriesList');
    
    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h4>No Time Entries</h4>
                <p>Start tracking time on tasks to see your activity here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = entries.slice(0, 20).map(entry => {
        const duration = formatDuration(entry.duration);
        const date = new Date(entry.startTime).toLocaleDateString();
        const time = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="time-entry">
                <div class="time-entry-left">
                    <h5>${entry.task?.title || 'Unknown Task'}</h5>
                    <p>${entry.project?.name || 'No Project'} • ${date} at ${time}</p>
                </div>
                <div class="time-entry-duration">${duration}</div>
            </div>
        `;
    }).join('');
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await api.logout();
    });
}
