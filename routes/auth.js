const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.render('register', { error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
  }

  // Check if email already exists
  db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.send('Database error');
    if (results.length > 0) {
      return res.render('register', { error: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertQuery = 'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [name, email, hashedPassword, role], (err, result) => {
      if (err) return res.send('Error: ' + err.message);

      // ✅ Auto-login: set session
      const userId = result.insertId;
      req.session.user = {
        id: userId,
        name,
        role
      };

      res.redirect('/dashboard'); // Redirect to dashboard after register
    });
  });
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login User
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.send('User not found');

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.send('Invalid credentials');

    req.session.user = {
      id: user.user_id,
      name: user.name,
      role: user.role
    };

    res.redirect('/dashboard');
  });
});

// Dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { user: req.session.user });
});

module.exports = router;
