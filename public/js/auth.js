// Authentication - Login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordBox = document.getElementById('forgotPasswordBox');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const backToLogin = document.getElementById('backToLogin');
    const loginBox = loginForm?.parentElement;

    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = '/dashboard';
        return;
    }

    // Toggle to forgot password form
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginBox) loginBox.style.display = 'none';
            if (forgotPasswordBox) forgotPasswordBox.style.display = 'block';
        });
    }

    // Toggle back to login form
    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (forgotPasswordBox) forgotPasswordBox.style.display = 'none';
            if (loginBox) loginBox.style.display = 'block';
        });
    }

    // Handle forgot password form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const resetMessage = document.getElementById('resetMessage');
            const email = document.getElementById('resetEmail').value;

            try {
                resetMessage.textContent = 'Sending reset instructions...';
                resetMessage.className = 'message';
                resetMessage.style.display = 'block';

                // Simulate sending reset email (you can implement actual email sending on backend)
                await new Promise(resolve => setTimeout(resolve, 1500));

                resetMessage.textContent = `Password reset link sent to ${email}! Check your inbox.`;
                resetMessage.className = 'message success';
                resetMessage.style.display = 'block';

                setTimeout(() => {
                    if (forgotPasswordBox) forgotPasswordBox.style.display = 'none';
                    if (loginBox) loginBox.style.display = 'block';
                    resetMessage.style.display = 'none';
                    forgotPasswordForm.reset();
                }, 3000);
            } catch (error) {
                resetMessage.textContent = 'Failed to send reset link. Please try again.';
                resetMessage.className = 'message error';
                resetMessage.style.display = 'block';
            }
        });
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            alert('Login button clicked!');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                messageDiv.textContent = 'Signing in...';
                messageDiv.className = 'message';
                messageDiv.style.display = 'block';

                const data = await api.login(email, password);

                if (data.success) {
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.className = 'message success';
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                messageDiv.textContent = error.message || 'Login failed. Please try again.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        });
    }
});
