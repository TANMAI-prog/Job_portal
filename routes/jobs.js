const express = require('express');
const router = express.Router();
const db = require('../db');

// Render job post form (for Employers)
router.get('/post', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'Employer') {
    return res.redirect('/login');
  }
  res.render('post_job');
});

// Handle job post submission
router.post('/post', (req, res) => {
  const { title, description, location } = req.body;
  const employer_id = req.session.user.id;
  const posted_date = new Date();

  const query = `INSERT INTO Jobs (employer_id, title, description, location, posted_date)
                 VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [employer_id, title, description, location, posted_date], (err) => {
    if (err) return res.send('Error: ' + err.message);
    res.redirect('/dashboard');
  });
});

// List all jobs (for job seekers)
// Updated job list route with search
router.get('/list', (req, res) => {
  const { title, location } = req.query;

  let baseQuery = `
    SELECT Jobs.*, Users.name AS employer_name
    FROM Jobs
    JOIN Users ON Jobs.employer_id = Users.user_id
    WHERE 1 = 1
  `;

  const params = [];

  if (title) {
    baseQuery += ' AND Jobs.title LIKE ?';
    params.push('%' + title + '%');
  }

  if (location) {
    baseQuery += ' AND Jobs.location LIKE ?';
    params.push('%' + location + '%');
  }

  db.query(baseQuery, params, (err, results) => {
    if (err) return res.send('Error fetching jobs.');
    res.render('job_list', { jobs: results, title: title || '', location: location || '' });
  });
});

module.exports = router;
