require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// Middleware
// CLIENT_ORIGIN can be a single URL or a comma-separated list (e.g. your
// local dev server + your deployed frontend). Leave it unset to allow all
// origins, which is fine here since we authenticate with a Bearer token
// (not cookies), so there's no CSRF/credentials risk from a permissive CORS policy.
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length
    ? (origin, callback) => {
        // Allow non-browser tools (curl, Postman, server-to-server) which send no Origin header
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    : true,
}));
app.use(express.json({ limit: '8mb' })); // cover images can arrive as base64 data URLs

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blog App API is running.' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
