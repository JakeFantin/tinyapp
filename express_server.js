const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(cookieParser())


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

function generateRandomString() {
  let randomString = '';
  let alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZacdefghijklmnopqrstuvwxyz1234567890';
  for(let i = 0;i<6;i++){
    randomString += alphaNum[Math.floor(Math.random()*alphaNum.length)];
  }
  return randomString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

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
  let templateVars = { urls: urlDatabase, username: '' };
  if(req.cookies["username"]){
    templateVars["username"] = req.cookies['username'];
  }
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {username: ''};
  if(req.cookies["username"]){
    templateVars["username"] = req.cookies['username'];
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: ''}
  if(req.cookies["username"]){
    templateVars["username"] = req.cookies['username'];
  }
  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  // let templateVars = { shortURL: req.params.shortURL, longURL: req.body.longURL }
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

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls'); 
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls'); 
});