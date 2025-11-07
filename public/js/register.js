// Registration
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = '/dashboard';
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        alert('Register button clicked!');
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match!';
            messageDiv.className = 'message error';
            return;
        }

        if (password.length < 6) {
            messageDiv.textContent = 'Password must be at least 6 characters!';
            messageDiv.className = 'message error';
            return;
        }

        try {
            messageDiv.textContent = 'Creating account...';
            messageDiv.className = 'message';
            messageDiv.style.display = 'block';

            const data = await api.register(name, email, password);

            if (data.success) {
                messageDiv.textContent = 'Account created! Redirecting...';
                messageDiv.className = 'message success';
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            messageDiv.textContent = error.message || 'Registration failed. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    });
});
