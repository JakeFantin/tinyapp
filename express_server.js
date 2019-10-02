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

const generateRandomString = function() {
  let randomString = '';
  let alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZacdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 0; i < 6; i++) {
    randomString += alphaNum[Math.floor(Math.random() * alphaNum.length)];
  }
  return randomString;
};

const findEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

app.post('/urls', (req, res) => {
  const smallURL = generateRandomString();
  urlDatabase[smallURL] = req.body.longURL;
  //console.log(req.body.longURL);
  res.redirect(`/urls/${smallURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/home', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render("user_login", templateVars);
});

app.post('/login', (req, res) => {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, error: 'Needs a username or password.' };
    res.render('user_registration', templateVars);
  } else if (findEmail(req.body.email)) {
    console.log('hello')
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
  };
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  res.render('user_registration', templateVars);
});

app.post('/register', (req, res) => {
  let templateVars = {};
  if (req.cookies["user_id"]) {
    templateVars = { ...templateVars, ...users[req.cookies['user_id']] };
  }
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    templateVars = { ...templateVars, error: 'Needs a username or password.' };
    res.render('user_registration', templateVars);
  } else if (findEmail(req.body.email)) {
    console.log('hello')
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
  };
});