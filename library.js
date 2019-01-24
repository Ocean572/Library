var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var multer = require('multer');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo
var storage = require('multer-gridfs-storage')({
	url: 'mongodb://localhost:27017/YourDB'
});
var uploadServer = multer({dest: 'uploads/'});
var upload = multer({ storage: storage });
/* FOR USE W/ MULTER-GRID-FS STORAGE - CURRENTLY USING GRIDFS-STREAM
var storage = require('multer-gridfs-storage')({
	db: connection
	file: (req, file) => {
		return {
			bucketName: 'Books',
			filename: 'file_' + Date.now()
		};
	}
});
var upload = multer({ storage: storage });
*/
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcrypt');
var bookData = require('./public/js/data.js');
var app = express();
const fs = require('fs');

// set up handlebars view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
var port = process.env.port || 8080;
app.listen(port);
app.use(express.static(__dirname + '/public'));

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
					jsonObj = "var book = " + JSON.stringify(documents) + '; module.exports.book = book';
					fs.writeFile("public/js/data.js", jsonObj, 'utf8', function(err){
						if(err) throw err;
						console.log("file succesffully saved");
						mongoose.connection.close()
						res.render('bookshelf')
					});
				});
			}	else {
				mongoose.connection.close();
				res.redirect(303, '/');
			};
		};
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

//adding books to database through POST form
app.post('/process', function(req, res){
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
		db.collection('Books').insertOne(req.body);
		console.log("Books Inserted");
		res.redirect(303, '/bookshelf');
		mongoose.connection.close();
	});
});

//Uploading files -- So innefficient.. I am uploading to the server, then database, then deleting from server. I do not know how to refer to the file while piping the writestream
app.post('/uploadFile/:title', uploadServer.single('file'), function(req, res){
	var conn = mongoose.createConnection("mongodb://localhost:27017/YourDB");
	let url = req.url.toString();
	let urlChopped = url.slice(12);
	console.log(urlChopped);
	var urlUnderscoreRem = urlChopped.replace(/_/g, " ");
//Making sure the db instance is open before passing into 'Grid'
	conn.once('open', function(){
		var gfs = Grid(conn.db);
		// Creating write steam to stream data to GridFs
		var writestream = gfs.createWriteStream({
			_id: req.file.id,
			filename: urlUnderscoreRem,
			mode: 'w',
		});
		//If i were to upload directly to the database how would i supply the correct path to pipe the writestream?
		fs.createReadStream('uploads/' + req.file.filename).pipe(writestream);
		writestream.on('close', function(file){
			console.log('succesfully uploaded to the database!');
		});
		fs.unlink('uploads/' + req.file.filename, (err) => {
			if (err) throw err
			console.log('uploads/' + req.file.filename + 'was deleted');
		});
		mongoose.connection.close();
		mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
			var collection = db.collection("Books");
			collection.update(
				{ "title": urlUnderscoreRem },
				{
					$set: {
						bookFile: true
					}
				}

			);
		mongoose.connection.close();
		});
	});
	res.redirect(303, '/bookshelf')
});


//password and username post route handler
app.post('/register', function(req, res){
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
	mongoose.connect("mongodb://localhost:27017/YourDB", { useNewUrlParser: true }, function(err, db){
		if (req.session.userId !== undefined) {
			console.log("already logged in");
			res.redirect(303, '/bookshelf');
			mongoose.connection.close();
		}	else if (req.body.email && req.body.password) {
				User.authenticate(req.body.email, req.body.password, function(error, user) {
					if (error || !user) {
						var err = new Error("Wrong email or password");
						err.status = 401;
						return next(err);
					}	else {
						req.session.userId = user._id;
						req.session.save();
						console.log('login successful');
						res.redirect(303, '/bookshelf');
						mongoose.connection.close();
					}
				});
		}	else {
			var err = new Error("Email and password are required");
			err.status = 401;
			return next(err);
			mongoose.connection.close();
		}
	});
});

//Viewing files
app.get('/openFile/:title', function(req, res){
	let url = req.url.toString();
	let urlChopped = url.slice(10);
	console.log(urlChopped);
	var urlUnderscoreRem = urlChopped.replace(/_/g, " ");
	var conn = mongoose.createConnection("mongodb://localhost:27017/YourDB");
	conn.once('open', function(){
		var gfs = Grid(conn.db);
		var readstream = gfs.createReadStream({
			filename: urlUnderscoreRem
		});

		res.setHeader('Content-disposition', 'inline; filename="' + urlUnderscoreRem + '"');

		readstream.pipe(res);
	});
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