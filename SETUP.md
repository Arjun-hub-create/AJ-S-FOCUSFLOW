# 🚀 Quick Setup Guide for FocusFlow

## Step-by-Step Installation

### 1. Install Dependencies

Open PowerShell in the FocusFlow directory and run:

```powershell
cd "c:\Users\arjun\OneDrive\Documents\LANDING PAGE\FocusFlow"
npm install
```

### 2. Set Up Environment Variables

```powershell
Copy-Item .env.example .env
```

Then edit the `.env` file with your preferred text editor:
```powershell
notepad .env
```

**Important**: Change the JWT secrets to something secure!

### 3. Start MongoDB

If MongoDB is not installed, download it from: https://www.mongodb.com/try/download/community

Start MongoDB service:
```powershell
# Start MongoDB service
net start MongoDB

# Or if using MongoDB Compass, just launch the app
```

### 4. Run the Application

Development mode (with auto-reload):
```powershell
npm run dev
```

Or standard mode:
```powershell
npm start
```

### 5. Access the Application

Open your browser and navigate to:
- **Main App**: http://localhost:5000
- **Register**: http://localhost:5000/register
- **Dashboard**: http://localhost:5000/dashboard (after login)

---

## 🎯 First Steps After Installation

### 1. Create Your Account
1. Go to http://localhost:5000/register
2. Fill in your details:
   - Name: Your Full Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
3. Click "CREATE ACCOUNT"

### 2. Create Your First Project
1. Once logged in, you'll see the Dashboard
2. Click "New Project" button
3. Fill in:
   - Project Name: "My First Project"
   - Description: "Getting started with FocusFlow"
   - Color: Choose your favorite color
4. Click "Create Project"

### 3. Create Your First Task
1. Click "New Task" button
2. Fill in:
   - Task Title: "Complete onboarding"
   - Description: "Learn how to use FocusFlow"
   - Project: Select the project you just created
   - Priority: Medium
3. Click "Create Task"

### 4. Track Time on a Task
1. Click the timer icon (⏱) in the top bar
2. Select the task you want to track time for
3. Click play ▶️ to start
4. Work on your task
5. Click stop ⏸ when done
6. Check "Analytics" page to see your time entries

---

## 🔧 Troubleshooting

### MongoDB Connection Error
**Error**: `MongoDB Connection Error`

**Solution**:
1. Make sure MongoDB is running:
   ```powershell
   net start MongoDB
   ```
2. Check if MongoDB URI in `.env` is correct:
   ```
   MONGODB_URI=mongodb://localhost:27017/focusflow
   ```

### Port Already in Use
**Error**: `Port 5000 is already in use`

**Solution**:
1. Change the port in `.env`:
   ```
   PORT=3000
   ```
2. Or kill the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Token Expired Error
**Error**: `Token is invalid or expired`

**Solution**:
1. Clear browser localStorage:
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Clear all items
2. Login again

### CSS/JS Not Loading
**Error**: Styles or scripts not working

**Solution**:
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard reload the page (Ctrl + F5)
3. Check browser console (F12) for errors

---

## 📝 Default User Roles

- **Member**: Can create projects, tasks, track time, view analytics
- **Admin**: All member permissions + project deletion

---

## 🎨 Customization

### Change Theme Colors

Edit `public/css/dashboard.css` and modify:
```css
/* Change primary color from cyan to your choice */
--primary-color: #00d4ff;  /* Change this */
```

### Modify Particle Effects

Edit `public/js/particles-config.js`:
```javascript
"color": {
    "value": "#00d4ff"  // Change particle color
},
"number": {
    "value": 100  // Change particle count
}
```

---

## 🔒 Security Checklist Before Production

- [ ] Change JWT_SECRET to a strong random string
- [ ] Change JWT_REFRESH_SECRET to a different strong string
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Configure CORS to specific domains
- [ ] Add input sanitization
- [ ] Set up error logging (Winston/Sentry)
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific configs

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

---

## 🆘 Need Help?

1. Check the main README.md for detailed documentation
2. Open an issue on GitHub
3. Contact support

---

**Happy coding! 🎉**
