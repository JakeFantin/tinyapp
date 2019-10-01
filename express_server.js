const express = require("express");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');


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
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] }
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
