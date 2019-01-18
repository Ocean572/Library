var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var app = express();
const fs = require('fs');

// set up handlebars view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var port = process.env.port || 8080;

app.listen(port);

app.use(express.static(__dirname + '/public'));

//mongod connection
var dbConn = mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true });

// Setting up cookie parser
app.use(session({
	secret: 'i am the greatest secret of the modern world',
	resave: true,
	saveUninitialized: false
}));

//User schema - using mongoose
var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
	},
});

UserSchema.pre('save', function (next){
				var user = this;
				bcrypt.hash(user.password, 10, function(err, hash){
					if (err) {
						console.log(err);
					}
					user.password = hash;
					next();
				});
			});

UserSchema.statics.authenticate = function (email, password, callback) {
	User.findOne({email: email})
		.exec(function(err, user){
			if(err) {
				return callback(err);
			}	else if (!user) {
				var err = new Error("user not found");
				err.status = 400;
				return callback(err);
			}
			bcrypt.compare(password, user.password, function(err, result){
				if (result === true) {
					return callback(null, user);
				}	else {
					return callback();
				}
			});
		});
};

var User = mongoose.model('User', UserSchema);
module.exports = User;

// declaring routes

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/', function(req, res){
	res.render('home');

});

app.get('/bookshelf', function(req, res){
	//Connection to the database
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
		if(err) {
			console.log("Please check db connection parameters");
		}	else {
			var loginId = User.findOne({"_id": req.session.userId});
			if (typeof loginId === "object" && req.session.userId !== undefined) {
				console.log("Connection success");
				var collection = db.collection("Books");
				collection.find({}).toArray(function (error, documents) {
					jsonObj = "var book = " + JSON.stringify(documents);
					console.log(jsonObj);
					fs.writeFile("public/js/data.js", jsonObj, 'utf8', function(err){
						if(err) throw err;
						console.log("file succesffully saved");
						res.render('bookshelf');
					});
				});
			}	else {
				res.redirect(303, '/');
			};
		};
	db.close();
	});
});

app.get('/deleteRow/:title', function(req, res){
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
		if(err) {
			throw "Please check connection to db: " + err;
		}	else {
			console.log("connection success");
			try {
				let url = req.url.toString();
				let urlChopped = url.slice(11);
				console.log(urlChopped);
				var urlUnderscoreRem = urlChopped.replace(/_/g, " ");
				db.collection("Books").deleteOne( {"title" : urlUnderscoreRem} );
				console.log("Document succesfully deleted!");
				res.redirect(303, '/bookshelf');
			}	catch(err) {
					throw(err);
			};
		};
	db.close();
	});
});

//handling form on bookshelf page
/*
app.post('/process', function(req, res){
	console.log('Form: ' + req.query.form);
	console.log('CSRF token: ' + req.body._csrf);
	console.log('Title: ' + req.body.title);
	console.log('Author: ' + req.body.author);
	console.log('Date Published: ' + req.body.datePub);
	console.log('Number of Pages: ' + req.body.pageNum);
	res.redirect(303, '/bookshelf');
});
*/

app.post('/process', function(req, res){
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
		db.collection('Books').insertOne(req.body);
		console.log("Books Inserted");
		res.redirect(303, '/bookshelf');
	});
});

//password and username post route handler
app.post('/register', function(req, res){
	delete req.body._id;
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db) {
		if (req.body.email && req.body.password) {
			var userData = {
				email: req.body.email,
				password: req.body.password,
			}
			User.create(userData, function(err, user){
				if (err) {
					console.log(err);
					res.redirect(303, '/bookshelf');
					console.log("email already in the system");
					res.end();
				}	else {
					console.log("New user created")
					req.session.userId = user._id;
					req.session.save();
					res.redirect(303, '/bookshelf');
				}
			});
		}
	});
});

//Login post
app.post('/login', function(req, res, next){
	if (req.body.email && req.body.password) {
		User.authenticate(req.body.email, req.body.password, function(error, user) {
			if (error || !user) {
				var err = new Error("Wrong email or password");
				err.status = 400;
				return next(err);
			}	else {
				req.session.userId = user._id;
				req.session.save();
				console.log('login successful');
				res.redirect(303, '/bookshelf');
			}
		});
	}	else {
		var err = new Error("Email and password are required");
		err.status = 400;
		return next(err);
	}
});

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});