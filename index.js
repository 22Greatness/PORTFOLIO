// backend/index.js
const express = require('express');
const Joi     = require('joi');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// allow CORS to your dev server + production URL
app.use(cors({
  origin: [
    'http://localhost:5500',               // if you use Live Server on port 5500
    'http://localhost:3000',               // sometimes useful in dev
    'https://your-frontend.netlify.app'    // your Netlify/Vercel URL
  ]
}));

// parse JSON bodies
app.use(express.json());

// index.js (at the top, after your other app.use calls)

const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// ensure root / also sends index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});
// you can also catch-all to let client-side routing work:
// app.get('*', (req,res)=>res.sendFile(path.join(FRONTEND_PATH,'index.html')));

// ─── Validation schema ───────────────────────────────────────────
// (the rest of your code goes here, unchanged)
const contactSchema = Joi.object({
  name:    Joi.string().min(2).max(100).required(),
  email:   Joi.string().email().required(),
  phone:   Joi.string().pattern(/^[0-9+\-() ]+$/).required(),
  message: Joi.string().min(5).max(2000).required(),
});

const dbFile = path.join(__dirname, 'contacts.json');

app.post('/api/contact', (req, res) => {
  const { error, value } = contactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 'error', error: error.details[0].message });
  }
  const entry = { ...value, date: new Date().toISOString() };
  let all = [];
  if (fs.existsSync(dbFile)) {
    try { all = JSON.parse(fs.readFileSync(dbFile)); } catch {}
  }
  all.push(entry);
  fs.writeFileSync(dbFile, JSON.stringify(all, null, 2));
  console.log('✔ New contact saved:', entry);
  res.json({ status: 'ok' });
});

// (You can remove your old “if production” block now if you like)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
