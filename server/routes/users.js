let mongoose = require('mongoose');
let User = require('../models/users');
let jwt = require('jsonwebtoken');
let config = require('../config/config');


exports.signup = function (req, res, next) {
  // Check for registration errors
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;


  // Check data null or not null
  if (!firstName || !lastName || !email || !username || !password) {
    return res.status(422).json({success: false, message: 'Posted data is not correct or incomplete.'});
  }


  User.findOne({username: username}, function (err, existingUser) {

    // Error when processing request
    if (err) {
      res.status(400).json({success: false, message: 'Error processing request ' + err});
    }

    // If user is not unique, return error
    if (existingUser) {
      return res.status(201).json({
        success: false,
        message: 'Username already exists.'
      })
    }

    // If no error, create accout
    let newUser = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      username: username,
      password: password
    })

    // Create new user success
     
    // newUser.save(function (err, newUser) {
    //   if (err) return res.status(400).json({success: false, message: 'Error processing request ' + err});

    //   return res.status(201).json({
    //     success: true,
    //     message: 'User created successfully, please login to access your accout.'
    //   })
    // })
    // 
    
    newUser.addUser(newUser, (err, data) => {
      if (err) { return res.status(400).json({success: false, message: 'Failed add new user !'})}
      return res.status(201).json({success: true, message: 'Success add new user'});
    })

  })
}

exports.login = function (req, res, next) {
  // find user
  User.findOne({username: req.body.username}, function (err, user) {
    if (err) {
      return res.status(400).json({success: false, message: 'Error when processing request ' + err})
    }

    if (!user) {
      return res.status(201).json({success: false, message: 'Incorrect login credentials'})
    } else if (user) {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          let token = jwt.sign({user: user}, config.secret, {
            expiresIn: config.tokenexp
          });

          // login success update last login
          user.lastlogin = new Date();

          user.save(function (err) {
            if (err) {res.status(400).json({success: false, message: 'Error processing request ' + err})}

            res.status(201).json({
              success: true,
              message: {'userid': user._id, 'username': user.username, 'firstName': user.firstName, 'lastlogin': lastlogin},
              token: token
            });
          });

        } else {
          res.status(201).json({success: false, message: 'Incorrect login credentials.'});
        }
      })
    }
  })
};


exports.authenticate = function (req, res, next) {
  // check header or url parameters or post parameters for token
  let token = req.body.token || req.body.token || req.headers['authorization'];

  if (token) {
    jwt.verify(token, config.secret, function (err, decoded) {
      if (err) {
        return res.status(201).json({
          success: false,
          message: 'Authenticate token expired, please login again.',
          errcode: 'exp-token'
        })
      } else {
        req.decoded = decoded;
        next();
      }
    })
  } else {
    return res.status(201).json({
      success: false,
      message: 'Fatal error, authenticate token is not available',
      errcode: 'no-token'
    })
  }
}


exports.getUserDetails = function (req, res, next) {
  User.find({_id: req.params.id}).exec(function (err, user) {
    if (err) {
      return res.status(400).json({success: false, message: 'Error processing request ' + err})
    }

    return res.status(201).json({
      success: true,
      data: user
    })
  })
}


exports.updateUser = function (req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const userid = req.params.id;

  if (!firstName || !lastName || !email || !userid) {
    return res.status(422).json({success: false, message: 'Posted data is not correct or incomplete.'})
  } else {
    User.findById(userid).exec(function (err, user) {

      if (err) {
        return res.status(400).json({success: false, message: 'Error processing request ' + err})
      }

      if (user) {
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
      }

      user.save(function (err) {
        if (err) {
          return res.status(400).json({success: false, message: 'Error processing request ' + err})
        }

        return res.status(201).json({
          success: true,
          message: 'User details updated successfully.'
        })
      })

    })
  }
}

exports.updatePassword = function (req, res, next) {
  const userid = req.params.id;
  const oldPassword = req.body.oldPassword;
  const password = req.body.password;

  if (!oldPassword || !password || !userid) {
    return res.status(400).json({success: false, message: 'Posted data is not correct or incomplete.'})
  } else {
    User.findOne({

      _id: userid, function (err, data) {
        if (err) {
          return res.status(400).json({success: false, message: "Error processing request " + err})
        }
        if (data) {
          data.comparePassword(oldPassword, function (err, isMatch) {
            if (isMatch && !err) {
              user.password = password;

              user.save(function (err) {
                if (err) {
                  return res.status(400).json({success: false, message: 'Error processing request ' + err})
                }

                return res.status(201).json({success: false, message: 'Incorrect old password.'})
              })
            }
          })
        }
      }

    })
  }
}


exports.getUserByUsername = function(req, res, next) {
  const username = req.body.username;

  if(!username) {
    return res.status(400).json({success: false, message: 'Posted data is not correct or incomplete.'});
  }else{
    User.find({username: username}, function(err, data) {
      if (err) {return res.status(400).json({success: false, message: 'Error processing request ' + err})}
      
      return res.status(201).json({success: true, data: data});
    })
  }
}