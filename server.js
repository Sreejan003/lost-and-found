import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (HTML, CSS, JS) directly from project root
app.use(express.static(__dirname));

// Route fallbacks for clean URLs (without .html extension)
app.get(['/sign-in', '/sign-in.html'], (req, res) => res.redirect('/auth/sign-in.html'));
app.get(['/sign-up', '/sign-up.html'], (req, res) => res.redirect('/auth/sign-up.html'));
app.get(['/forgotpass', '/forgotpass.html', '/forgot-password'], (req, res) => res.redirect('/auth/forgot-password.html'));

app.get(['/admin', '/admin/'], (req, res) => res.redirect('/admin/dashboard.html'));
app.get(['/student', '/student/'], (req, res) => res.redirect('/student/index.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

