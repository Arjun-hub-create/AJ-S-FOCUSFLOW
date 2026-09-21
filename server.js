const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection — normalize URI and retry (Render cold starts / Atlas latency)
mongoose.set('bufferCommands', false);

function normalizeMongoUri(uri) {
  if (!uri) return uri;
  let normalized = uri.trim();
  if (/\.mongodb\.net\/(\?|$)/.test(normalized)) {
    normalized = normalized.replace(/\.mongodb\.net\/(\?|$)/, '.mongodb.net/focusflow$1');
  } else if (/\.mongodb\.net$/.test(normalized)) {
    normalized = `${normalized}/focusflow`;
  }
  return normalized;
}

const mongoUri = normalizeMongoUri(process.env.MONGODB_URI);
const mongoOptions = {
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  maxPoolSize: 10
};

async function connectMongo(retryAttempt = 1) {
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set. Set it in Render Environment (same value as local .env).');
    return;
  }

  const hostHint = mongoUri.includes('@') ? mongoUri.split('@')[1].split('/')[0] : 'configured cluster';
  console.log(`🔄 MongoDB connection attempt ${retryAttempt} → ${hostHint}`);

  try {
    await mongoose.connect(mongoUri, mongoOptions);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error(`❌ MongoDB Connection Error (attempt ${retryAttempt}):`, err.message);
    console.error('Verify MONGODB_URI on Render, Atlas IP allowlist (0.0.0.0/0), and database user credentials.');
    const delayMs = Math.min(5000 * retryAttempt, 30000);
    setTimeout(() => connectMongo(retryAttempt + 1), delayMs);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected — reconnecting...');
  if (mongoose.connection.readyState === 0) {
    connectMongo();
  }
});

connectMongo();

// Make io accessible in routes
app.set('io', io);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/time', require('./routes/timeTracking'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.IO Real-time Events
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // User joins with their ID
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user-${userId}`);
    io.emit('user-status', { userId, status: 'online' });
    console.log(`✅ User ${userId} is online`);
  });

  // Join project room
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`📁 User joined project: ${projectId}`);
  });

  // Task updates
  socket.on('task-update', (data) => {
    io.to(`project-${data.projectId}`).emit('task-updated', data);
  });

  // Time tracking
  socket.on('timer-start', (data) => {
    io.to(`user-${data.userId}`).emit('timer-started', data);
  });

  socket.on('timer-stop', (data) => {
    io.to(`user-${data.userId}`).emit('timer-stopped', data);
  });

  // Comments
  socket.on('new-comment', (data) => {
    io.to(`project-${data.projectId}`).emit('comment-added', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-status', { userId: socket.userId, status: 'offline' });
      console.log(`❌ User ${socket.userId} is offline`);
    }
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
}).on('error', (err) => {
  console.error('❌ Server Error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
  process.exit(1);
});

module.exports = { io };
