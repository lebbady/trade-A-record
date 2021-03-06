'use strict';

require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

// - routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const tradesRouter = require('./routes/trades');
const recordsRouter = require('./routes/records');

const app = express();

// -- connect to mongoose
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI, {
  keepAlive: true,
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE
});

// hbs helpers

hbs.registerHelper('pending', function (conditional, options) {
  if (conditional === 'pending') {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hbs.registerHelper('approved', function (conditional, options) {
  if (conditional === 'approved') {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hbs.registerHelper('rejected', function (conditional, options) {
  if (conditional === 'rejected') {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hbs.registerHelper('notAvailable', function (conditional, options) {
  if (conditional === 'no longer available') {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// hbs.registerHelper('approver', function (conditional, options) {
//   const user = req.session.currentUser;
//   if (conditional === user._id) {
//     return options.fn(this);
//   } else {
//     return options.inverse(this);
//   }
// });

// hbs.registerHelper('empty', function (conditional, options) {
//   if (conditional.length < 1) {
//     return options.fn(this);
//   } else {
//     return options.inverse(this);
//   }
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  }),
  secret: 'some-string',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  app.locals.currentUser = req.session.currentUser;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/trades', tradesRouter);
app.use('/profile', profileRouter);
app.use('/records', recordsRouter);

app.use((req, res, next) => {
  res.status(404);
  res.render('not-found');
});

app.use((err, req, res, next) => {
  console.error('ERROR', req.method, req.path, err);

  if (!res.headersSent) {
    res.status(500);
    res.render('error');
  }
});

module.exports = app;
