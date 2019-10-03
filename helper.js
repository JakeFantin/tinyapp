const findEmail = function(email, users) { // checks if email already exists
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const findUser = function(email, password, users) { //looks for username and password in database, relaying back different messages based on result
  for (const user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, users[user].password)) {
        return { id: 0, message: users[user].id };
      } else {
        return { id: 2, message: 'Password is incorrect, please try again' };
      }
    }
  }
  return { id: 1, message: 'Email not found.' };
};

const userURLs = function(user, urlDatabase) {
  let filteredKeys = Object.keys(urlDatabase);
  let userURLs = {};
  for (key of filteredKeys) {
    if (urlDatabase[key].userID === user) {
      userURLs[key] = urlDatabase[key];
    }
  }
  return userURLs;
}

module.exports = { findUser, userURLs, findEmail };