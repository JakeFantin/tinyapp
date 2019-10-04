const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser =require('body-parser');
const { findUser, userURLs, getUserByEmail } = require('./helpers.js');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));


app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {};

const users = {};

const generateRandomString = function() { //ID generator - 6 characters
  let randomString = '';
  let alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZacdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomString += alphaNum[Math.floor(Math.random() * alphaNum.length)];
  }
  return randomString;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

app.post('/urls', (req, res) => { //makes new shortURL
  if (req.session.user_id) {
    const smallURL = generateRandomString();
    urlDatabase[smallURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    }
    res.redirect(`/urls/${smallURL}`);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => { //unknown future use?
  res.json(urlDatabase);
});

app.get('/', (req, res) => { //redirects to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


app.get('/urls', (req, res) => { //home page, shows shortURLS, their counterparts and options
  let templateVars = { login: false };
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id], urls: userURLs(req.session.user_id, urlDatabase) };
    templateVars.login = true;
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => { //renders page to make new shortURL
  let templateVars = {};
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => { //renders the urls_show page which displays the page of a shortURL
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id], ownership: false };
    let goodURLs = userURLs(req.session.user_id, urlDatabase);
    if (goodURLs[req.params.shortURL]) {
      templateVars.ownership = true;
    }
    templateVars = { ...templateVars, message: 'This URL belongs to someone else.' };
    res.render('urls_show', templateVars);
  } else {
    templateVars = { ...templateVars, message: "You can log in to make your own URLs." };
    res.render('urls_show', templateVars);
  }

});

app.post("/urls/:id", (req, res) => { //changes the longURL associated with a shortURL
  if (!req.session.user_id) {
    res.redirect('/urls');
  } else {
    let goodURLs = userURLs(req.session.user_id, urlDatabase);
    if (goodURLs[req.params.shortURL]) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect(`/urls/${req.params.id}`);
    } else {
      res.redirect(`/urls`);
    }
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { //deletes short URL from urlDatabase
  if (!req.session.user_id) {
    res.redirect('/urls');
  } else {
    let goodURLs = userURLs(req.session.user_id, urlDatabase);
    if (goodURLs[req.params.shortURL]) {
      delete urlDatabase[req.params.shortURL];
    }
    res.redirect(`/urls`);
  }
});

app.get("/u/:shortURL", (req, res) => { //is redirect from shortURL to original
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => { //loads the template user_login
  let templateVars = {};
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id] };
  } else {
    res.render("user_login", templateVars);
  }
});

app.post('/login', (req, res) => { //login with validaty checks
  let templateVars = {};
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id], loggedIn: 'You are already logged in!' };
    res.render('user_login', templateVars);
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, errorId: 3, error: 'Needs an email or password.' };
    res.render('user_login', templateVars);
  } else {
    const error = findUser(req.body.email, req.body.password, users);
    if (error.id === 0) {
      req.session.user_id = error.message;
      res.redirect('/urls');
    } else {
      if (error.id === 1) {
        res.status(403);
        templateVars = { ...templateVars, errorId: error.id, error: error.message };
        res.render('user_login', templateVars);
      }
      if (error.id === 2) {
        res.status(403);
        templateVars = { ...templateVars, email: req.body.email, errorId: error.id, error: error.message };
        res.render('user_login', templateVars);
      }
    }
  }
});

app.post('/logout', (req, res) => { //clears cookies, returns to home page
  req.session.user_id = undefined;
  res.redirect('/urls');
});

app.get('/register', (req, res) => { //renders register page
  let templateVars = {};
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id] };
  }
  res.render('user_registration', templateVars);
});

app.post('/register', (req, res) => { //registration with validaty checks
  let templateVars = {};
  if (req.session.user_id) {
    templateVars = { ...templateVars, ...users[req.session.user_id] };
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, error: 'Needs an email or password.' };
    res.render('user_registration', templateVars);
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400);
    templateVars = { ...templateVars, error: 'Email exists!' };
    res.render('user_registration', templateVars);
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    if (!req.session.user_id) {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      templateVars = { ...templateVars, message: 'New account created!' };
      res.render('user_registration', templateVars);
    }
  }
  console.log(users);
});