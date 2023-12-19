const express = require('express');
require('dotenv').config();
const cors = require('cors');
const API = require('./api');
const http = require("http");
const DB_CONNECT = require('./config/dbConnect');
const cookieSession = require('cookie-session');
const { notFound, errorHandler } = require('./middlewares/errorHandling');
const { log } = require('./middlewares/log');
const path = require('path');
const PORT = process.env.PORT;
const {googleLogin,facebookLogin} = require('./controller/AuthController');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');

const app = express();
// DB_CONNECT();

const server = http.createServer(app);
// 


app.use(session({
    secret: 'secret', // A secret key for signing the session ID cookie
    resave: false, // Avoids resaving sessions that haven't been modified
    saveUninitialized: false, // Doesn't save uninitialized sessions
    // store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL })
    // Additional options can be added as needed
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Set the view engine to ejs
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));
// app.use('/uploads', express.static('uploads'));

// app.use(cookieSession({
//     name: 'session',
//     keys: [process.env.COOKIE_KEY],
//     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
// }));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


// Google Strategy
passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://whatsgud.cyclic.app/api/auth/google/callback"
  },
  googleLogin // Your callback function
));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "https://whatsgud.cyclic.app/api/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name','photos']
},
facebookLogin // Your callback function
));


app.use(cors({ origin: "*", credentials: true }));
app.get('/', (req, res) => res.json({ message: 'Welcome to the whats-gud' }));

app.use(log);
new API(app).registerGroups();
app.use(notFound);
app.use(errorHandler);
DB_CONNECT().then(()=>{
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}/`);
});
})

