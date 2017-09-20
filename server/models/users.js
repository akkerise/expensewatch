const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema =  mongoose.Schema;


const UserSchema = new Schema({
	firstName: {type: String},
	lastName: {type: String},
	email: {type: String},
	username: {type: String},
	password: {type: String},
	lastlogin: {type: Date}
})

// Pre-save of user's hash password to database
UserSchema.pre('save', function(next){
	const users = this,
	SALT_FACTOR = 5;

	if (!users.isModified('password')) {return next()};

	bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
		if (err) {return next(err)}

			bcrypt.hash(users.password, salt, null, (err, hash) => {
				if (err) {return next(err);}
				users.password = hash;
				next();
			});
	});
});


UserSchema.methods.addUser = function(newUser, callback) {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(newUser.password, salt, (err, hash) => {
			if(err) throw err;
			newUser.password = hash;
			newUser.save(callback);
		})
	})
}

// Method to compare password for login

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
	  if(err) {return cb(err)}

	  cb(null, isMatch)
  })
}

module.exports = mongoose.model('users', UserSchema, 'users')
