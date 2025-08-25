const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
const kpiRoutes = require('./routes/kpis');
const gruposRoutes = require('./routes/grupos');
const estadosRoutes = require('./routes/estados');
const indicadoresRoutes = require('./routes/indicadores');
const supervisionsRoutes = require('./routes/supervisions');
const mapRoutes = require('./routes/map');

app.use('/api/kpis', kpiRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/estados', estadosRoutes);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/supervisions', supervisionsRoutes);
app.use('/api/map', mapRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 El Pollo Loco Supervision API ready at http://localhost:${PORT}`);
});