# 🧠 FocusFlow — Full Stack Productivity & Team Collaboration Platform

FocusFlow is a modern full-stack web application for **remote teams** to manage tasks, track time, collaborate in real time, and analyze productivity — built using **HTML, CSS, JavaScript**, **Node.js**, **Express**, and **MongoDB**.

![FocusFlow](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node](https://img.shields.io/badge/Node.js-v18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-v6+-green)

---

## 🚀 Features

### ✅ Implemented Core Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Secure password hashing with bcrypt
  - Role-based access control (admin/member)
  - Protected routes and session management

- 🗂 **Projects & Task Management**
  - Create and manage multiple projects
  - Kanban-style boards with customizable lists
  - Tasks with title, description, assignees, due dates
  - Task prioritization (low, medium, high, urgent)
  - Status tracking (todo, in-progress, done)
  - Labels and comments on tasks

- ⏱ **Time Tracking**
  - Start/stop timers for tasks
  - Track time per user and project
  - Automatic duration calculation
  - Time entry history

- 💬 **Real-Time Collaboration**
  - Socket.IO powered real-time updates
  - Live task updates across clients
  - User presence (online/offline status)
  - Real-time comments

- 📊 **Analytics Dashboard**
  - Task completion metrics
  - Time tracking statistics
  - Priority distribution charts
  - Project-level analytics
  - User productivity insights

- 🎨 **Modern UI/UX**
  - Stunning cyan/black theme with particle effects
  - Responsive design (mobile & desktop)
  - Smooth animations and transitions
  - Intuitive navigation

---

## 🛠 Tech Stack

### Frontend
- **HTML5, CSS3** - Semantic markup and modern styling
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - Real-time communication
- **Chart.js** - Data visualization
- **Particles.js** - Animated background effects
- **Font Awesome** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - WebSocket library for real-time features
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing
- **Express Validator** - Input validation

---

## 📁 Project Structure

```
FocusFlow/
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── Project.js
│   ├── Task.js
│   └── TimeEntry.js
├── routes/              # Express routes
│   ├── auth.js
│   ├── projects.js
│   ├── tasks.js
│   ├── timeTracking.js
│   ├── analytics.js
│   └── users.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   └── validator.js
├── public/              # Frontend files
│   ├── index.html       # Login page
│   ├── register.html    # Registration page
│   ├── dashboard.html   # Main dashboard
│   ├── projects.html    # Projects view
│   ├── analytics.html   # Analytics page
│   ├── css/
│   │   ├── style.css           # Base styles
│   │   └── dashboard.css       # Dashboard styles
│   └── js/
│       ├── api.js              # API client
│       ├── auth.js             # Login logic
│       ├── register.js         # Registration logic
│       ├── dashboard.js        # Dashboard logic
│       ├── projects.js         # Projects logic
│       ├── analytics.js        # Analytics logic
│       ├── timer.js            # Timer functionality
│       ├── socket.js           # Socket.IO client
│       └── particles-config.js # Particles configuration
├── server.js            # Express server & Socket.IO
├── package.json         # Dependencies
├── .env.example         # Environment variables template
├── .gitignore
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/focusflow.git
cd focusflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/focusflow
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=development
```

4. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Run the application**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

6. **Access the application**
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

---

## 🎯 Usage

### Creating an Account

1. Navigate to http://localhost:5000/register
2. Enter your name, email, and password
3. Click "CREATE ACCOUNT"
4. You'll be redirected to the dashboard

### Creating a Project

1. Click "New Project" on the dashboard or projects page
2. Enter project name, description, and choose a color
3. Click "Create Project"
4. Project appears in your projects list

### Managing Tasks

1. Click "New Task" button
2. Fill in task details (title, description, project, priority, due date)
3. Click "Create Task"
4. Tasks appear in the recent tasks list
5. Click checkbox to mark as complete

### Time Tracking

1. Click the timer icon in the top bar
2. Select a task to track time for
3. Click play to start timer
4. Click stop to end timer
5. View time entries in Analytics page

### Real-Time Collaboration

- All task updates appear instantly for all team members
- See who's online in real-time
- Comments sync across all connected clients

---

## 🔌 API Documentation

### Authentication

**POST /api/auth/register**
- Register new user
- Body: `{ name, email, password }`

**POST /api/auth/login**
- Login user
- Body: `{ email, password }`

**POST /api/auth/logout**
- Logout user (requires auth)

**GET /api/auth/me**
- Get current user (requires auth)

### Projects

**GET /api/projects**
- Get all user's projects (requires auth)

**POST /api/projects**
- Create new project (requires auth)
- Body: `{ name, description, color }`

**GET /api/projects/:id**
- Get single project (requires auth)

**PUT /api/projects/:id**
- Update project (requires auth)

**DELETE /api/projects/:id**
- Delete project (requires auth)

### Tasks

**GET /api/tasks**
- Get all tasks (requires auth)
- Query params: `project`, `status`, `assignee`, `priority`

**POST /api/tasks**
- Create new task (requires auth)
- Body: `{ title, description, project, assignees, priority, dueDate }`

**GET /api/tasks/:id**
- Get single task (requires auth)

**PUT /api/tasks/:id**
- Update task (requires auth)

**DELETE /api/tasks/:id**
- Delete task (requires auth)

### Time Tracking

**POST /api/time/start**
- Start timer (requires auth)
- Body: `{ taskId, description }`

**POST /api/time/stop/:id**
- Stop timer (requires auth)

**GET /api/time**
- Get time entries (requires auth)
- Query params: `project`, `task`, `startDate`, `endDate`

**GET /api/time/active**
- Get active timer (requires auth)

### Analytics

**GET /api/analytics/overview**
- Get overall analytics (requires auth)
- Query params: `startDate`, `endDate`, `projectId`

**GET /api/analytics/project/:id**
- Get project-specific analytics (requires auth)

---

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication
- Refresh token rotation
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Secure HTTP headers

---

## 🎨 Design System

### Colors
- Primary: `#00d4ff` (Cyan)
- Background: `#000000` (Black)
- Text: `#00d4ff` (Cyan variants)
- Success: `#00ff88` (Green)
- Warning: `#ffc107` (Yellow)
- Danger: `#ff5757` (Red)

### Typography
- Headings: **Cinzel** (serif)
- Body: **Poppins** (sans-serif)

---

## 🚧 Future Enhancements

- [ ] Drag & drop task reordering
- [ ] File attachments with Cloudinary
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Dark/Light theme toggle
- [ ] Advanced filtering and search
- [ ] Export reports to PDF/CSV
- [ ] Mobile app (React Native)
- [ ] Multi-organization support
- [ ] Audit logs

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ by Your Name

---

## 🙏 Acknowledgments

- Particles.js for amazing background effects
- Chart.js for data visualization
- Socket.IO for real-time capabilities
- Font Awesome for icons
- MongoDB team for excellent documentation

---

## 📞 Support

For support, email support@focusflow.com or open an issue on GitHub.

---

**⭐ Star this repo if you find it helpful!**
