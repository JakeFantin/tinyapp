const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(cookieParser());


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = function() { //ID generator - 6 characters
  let randomString = '';
  let alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZacdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomString += alphaNum[Math.floor(Math.random() * alphaNum.length)];
  }
  return randomString;
};

const findEmail = function(email) { // checks if email already exists
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const findUser = function(email, password) { //looks for username and password in database, relaying back different messages based on result
  for (const user in users) {
    if (users[user].email === email) {
      if (users[user].password === password) {
        return { id: 0, message: users[user].id };
      } else {
        return { id: 2, message: 'Password is incorrect, please try again' };
      }
    }
  }
  return { id: 1, message: 'Email not found.' };
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

app.post('/urls', (req, res) => { //makes new shortURL
  const smallURL = generateRandomString();
  urlDatabase[smallURL] = req.body.longURL;
  res.redirect(`/urls/${smallURL}`);
});

app.get("/urls.json", (req, res) => { //unknown future use?
  res.json(urlDatabase);
});

app.get('/home', (req, res) => { //redirects to /urls
  res.redirect("/urls");
});


app.get('/urls', (req, res) => { //home page, shows shortURLS, their counterparts and options
  let templateVars = { urls: urlDatabase };
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { //renders page to make new shortURL
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
    res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => { //renders the urls_show page which displays the page of a shortURL
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => { //changes the longURL associated with a shortURL
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:shortURL/delete", (req, res) => { //deletes short URL from urlDatabase
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => { //is redirect from shortURL to original
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => { //loads the template user_login
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render("user_login", templateVars);
});

app.post('/login', (req, res) => { //login with validaty checks
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']], loggedIn: 'You are already logged in!' };
    res.render('user_login', templateVars);
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, errorId: 3, error: 'Needs an email or password.' };
    res.render('user_login', templateVars);
  } else {
    const error = findUser(req.body.email, req.body.password);
    if (error.id === 0) {
      res.cookie('user_id', error.message);
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
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => { //renders register page
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('user_registration', templateVars);
});

app.post('/register', (req, res) => { //registration with validaty checks
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, error: 'Needs an email or password.' };
    res.render('user_registration', templateVars);
  } else if (findEmail(req.body.email)) {
    res.status(400);
    templateVars = { ...templateVars, error: 'Email exists!' };
    res.render('user_registration', templateVars);
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    if (!req.cookies['user_id']) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      templateVars = { ...templateVars, message: 'New account created!' };
      res.render('user_registration', templateVars);
    }
  }
});