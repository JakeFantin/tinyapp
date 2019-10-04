const bcrypt = require('bcrypt');

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

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

const userURLs = function(user_id, urlDatabase) {
  let filteredKeys = Object.keys(urlDatabase);
  let URLs = {};
  for (key of filteredKeys) {
    if (urlDatabase[key].userID === user_id) {
      URLs[key] = urlDatabase[key];
    }
  }
  return URLs;
}

module.exports = { findUser, userURLs, getUserByEmail };