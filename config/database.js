const mongoose = require('mongoose');

let lastConnectError = null;
let connectPromise = null;

function cleanMongoUri(raw) {
  if (!raw) return null;
  let uri = String(raw).trim();
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.slice('MONGODB_URI='.length).trim();
  }
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }
  return uri || null;
}

const mongoUri = cleanMongoUri(process.env.MONGODB_URI);

const mongoOptions = {
  dbName: 'focusflow',
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  maxPoolSize: 10,
  // Render/Heroku sometimes fail mongodb+srv over IPv6
  family: 4
};

function getMongoHostHint() {
  if (!mongoUri) return 'not configured';
  if (!mongoUri.includes('@')) return 'configured (local/custom)';
  return mongoUri.split('@')[1].split('/')[0].split('?')[0];
}

async function connectMongo() {
  if (!mongoUri) {
    lastConnectError = new Error('MONGODB_URI is not set');
    console.error('❌ MONGODB_URI is not set on this server.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectPromise) {
    return connectPromise;
  }

  console.log(`🔄 Connecting to MongoDB → ${getMongoHostHint()}`);

  connectPromise = mongoose
    .connect(mongoUri, mongoOptions)
    .then(() => {
      lastConnectError = null;
      console.log('✅ MongoDB Connected Successfully');
      return true;
    })
    .catch((err) => {
      lastConnectError = err;
      console.error('❌ MongoDB Connection Error:', err.message);
      return false;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

function scheduleReconnect() {
  if (!mongoUri) return;
  setTimeout(() => {
    if (mongoose.connection.readyState !== 1) {
      connectMongo();
    }
  }, 5000);
}

function waitForDatabase(timeoutMs = 20000) {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      mongoose.connection.off('connected', onConnected);
      mongoose.connection.off('error', onError);
      resolve(ok);
    };

    const onConnected = () => finish(true);
    const onError = () => finish(false);

    const timer = setTimeout(() => finish(mongoose.connection.readyState === 1), timeoutMs);

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);

    connectMongo().then((ok) => {
      if (ok) finish(true);
    });
  });
}

function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    configured: Boolean(mongoUri),
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState] || 'unknown',
    host: getMongoHostHint(),
    lastError: lastConnectError ? lastConnectError.message : null
  };
}

function initDatabase() {
  mongoose.set('bufferCommands', false);

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected — scheduling reconnect');
    scheduleReconnect();
  });

  connectMongo();
}

module.exports = {
  initDatabase,
  waitForDatabase,
  getDatabaseStatus,
  connectMongo
};
