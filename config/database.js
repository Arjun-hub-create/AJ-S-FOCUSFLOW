const mongoose = require('mongoose');

let lastConnectError = null;
let connectPromise = null;

function inspectMongoUri(uri) {
  const info = {
    username: null,
    passwordPlaceholder: false,
    passwordLength: 0
  };
  if (!uri) return info;

  const match = uri.match(/^mongodb(?:\+srv)?:\/\/([^/@]+)@/i);
  if (!match) return info;

  const userinfo = match[1];
  const colon = userinfo.indexOf(':');
  if (colon === -1) {
    info.username = safeDecode(userinfo);
    return info;
  }

  info.username = safeDecode(userinfo.slice(0, colon));
  const password = userinfo.slice(colon + 1);
  const decoded = safeDecode(password);
  info.passwordLength = decoded.length;
  info.passwordPlaceholder = /<[^>]*password[^>]*>|YOUR_DB_PASSWORD|db_password/i.test(decoded);
  return info;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodeCredentialsInUri(uri) {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^/@]+)@(.+)$/i);
  if (!match) return uri;

  const [, protocol, userinfo, rest] = match;
  const colon = userinfo.indexOf(':');
  if (colon === -1) {
    return `${protocol}${encodeURIComponent(safeDecode(userinfo))}@${rest}`;
  }

  const user = encodeURIComponent(safeDecode(userinfo.slice(0, colon)));
  const password = encodeURIComponent(safeDecode(userinfo.slice(colon + 1)));
  return `${protocol}${user}:${password}@${rest}`;
}

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
  if (!uri) return null;
  return encodeCredentialsInUri(uri);
}

function buildMongoUriFromParts() {
  const user = process.env.MONGODB_USER?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const host = process.env.MONGODB_HOST?.trim();

  if (!user || !password || !host) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `mongodb+srv://${encodedUser}:${encodedPassword}@${host}/?retryWrites=true&w=majority`;
}

function resolveMongoUri() {
  const fromUri = cleanMongoUri(process.env.MONGODB_URI);
  const fromParts = buildMongoUriFromParts();

  // Prefer full MONGODB_URI when set (Render default). Split vars are fallback only.
  if (fromUri) {
    return { uri: fromUri, source: 'mongodb_uri' };
  }
  if (fromParts) {
    return { uri: fromParts, source: 'env_parts' };
  }
  return { uri: null, source: 'none' };
}

const { uri: mongoUri, source: mongoUriSource } = resolveMongoUri();
const mongoUriInfo = inspectMongoUri(mongoUri);

const mongoOptions = {
  dbName: 'focusflow',
  authSource: 'admin',
  retryWrites: true,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  maxPoolSize: 10,
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

  if (mongoUriInfo.passwordPlaceholder) {
    lastConnectError = new Error('MONGODB_URI still contains the placeholder <db_password>. Replace it with your real Atlas password on Render.');
    console.error('❌', lastConnectError.message);
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
    .catch(async (err) => {
      lastConnectError = err;
      console.error('❌ MongoDB Connection Error:', err.message);
      try {
        await mongoose.disconnect();
      } catch (_) {
        /* ignore */
      }
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
      else finish(false);
    });
  });
}

function getConnectionHelpMessage() {
  if (!mongoUri) {
    return 'MONGODB_URI is not set on Render. Add your Atlas connection string under Environment variables.';
  }

  const err = lastConnectError?.message || '';

  if (mongoUriInfo.passwordPlaceholder) {
    return 'Render MONGODB_URI still has the placeholder <db_password>. Paste the real Atlas password in place of <db_password>, save, and redeploy.';
  }

  if (/bad auth|authentication failed/i.test(err)) {
    const via = mongoUriSource === 'env_parts'
      ? 'Render is using MONGODB_USER / MONGODB_PASSWORD / MONGODB_HOST (not MONGODB_URI).'
      : 'Render is using MONGODB_URI.';
    return `${via} Atlas rejected user "${mongoUriInfo.username || 'unknown'}". The cluster host is correct (${getMongoHostHint()}), but the password in Render does not match Database Access. Reset the password in Atlas, paste the FULL new mongodb+srv:// string into Render MONGODB_URI with the real password (not <db_password>), delete MONGODB_USER/MONGODB_PASSWORD/MONGODB_HOST, Save, then Manual Deploy.`;
  }

  if (/ENOTFOUND|querySrv/i.test(err)) {
    return `MongoDB cluster "${getMongoHostHint()}" was not found. In Atlas, open your active cluster → Connect → copy a fresh connection string into Render.`;
  }

  if (err) {
    return `Database connection failed: ${err}`;
  }

  return 'Database is not ready yet. Wait a few seconds after the server wakes up, then try again.';
}

function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    configured: Boolean(mongoUri),
    credentialSource: mongoUriSource,
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState] || 'unknown',
    host: getMongoHostHint(),
    username: mongoUriInfo.username,
    passwordPlaceholder: mongoUriInfo.passwordPlaceholder,
    passwordLength: mongoUriInfo.passwordLength,
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
  getConnectionHelpMessage,
  connectMongo
};
