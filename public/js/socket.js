// Socket.IO Client
let socket;

function initializeSocket() {
    socket = io('http://localhost:5000');

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        socket.emit('user-online', user.id);
    }

    // Listen for events
    socket.on('connect', () => {
        console.log('✅ Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    socket.on('user-status', (data) => {
        console.log('User status:', data);
        // Update UI to show online/offline status
    });

    socket.on('task-updated', (task) => {
        console.log('Task updated:', task);
        // Refresh tasks list if on dashboard/project page
        if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('projects')) {
            // Trigger task refresh
            window.dispatchEvent(new CustomEvent('task-update', { detail: task }));
        }
    });

    socket.on('task-created', (task) => {
        console.log('New task created:', task);
        window.dispatchEvent(new CustomEvent('task-create', { detail: task }));
    });

    socket.on('task-deleted', (data) => {
        console.log('Task deleted:', data);
        window.dispatchEvent(new CustomEvent('task-delete', { detail: data }));
    });

    socket.on('comment-added', (data) => {
        console.log('New comment:', data);
        window.dispatchEvent(new CustomEvent('comment-added', { detail: data }));
    });

    socket.on('timer-started', (data) => {
        console.log('Timer started:', data);
    });

    socket.on('timer-stopped', (data) => {
        console.log('Timer stopped:', data);
    });
}

function joinProject(projectId) {
    if (socket) {
        socket.emit('join-project', projectId);
    }
}

function emitTaskUpdate(data) {
    if (socket) {
        socket.emit('task-update', data);
    }
}

function emitTimerStart(data) {
    if (socket) {
        socket.emit('timer-start', data);
    }
}

function emitTimerStop(data) {
    if (socket) {
        socket.emit('timer-stop', data);
    }
}

// Initialize on page load
if (localStorage.getItem('token')) {
    initializeSocket();
}
