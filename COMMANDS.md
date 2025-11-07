# Quick Command Reference

## Installation Commands

```powershell
# Navigate to project
cd "c:\Users\arjun\OneDrive\Documents\LANDING PAGE\FocusFlow"

# Install dependencies
npm install

# Install nodemon for development (if needed)
npm install -g nodemon

# Copy environment file
Copy-Item .env.example .env
```

## MongoDB Commands

```powershell
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Check MongoDB status
sc query MongoDB
```

## Development Commands

```powershell
# Start in development mode (auto-reload)
npm run dev

# Start in production mode
npm start

# Run with specific port
$env:PORT=3000; npm start
```

## Useful npm Scripts

```powershell
# Run tests (when implemented)
npm test

# Lint code (when configured)
npm run lint

# Format code (when configured)
npm run format
```

## Database Commands

```powershell
# Open MongoDB shell
mongo

# Show all databases
show dbs

# Use focusflow database
use focusflow

# Show collections
show collections

# View users
db.users.find().pretty()

# View projects
db.projects.find().pretty()

# View tasks
db.tasks.find().pretty()

# Clear database (CAREFUL!)
db.dropDatabase()
```

## Troubleshooting Commands

```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
Remove-Item -Recurse -Force node_modules
npm install

# Kill process on port 5000
$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}

# Check what's running on port 5000
Get-NetTCPConnection -LocalPort 5000
```

## Git Commands (for version control)

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete FocusFlow app"

# Add remote repository
git remote add origin https://github.com/yourusername/focusflow.git

# Push to GitHub
git push -u origin main
```

## Testing the API (using curl or Invoke-WebRequest)

```powershell
# Register user
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'

# Get projects (replace TOKEN with actual token)
Invoke-WebRequest -Uri "http://localhost:5000/api/projects" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"}
```

## Environment Variables

```env
# Development
NODE_ENV=development
PORT=5000

# Production
NODE_ENV=production
PORT=80

# Database
MONGODB_URI=mongodb://localhost:27017/focusflow
# or for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/focusflow

# JWT
JWT_SECRET=super_secret_key_min_32_characters_long
JWT_REFRESH_SECRET=another_secret_key_different_from_above
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

## Browser Access Points

- Main App: http://localhost:5000
- Login: http://localhost:5000
- Register: http://localhost:5000/register
- Dashboard: http://localhost:5000/dashboard
- Projects: http://localhost:5000/projects
- Analytics: http://localhost:5000/analytics

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Use MongoDB Atlas or hosted MongoDB
- [ ] Set up CORS properly
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Configure backup strategy
- [ ] Test all features
- [ ] Update README with deployment URL

## Performance Optimization

```powershell
# Analyze bundle size (if using bundler)
npm run build --report

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Update dependencies
npm update
```

## Logs & Debugging

```powershell
# View console logs in real-time
npm run dev

# Check server logs
# Logs will appear in the terminal

# Enable debug mode
$env:DEBUG="*"; npm run dev
```

## Quick Reset (Development Only)

```powershell
# Stop server (Ctrl+C)

# Drop database
mongo focusflow --eval "db.dropDatabase()"

# Clear localStorage in browser
# F12 > Application > Local Storage > Clear All

# Restart server
npm run dev
```

Remember to always backup your data before running destructive commands!
