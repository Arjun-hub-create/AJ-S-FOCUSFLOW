// Timer functionality
class Timer {
    constructor() {
        this.activeTimer = null;
        this.interval = null;
        this.startTime = null;
        this.elapsedSeconds = 0;
    }

    async checkActiveTimer() {
        try {
            const data = await api.getActiveTimer();
            if (data.success && data.activeTimer) {
                this.activeTimer = data.activeTimer;
                this.startTime = new Date(data.activeTimer.startTime);
                this.elapsedSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
                this.start();
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error checking active timer:', error);
        }
    }

    start() {
        if (this.interval) return;

        this.interval = setInterval(() => {
            this.elapsedSeconds++;
            this.updateDisplay();
        }, 1000);

        const timerToggle = document.getElementById('timerToggle');
        if (timerToggle) {
            timerToggle.innerHTML = '<i class="fas fa-stop"></i>';
            timerToggle.classList.add('active');
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.elapsedSeconds = 0;
        this.startTime = null;
        this.activeTimer = null;

        const timerToggle = document.getElementById('timerToggle');
        if (timerToggle) {
            timerToggle.innerHTML = '<i class="fas fa-play"></i>';
            timerToggle.classList.remove('active');
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const hours = Math.floor(this.elapsedSeconds / 3600);
        const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
        const seconds = this.elapsedSeconds % 60;

        const display = document.getElementById('timerDisplay');
        if (display) {
            display.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    async toggle() {
        if (this.activeTimer) {
            // Stop timer
            try {
                await api.stopTimer(this.activeTimer._id);
                this.stop();
                showMessage('Timer stopped', 'success');
                
                // Refresh analytics/tasks if needed
                window.dispatchEvent(new Event('timer-stopped'));
            } catch (error) {
                showMessage('Failed to stop timer', 'error');
                console.error(error);
            }
        } else {
            // Show task selection modal
            this.showTaskSelection();
        }
    }

    async showTaskSelection() {
        const modal = document.getElementById('timerModal');
        const tasksList = document.getElementById('timerTasksList');

        if (!modal || !tasksList) return;

        try {
            // Get tasks
            const data = await api.getTasks({ status: 'in-progress,todo' });
            
            if (data.success && data.tasks.length > 0) {
                tasksList.innerHTML = data.tasks.map(task => `
                    <div class="timer-task-item" data-task-id="${task._id}">
                        <h5>${task.title}</h5>
                        <p>${task.project?.name || 'No project'}</p>
                    </div>
                `).join('');

                // Add click handlers
                tasksList.querySelectorAll('.timer-task-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.startTimerForTask(item.dataset.taskId);
                        modal.classList.remove('active');
                    });
                });

                modal.classList.add('active');
            } else {
                showMessage('No tasks available to track time', 'error');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            showMessage('Failed to load tasks', 'error');
        }
    }

    async startTimerForTask(taskId) {
        try {
            const data = await api.startTimer(taskId);
            
            if (data.success) {
                this.activeTimer = data.timeEntry;
                this.startTime = new Date(data.timeEntry.startTime);
                this.elapsedSeconds = 0;
                this.start();
                showMessage('Timer started', 'success');
                
                emitTimerStart({
                    userId: JSON.parse(localStorage.getItem('user')).id,
                    taskId: taskId
                });
            }
        } catch (error) {
            console.error('Error starting timer:', error);
            showMessage(error.message || 'Failed to start timer', 'error');
        }
    }
}

// Initialize timer
// Note: Timer is initialized in dashboard.js, not here
// This makes the Timer class available globally

// Helper function to show messages (using the dashboard's showMessage if available)
function showMessage(message, type = 'info') {
    // Use dashboard's showMessage if it exists
    if (typeof window.showMessage === 'function') {
        window.showMessage(message, type);
    } else {
        // Fallback: Create toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        
        const colors = {
            success: 'rgba(0, 255, 136, 0.9)',
            error: 'rgba(255, 87, 87, 0.9)',
            info: 'rgba(0, 212, 255, 0.9)'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${colors[type] || colors.info};
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
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
}
