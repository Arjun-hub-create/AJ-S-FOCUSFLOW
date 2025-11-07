# 🚀 AJ'S FOCUSFLOW - Deployment Guide

## Production Deployment Checklist

### 1. Environment Setup

#### Update Environment Variables
Create `.env.production` file:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
```

#### Generate Secure Secrets
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Refresh Secret  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 2. Code Updates for Production

#### Update API Base URL
In `public/js/api.js`, change:
```javascript
// Development
const API_BASE_URL = 'http://localhost:3000/api';

// Production
const API_BASE_URL = 'https://yourdomain.com/api';
// OR use environment detection:
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://yourdomain.com/api';
```

#### Update CORS Settings
In `server.js`, update allowed origins:
```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'https://yourdomain.com',
  credentials: true
};
```

---

### 3. Database Preparation

#### MongoDB Atlas Setup
1. Login to MongoDB Atlas
2. Ensure IP whitelist includes your server IP (or 0.0.0.0/0 for all)
3. Create database user with read/write permissions
4. Copy connection string to `.env.production`
5. Create indexes for performance:
```javascript
// Run these in MongoDB Compass or Atlas
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ owner: 1, status: 1 });
db.tasks.createIndex({ project: 1, status: 1 });
db.timeentries.createIndex({ user: 1, task: 1 });
```

---

### 4. Build & Optimize

#### Install Production Dependencies
```bash
cd "c:\Users\arjun\OneDrive\Documents\LANDING PAGE\FocusFlow"
npm install --production
```

#### Minify Frontend Assets (Optional)
```bash
# Install terser for JS minification
npm install -g terser

# Minify JavaScript files
terser public/js/api.js -o public/js/api.min.js
terser public/js/auth.js -o public/js/auth.min.js
terser public/js/dashboard.js -o public/js/dashboard.min.js
terser public/js/projects.js -o public/js/projects.min.js
terser public/js/analytics.js -o public/js/analytics.min.js

# Update HTML to use minified versions
```

---

### 5. Server Deployment Options

## Option A: Deploy to Heroku

### Step 1: Install Heroku CLI
Download from https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Login and Create App
```bash
heroku login
heroku create ajs-focusflow
```

### Step 3: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set JWT_REFRESH_SECRET="your_refresh_secret"
heroku config:set CLIENT_URL="https://ajs-focusflow.herokuapp.com"
```

### Step 4: Deploy
```bash
git init
git add .
git commit -m "Initial deployment"
git push heroku master
```

### Step 5: Open App
```bash
heroku open
```

---

## Option B: Deploy to Render.com

### Step 1: Create Account
Go to https://render.com and sign up

### Step 2: New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: ajs-focusflow
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free or Starter

### Step 3: Add Environment Variables
In Render dashboard, add:
- `NODE_ENV` = production
- `MONGODB_URI` = your_connection_string
- `JWT_SECRET` = your_secret
- `JWT_REFRESH_SECRET` = your_refresh_secret
- `PORT` = 3000

### Step 4: Deploy
Click "Create Web Service" - auto deploys from GitHub

---

## Option C: Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize
```bash
railway login
railway init
```

### Step 3: Add Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="your_uri"
railway variables set JWT_SECRET="your_secret"
railway variables set JWT_REFRESH_SECRET="your_refresh_secret"
```

### Step 4: Deploy
```bash
railway up
```

---

## Option D: Deploy to DigitalOcean/AWS/VPS

### Prerequisites
- Ubuntu 20.04+ server
- Root or sudo access
- Domain name (optional)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Upload Project
```bash
# On your local machine
scp -r "c:\Users\arjun\OneDrive\Documents\LANDING PAGE\FocusFlow" user@your-server-ip:/var/www/

# Or use Git
ssh user@your-server-ip
cd /var/www
git clone your-repository-url focusflow
cd focusflow
npm install --production
```

### Step 3: Configure PM2
```bash
cd /var/www/focusflow

# Create ecosystem file
pm2 init

# Edit ecosystem.config.js
module.exports = {
  apps: [{
    name: 'focusflow',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Start app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/focusflow

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/focusflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### 6. Post-Deployment Testing

#### Test Checklist
- [ ] Visit production URL
- [ ] Register new account
- [ ] Login works
- [ ] Create project
- [ ] Create tasks
- [ ] Complete tasks
- [ ] Complete project
- [ ] Check analytics
- [ ] Test on mobile device
- [ ] Test real-time updates
- [ ] Check all API endpoints

#### Monitor Logs
```bash
# Heroku
heroku logs --tail

# Render
Check dashboard logs

# PM2
pm2 logs focusflow

# Check errors
pm2 monit
```

---

### 7. Performance Optimization

#### Enable Gzip Compression
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

#### Add Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

#### Set Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

### 8. Monitoring & Maintenance

#### Setup Monitoring
- **Uptime Monitoring**: UptimeRobot (free)
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics
- **Performance**: New Relic or Datadog

#### Backup Strategy
```bash
# Automated MongoDB backups
# In MongoDB Atlas: Configure automatic backups

# Or manual backup
mongodump --uri="your_connection_string" --out=/backup/$(date +%Y%m%d)
```

---

### 9. Domain Configuration

#### DNS Settings
Point your domain to deployment:

**For Heroku:**
```
Type: CNAME
Host: www
Value: ajs-focusflow.herokuapp.com
```

**For VPS:**
```
Type: A
Host: @
Value: your_server_ip

Type: A
Host: www
Value: your_server_ip
```

---

### 10. Final Production Checklist

- [ ] Environment variables set
- [ ] Database indexes created
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] API URL updated in frontend
- [ ] Error logging enabled
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Gzip compression enabled
- [ ] PM2/Process manager running
- [ ] Nginx/Reverse proxy configured
- [ ] Backups scheduled
- [ ] Monitoring tools setup
- [ ] Performance tested
- [ ] Mobile tested
- [ ] All features working

---

## 🎉 You're Live!

### Share Your App
- Production URL: https://yourdomain.com
- API Documentation: https://yourdomain.com/api
- Status Page: Create one on status.io

### Support & Updates
```bash
# To update production
git pull
npm install
pm2 restart focusflow

# Or on Heroku
git push heroku master
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Can't connect to MongoDB
- Check IP whitelist in Atlas
- Verify connection string
- Check network access

**Issue**: 502 Bad Gateway
- Check if app is running: `pm2 status`
- Check Nginx config: `sudo nginx -t`
- Check port 3000: `sudo netstat -tlnp | grep 3000`

**Issue**: Environment variables not loading
- Check .env file exists
- Verify dotenv is loaded: `require('dotenv').config()`
- Check variable names match exactly

---

**Last Updated**: November 6, 2025  
**Version**: 1.0.0  
**Author**: AJ's FocusFlow Team
