const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure multer for resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Render apply form
router.get('/apply/:jobId', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'Job Seeker') {
    return res.redirect('/login');
  }

  const jobId = req.params.jobId;
  res.render('apply_job', { jobId });
});

// Handle shortlist button
router.post('/shortlist/:id', (req, res) => {
  const applicationId = req.params.id;

  const query = `UPDATE Applications SET status = 'Shortlisted' WHERE app_id = ?`;


  db.query(query, [applicationId], (err) => {
    if (err) return res.send('Error shortlisting application: ' + err.message);
    res.redirect('/applications/view'); // Redirect back to applications view
  });
});

// Handle form submission
router.post('/apply/:jobId', upload.single('resume'), (req, res) => {
  const jobId = req.params.jobId;
  const seekerId = req.session.user.id;
  const resumePath = req.file.path;
  const applyDate = new Date();

  const query = `INSERT INTO Applications (job_id, seeker_id, resume, apply_date)
                 VALUES (?, ?, ?, ?)`;

  db.query(query, [jobId, seekerId, resumePath, applyDate], (err) => {
    if (err) return res.send('Error: ' + err.message);
    res.redirect('/dashboard');
  });
});

// (Optional) Employer views applications
router.get('/view', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'Employer') {
    return res.redirect('/login');
  }

  const employerId = req.session.user.id;

  const query = `
    SELECT Applications.*, Users.name AS seeker_name, Jobs.title AS job_title
    FROM Applications
    JOIN Jobs ON Applications.job_id = Jobs.job_id
    JOIN Users ON Applications.seeker_id = Users.user_id
    WHERE Jobs.employer_id = ?
  `;

  db.query(query, [employerId], (err, results) => {
    if (err) return res.send('Error: ' + err.message);
    res.render('view_applications', { applications: results });
  });
});

module.exports = router;
