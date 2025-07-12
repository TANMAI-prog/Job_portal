const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/register');
});

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const appRoutes = require('./routes/applications');



app.use('/', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', appRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




app.listen(3000, () => console.log("Server running on http://localhost:3000"));
