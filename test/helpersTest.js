//// Dependencies ////

const { assert } = require('chai');
const bcrypt = require('bcrypt');
const { confirmUser, userURLs, getUserByEmail } = require('../helpers.js');

//// Databases for Testing ////

const testUsers = {
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

const testURLs = {
  '4h5bfd': {
    longURL: "blah@me",
    userID: "userRandomID",
  }
};

//// Testing Functions ////

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput);
  });
  it('should return undefined when presented with a invalid email.', function() {
    const user = getUserByEmail('nouser@example.com', testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe('confirmUser', function() {
  it('should return the userID of a valid email, password pair, with an error_id of zero', function() {
    testUsers['newUser'] = {
      id: "newUser",
      email: "user3@example.com",
      password: bcrypt.hashSync("star", 10)
    };
    const user = confirmUser("user3@example.com", "star", testUsers);
    const expectedOutput = "newUser";
    const expectedCode = 0;
    assert.strictEqual(user.message, expectedOutput);
    assert.strictEqual(user.id, expectedCode);
  });
  it('should return a message indication wrong password, with an message_id of 2', function() {
    const user = confirmUser("user3@example.com", "star2", testUsers);
    const expectedOutput = 'Password is incorrect, please try again';
    const expectedCode = 2;
    assert.strictEqual(user.message, expectedOutput);
    assert.strictEqual(user.id, expectedCode);
  });
  it('should return a message indication wrong email, with an message_id of 1', function() {
    const user = confirmUser("use@example.com", "star2", testUsers);
    const expectedOutput = 'Email not found.';
    const expectedCode = 1;
    assert.strictEqual(user.message, expectedOutput);
    assert.strictEqual(user.id, expectedCode);
  });
});

describe('userURLs', function() {
  it('should return the url that is tied to the userId', function() {
    const urls = userURLs("userRandomID", testURLs);
    const expectedOutput = "blah@me";
    assert.strictEqual(urls['4h5bfd'].longURL, expectedOutput);
  });
  it('should return an empty object when presented with a invalid userId', function() {
    const urls = userURLs("userRanmdomID", testURLs);
    const expectedOutput = undefined;
    assert.strictEqual(urls.longURL, expectedOutput);
  });
});