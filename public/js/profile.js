// Profile page functionality
document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }

    loadUserInfo();
    await loadProfileData();
    setupProfileEventListeners();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar;
    }
}

async function loadProfileData() {
    try {
        // Get full user data
        const userData = await api.getCurrentUser();
        if (userData.success) {
            const user = userData.user;
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileAvatar').src = user.avatar;
            document.getElementById('profileRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            document.getElementById('editName').value = user.name;
            document.getElementById('memberSince').textContent = new Date(user.createdAt).toLocaleDateString();
            document.getElementById('lastActive').textContent = user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Now';
            document.getElementById('accountRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

            // Project count
            document.getElementById('profileProjects').textContent = user.projects ? user.projects.length : 0;
        }

        // Get analytics for stats
        const analyticsData = await api.getAnalyticsOverview();
        if (analyticsData.success) {
            document.getElementById('profileTasks').textContent = analyticsData.analytics.tasks.completed;
            document.getElementById('profileHours').textContent = analyticsData.analytics.time.totalHours + 'h';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function showProfileToast(message, type = 'info') {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();

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
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupProfileEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await api.logout();
    });

    // Edit Profile
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('editName').value.trim();
        const avatar = document.getElementById('editAvatar').value.trim();

        try {
            const data = await api.updateProfile({
                name,
                avatar: avatar || undefined
            });

            if (data.success) {
                showProfileToast('Profile updated successfully!', 'success');
                // Update local storage
                const storedUser = JSON.parse(localStorage.getItem('user'));
                storedUser.name = data.user.name;
                storedUser.avatar = data.user.avatar;
                localStorage.setItem('user', JSON.stringify(storedUser));
                loadUserInfo();
                await loadProfileData();
            }
        } catch (error) {
            showProfileToast(error.message || 'Failed to update profile', 'error');
        }
    });

    // Change Password
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showProfileToast('New passwords do not match', 'error');
            return;
        }

        try {
            const data = await api.changePassword(currentPassword, newPassword);
            if (data.success) {
                showProfileToast('Password changed successfully!', 'success');
                e.target.reset();
            }
        } catch (error) {
            showProfileToast(error.message || 'Failed to change password', 'error');
        }
    });
}
