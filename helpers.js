//// Dependencies ////

const bcrypt = require('bcrypt'); //password hasher

//// Helper Functions ////

const confirmUser = function(email, password, users) { //looks for username and password in a database of users, relaying back different codes/messages based on result
  for (const user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, users[user].password)) { //the passwords have been previously hashed using bcrypt, and must be checked using its built-in compare method
        return { id: 0, message: users[user].id };
      } else {
        return { id: 2, message: 'Password is incorrect, please try again' };
      }
    }
  }
  return { id: 1, message: 'Email not found.' };
};

const getUserByEmail = function(email, database) { //requires an email and a database of users, and returns the user matching that email, or undefined
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

const userURLs = function(userId, urlDatabase) { //requires a userId and a database of URLS and and returns all the URLS belonging to that user in an object
  let filteredKeys = Object.keys(urlDatabase);
  let URLs = {};
  for (const key of filteredKeys) {
    if (urlDatabase[key].userID === userId) {
      URLs[key] = urlDatabase[key];
    }
  }
  return URLs;
};

//// Exports ////

module.exports = { confirmUser, userURLs, getUserByEmail };