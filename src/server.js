import express from 'express';
import cors from 'cors';
import path from 'path';
import facilityRoutes from './routes/facilityRoutes.js';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve your static frontend (project places assets under src/public)
app.use(express.static(path.join(process.cwd(), 'src', 'public')));

// API routes
// Facility routes: mounted at /api/sites, sub-routes defined in facilityRoutes
app.use('/api/sites', facilityRoutes);

// fallback for SPA
// fallback for SPA
app.use((req, res) => {
  const fallback = path.join(process.cwd(), 'src', 'public', 'socialfacilities.html');
  if (fs.existsSync(fallback)) {
    res.sendFile(fallback);
  } else {
    res.status(404).send('Not found');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
