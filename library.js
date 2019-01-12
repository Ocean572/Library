var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var firebase = require('firebase').initializeApp({
	serviceAccount: "./library-bb644723d6a6.json",
	databaseURL: "https://library-io572.firebaseio.com/"
});

var app = express();

// set up handlebars view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var port = process.env.port || 8080;

app.listen(port);

app.use(express.static(__dirname + '/public'));

// declaring routes

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/', function(req, res){
	res.render('home');
});

app.get('/bookshelf', function(req, res){
	res.render('bookshelf', {csrf: ''});
});

//handling form on bookshelf page
app.post('/process', function(req, res){
	console.log('Form: ' + req.query.form);
	console.log('CSRF token: ' + req.body._csrf);
	console.log('Title: ' + req.body.title);
	console.log('Author: ' + req.body.author);
	console.log('Date Published: ' + req.body.datePub);
	console.log('Number of Pages: ' + req.body.pageNum);
	res.redirect(303, '/bookshelf');
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