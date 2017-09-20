let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let morgan = require('morgan');
let mongoose = require('mongoose');
let jwt = require('jsonwebtoken');
let passport = require('passport');

let config = require('./config');
let user = require('./routes/users.js');
let expense = require('./routes/expense.js');
let port = config.serverport;

mongoose.connect(config.database, function (err) {
  if(err){
    console.log('Error connecting database, please check if MongoDB is running')
  }else{
    console.log('Connected to database ...')
  }
});




// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: true}));
// app.use(bodyParser).json({type: "*/*"});
app.use(bodyParser.json());


// use morgan to log requests to the console
app.use(morgan('dev'));

// Enable CORS from client-side
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', "*");
	res.setHeader('Access-Control-Allow-Methods', "PUT, GET, POST, DELETE, OPTIONS");
	res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
	res.setHeader('Access-Control-Allow-Credentials', "true");
	next();
});

// basic routes
app.get('/', function (req, res) {
	res.send('Expense Watch API is running at http://localhost:' + port + '/api')
});

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

require('./passport')(passport);

app.post('/register', user.signup);

// express router
let apiRoutes = express.Router();

app.use('/api', apiRoutes);

apiRoutes.post('/login', user.login);

apiRoutes.use(user.authenticate); // route middleware to authenticate and check token

// authenticated routes
apiRoutes.get('/', function(req, res){
	res.status(201).json({message: 'Welcome to the authenticated routes!'})
});

apiRoutes.get('/user/:id', user.getUserDetails); // API return user details

apiRoutes.put('/user/:id', user.updateUser); // API update user details

apiRoutes.get('/user/:username', user.getUserByUsername); // API return user have username

apiRoutes.put('/password/:id', user.updatePassword); // API update user password

apiRoutes.get('/expense/:id', expense.getExpense); // API add & update expense of the user

apiRoutes.post('/expense/:id', expense.saveExpense); // API add & update expense of the user

apiRoutes.delete('/expense/:id', expense.delExpense); // API remove the expense details of given expense id

apiRoutes.post('/expense/total/:id', expense.totalExpense); // API return expense details of given expense id

apiRoutes.post('/expense/report/:id', expense.reportExpense); // API return expense report based on user input

app.listen(port, () => {
	console.log('Server started on port: ' + port);
});


