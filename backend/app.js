var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const dotenv = require('dotenv');
dotenv.config();

var app = express();
var port = process.env.PORT;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tracks', indexRouter);
app.use('/albums', indexRouter);
app.use('/playlists', indexRouter);

app.get('/search', (req, res) => {
  // мб будем брать отсюда id и уже через роуты отдавать фулл обьекты
  res.json({
    tracks: db.query('SELECT * FROM tracks WHERE name ILIKE ?', [`%${req.query.q}%`]),
    albums: db.query('SELECT * FROM albums WHERE name ILIKE ?', [`%${req.query.q}%`]),
    playlists: db.query('SELECT * FROM playlists WHERE name ILIKE ?', [`%${req.query.q}%`]),
    users: db.query('SELECT * FROM users WHERE name ILIKE ?', [`%${req.query.q}%`])
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.listen(port, function () {
  console.log("Server is running on port " + port);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
