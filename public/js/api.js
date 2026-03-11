// API Client for FocusFlow
// Always call the API on the same origin/port serving the frontend.
const API_BASE_URL = `${window.location.origin}/api`;

class API {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    // Clear local auth state without calling the API (safe fallback on auth errors)
    localLogout(redirectTo = '/') {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = redirectTo;
    }

    // Set authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Handle API errors
    async handleResponse(response) {
        if (response.status === 401) {
            // Token expired, try to refresh
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                // Avoid calling /auth/logout here (can loop on 401). Just clear local state.
                this.localLogout('/');
                throw new Error('Session expired. Please sign in again.');
            }
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    }

    // Refresh access token
    async refreshAccessToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                localStorage.setItem('token', data.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    // Generic request method
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            // Better error message for connection issues
            if (error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Please make sure the server is running.');
            }
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            this.token = data.token;
            this.refreshToken = data.refreshToken;
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        if (data.success) {
            this.token = data.token;
            this.refreshToken = data.refreshToken;
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (_) {
            // If the API call fails, still log out locally.
        }
        this.localLogout('/');
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Projects endpoints
    async getProjects() {
        return await this.request('/projects');
    }

    async getProject(id) {
        return await this.request(`/projects/${id}`);
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return await this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return await this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    async completeProject(id) {
        return await this.request(`/projects/${id}/complete`, {
            method: 'PUT'
        });
    }

    async reopenProject(id) {
        return await this.request(`/projects/${id}/reopen`, {
            method: 'PUT'
        });
    }

    async archiveProject(id) {
        return await this.request(`/projects/${id}/archive`, {
            method: 'PUT'
        });
    }

    async getArchivedProjects() {
        return await this.request('/projects/archived/list');
    }

    async addProjectMember(projectId, email, role = 'member') {
        return await this.request(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ email, role })
        });
    }

    // Tasks endpoints
    async getTasks(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await this.request(`/tasks?${queryString}`);
    }

    async getTask(id) {
        return await this.request(`/tasks/${id}`);
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(id, taskData) {
        return await this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    async addTaskComment(taskId, text) {
        return await this.request(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    // Time tracking endpoints
    async startTimer(taskId, description = '') {
        return await this.request('/time/start', {
            method: 'POST',
            body: JSON.stringify({ taskId, description })
        });
    }

    async stopTimer(entryId) {
        return await this.request(`/time/stop/${entryId}`, {
            method: 'POST'
        });
    }

    async getTimeEntries(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await this.request(`/time?${queryString}`);
    }

    async getActiveTimer() {
        return await this.request('/time/active');
    }

    async deleteTimeEntry(id) {
        return await this.request(`/time/${id}`, {
            method: 'DELETE'
        });
    }

    // Analytics endpoints
    async getAnalyticsOverview(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await this.request(`/analytics/overview?${queryString}`);
    }

    async getProjectAnalytics(projectId) {
        return await this.request(`/analytics/project/${projectId}`);
    }

    // Users endpoints
    async getUsers() {
        return await this.request('/users');
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }
}

// Export as global
const api = new API();
