// Require all the stuff
var Sequelize = require('sequelize'),
	passportLocalSequelize = require('passport-local-sequelize');

// Setup sequelize db connection
var mydb = new Sequelize('mydb', 'myuser', 'mypass', {
	dialect: 'sqlite',

	storage: 'mydb.sqlite'
});

// A helper to define the User model with username, password fields
var User = passportLocalSequelize.defineUser(mydb, {
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

module.exports = User;