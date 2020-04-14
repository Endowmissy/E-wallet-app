import express from "express";
import logger from "morgan";
import session from "express-session";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "./config/passport";
import expressValidator from "express-validator";
import { PORT, SESSION_SECRET, MONGODB_URL } from "./config/constants";
import index from "./routes/index";
import transactions from "./routes/transactions";
import users from "./routes/user";
import account from "./routes/account";
const MongoStore = require("connect-mongo")(session);

const app = express();

//Load views directory and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Mongoose options
const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  };
  
  mongoose
    .connect(MONGODB_URL, options)
    .then(() => console.log(`Database connection established`))
    .catch((err) => console.error(`There was an error connecting to database, the err is ${err}`));

app.use(helmet());
app.use(logger("dev"));
app.use(express.json({ limit: "900mb" }));
app.use(express.urlencoded({ extended: false, limit: "900mb" }));
app.use(expressValidator());
app.use(cookieParser());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1209600000,
    },
    store: new MongoStore({
      url: MONGODB_URL,
      autoReconnect: true,
    }),
  }),
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set the public folder
app.use(express.static(path.join(__dirname, "public")));

app.use(index);
app.use(transactions);
app.use(users);
app.use(account);

const port = PORT || 5000;

app.listen(port, () => console.log("App Listening on port: " + port));

//Error handling
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
  
export default app;