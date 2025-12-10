const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const siteRoutes = require('./routes/siteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
