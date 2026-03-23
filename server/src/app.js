require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const computeRoutes = require('./routes/computeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const participationRoutes = require('./routes/participationRoutes');
const llmRoutes = require('./routes/llmRoutes');
const { setupWebSocket } = require('./websocket');

const app = express();

// Trust proxy (required behind App Platform / load balancer)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/compute', computeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/participate', participationRoutes);
app.use('/api/v1/llm', llmRoutes);

// SSO endpoint (top-level, not under /api/v1)
const authController = require('./controllers/authController');
app.get('/auth/sso', authController.ssoLogin);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: {
      SPACES_ENDPOINT: process.env.SPACES_ENDPOINT ? 'SET' : 'MISSING',
      SPACES_KEY: process.env.SPACES_KEY ? 'SET' : 'MISSING',
      SPACES_SECRET: process.env.SPACES_SECRET ? 'SET' : 'MISSING',
      SPACES_BUCKET: process.env.SPACES_BUCKET ? 'SET' : 'MISSING',
      SPACES_REGION: process.env.SPACES_REGION ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
      LLM_ENABLED: process.env.LLM_ENABLED !== 'false' && process.env.OPENAI_API_KEY ? 'true' : 'false',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// Serve React client build (production)
const clientBuild = path.resolve(__dirname, '../../client/build');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`AHP Studio server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Attach WebSocket server
setupWebSocket(server);

module.exports = app;
