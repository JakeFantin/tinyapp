//// Dependencies ////

const express = require("express"); // http library
const cookieSession = require('cookie-session'); // cookie encryption library
const bcrypt = require('bcrypt'); // password hashing library
const bodyParser = require('body-parser'); // POST request parsing library (into JavaScript objects)
const { confirmUser, userURLs, getUserByEmail } = require('./helpers.js'); // Helper functions

//// Global Variables and Their Specifications ////
const PORT = 8080;

const app = express();
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use(bodyParser.urlencoded({ extended: true }));

//// Database ////

const urlDatabase = {};

const users = {};

//// Minor Helping Function ////

const generateRandomString = function() { //ID generator - 6 random alphanumeric characters
  let randomString = '';
  let alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZacdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomString += alphaNum[Math.floor(Math.random() * alphaNum.length)];
  }
  return randomString;
};

//// Server Listener ////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

//// GET routes ////

app.get("/urls.json", (req, res) => { //returns the urlDatabase as a json
  res.json(urlDatabase);
});

app.get('/', (req, res) => { //redirects to the login page or the urls if logged in
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


app.get('/urls', (req, res) => { //home page, shows shortURLS, their longURLs, and options to delete and edit
  let templateVars = { login: false }; //if not logged in, the login flag will render an appropiate message to the user
  if (req.session.userId) { //if logged in, displays the table of URLs, empty or not.
    templateVars = { ...templateVars, ...users[req.session.userId], urls: userURLs(req.session.userId, urlDatabase) };
    templateVars.login = true;
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => { //renders page to make new shortURL, requires user to be logged in.
  let templateVars = {}; //starts empty so any added functionality can be worked in without disturbing preexisting code
  if (req.session.userId) { //checks to see if user is logged in before allowing access to page
    templateVars = { ...templateVars, ...users[req.session.userId] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => { //renders the urls_show page which displays the page of a shortURL
  if (!urlDatabase[req.params.shortURL]) { //if shortURL does not exist, throw an error
    res.render('error_display', { ...users[req.session.userId], statusCode: 404, message: "This link does not exist!" });
  } else {
    let templateVars = {}; //templateVars starts empty
    if (req.session.userId) { //need to be logged in
      templateVars = { ...templateVars, ...users[req.session.userId] }; //adds user info to templateVars if logged in
      let goodURLs = userURLs(req.session.userId, urlDatabase); //fetches an object containing the shortURLS owned by the user
      if (goodURLs[req.params.shortURL]) { //the user needs to also own the URL
        templateVars = { ...templateVars, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
        res.render('urls_show', templateVars);
      } else {
        res.render('error_display', { ...templateVars, statusCode: 403, message: "This URL belongs to someone else." }); //differs from the error below in message and that it contains the user info for the header
      }
    } else {
      res.render('error_display', { ...templateVars, statusCode: 403, message: "You can log in to make your own URLs." });
    }
  }
});

app.get("/u/:shortURL", (req, res) => { //when accessed, finds shortURL in database and redirects the user to the long version
  if (!urlDatabase[req.params.shortURL]) { //if shortURL does not exist, return an error
    let templateVars = {};
    if (req.session.userID) {
      templateVars = { ...templateVars, ...users[req.session.userId] };
    }
    res.render('error_display', { ...templateVars, statusCode: 404, message: "This link does not exist!" });
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get('/login', (req, res) => { //loads the template user_login, if already logged in just returns to the urls page
  let templateVars = {};
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.render("user_login", templateVars);
  }
});

app.get('/register', (req, res) => { //renders user_registration page, if already logged in, redirects to an error page
  if (req.session.userId) {
    res.render('error_display', { ...users[req.session.userId], statusCode: 403, message: "This action is.. FORBIDDEN." }); //shortened error call version
  } else {
    res.render('user_registration');
  }
});

//// POST routes ////

app.post('/urls', (req, res) => { //makes new shortURL if user is logged in and then brings that user to the shortURL's page
  if (req.session.userId) { //if user is not logged in, cannot make a shortURL
    let smallURL = undefined;
    do {
      smallURL = generateRandomString(); //helper function to generate the shortURL
    } while (urlDatabase[smallURL]); //if shortURL already exists, try again
    urlDatabase[smallURL] = { //set new shortURL into the database with the userID and submitted longURL
      longURL: req.body.longURL,
      userID: req.session.userId,
    };
    res.redirect(`/urls/${smallURL}`);
  } else {
    res.render('error_display', { statusCode: 403, message: "This action is.. FORBIDDEN." });
  }
});

app.post("/urls/:id", (req, res) => { //changes the longURL associated with a shortURL IF the user is logged in AND owns the url.
  if (!req.session.userId) { //if user is not logged in, cannot change
    res.render('error_display', { statusCode: 403, message: "This action is.. FORBIDDEN." });
  } else {
    let goodURLs = userURLs(req.session.userId, urlDatabase); //fetches an object full of smallURLs that belong to the userId
    if (goodURLs[req.params.id]) { //if user owns the smallURL, they may change it
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect(`/urls/${req.params.id}`); //reloads the page so it displays the new longURL
    } else {
      res.render('error_display', { ...users[req.session.userId], statusCode: 403, message: "This action is.. FORBIDDEN." });
    }
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { //deletes short URL from urlDatabase if the user is logged in and owns the smallURL
  if (!req.session.userId) { //if user is not logged in, cannot delete
    res.render('error_display', { statusCode: 403, message: "This action is.. FORBIDDEN." });
  } else {
    let goodURLs = userURLs(req.session.userId, urlDatabase); //fetches an object full of smallURLs that belong to the userId
    if (goodURLs[req.params.shortURL]) { //if user owns the smallURL, they may delete it
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    } else {
      res.render('error_display', { statusCode: 403, message: "This action is.. FORBIDDEN." });
    }
  }
});

app.post('/login', (req, res) => { //login with validaty checks that re-render the page with on-page errors
  let templateVars = {};
  if (req.body.email === '' || req.body.password === '') { //first validity check to make sure the fields are filled
    res.status(400);
    templateVars = { ...templateVars, errorId: 3, error: 'Needs an email or password.' };//errorId and error were put in to match the errors returned from the login authenticator, although i'm not a fan of it returning '3'.
    res.render('user_login', templateVars);
  } else {
    const code = confirmUser(req.body.email, req.body.password, users); //uses function from helper.js to check that email and password provided correspond with a user in the database
    if (code.id === 0) { //code zero is success, and the message is the userID that is stored in a cookie
      req.session.userId = code.message;
      res.redirect('/urls'); //successful login redirects to the urls page
    } else { //code one is an error that the email did not match out servers
      res.status(403);
      templateVars = { ...templateVars, errorId: code.id, error: code.message }; //send the error code to the view along with the error message
      res.render('user_login', templateVars);
    }
  }
});

app.post('/logout', (req, res) => { //clears session login cookies, returns to home page, was constructed anticipating doing unique visit cookie implementation
  req.session.userId = undefined;
  res.redirect('/urls');
});

app.post('/register', (req, res) => { //registration with validaty checks that re-render the page with on-page errors
  let templateVars = {};
  if (req.body.email === '' || req.body.password === '') { //checks for empty entry fields
    res.status(400);
    templateVars = { ...templateVars, error: 'Needs an email or password.' };
    res.render('user_registration', templateVars);
  } else if (getUserByEmail(req.body.email, users)) { //changed the name/interals to meet the functionality of the required 'helper' function, now relies on truthiness of an object return and the falsiness of undefined return, my original helper function returned true/false
    res.status(400);
    templateVars = { ...templateVars, error: 'Email exists!' };
    res.render('user_registration', templateVars);
  } else {
    const userID = generateRandomString(); //in file helper function used here
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) //hashes password using bcrypt library
    };
    req.session.userId = userID;
    res.redirect('/urls');
  }
});