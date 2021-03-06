var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var GITHUB_CLIENT_ID = 'f756aXXXXXXXXXX2014b'; // 偽のクライアントID
var GITHUB_CLIENT_SECRET = '0fc57f666XXXXXXXXXXXXXXXX8c131859b64f30'; // 偽のクライアントシークレット

// 認証されたユーザー情報の保存
passport.serializeUser(function (user, done) {
  done(null, user);
});

// 保存されたデータをユーザーの情報として読み出す
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// GitHubを利用した認証の戦略オブジェクトの設定
passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:8000/auth/github/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  )
);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var photosRouter = require('./routes/photos');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// express-sessionとpassportでセッションを利用する
app.use(
  session({ 
    secret: '14a65b44d7948b46', // 秘密鍵の文字列
    resave: false, // セッションを必ずストアに保存しない
    saveUninitialized: false // セッションが初期化されていなくても保存しない
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/photos', photosRouter);

// パスに対するHTTPリクエストのハンドラの登録
app.get('/auth/github', 
  // GitHubへの認証を行うための処理
  passport.authenticate('github', { scope: ['user:email'] }), // スコープをuser:emailとして、認証を行う
  function (req, res) { // リクエストが行われた際の処理
});

// GitHubが利用者の許可に対する問い合わせの結果を送るパスのハンドラを登録
app.get('/auth/github/callback',
  // 認証が失敗した際には、再度ログインを促す
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
    }
);

// /loginにGETでアクセスがあった時、ログインページを描画する
app.get('/login', function (req, res) {
  res.render('login');
});

// /logoutにGETでアクセスがあった時、ログアウトを実施する
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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
