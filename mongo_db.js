var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  var book = [
	  {
	  	bookTitle: "The Lord of the Rings",
		author: "Tolkien",
		datePub: "1940",
		pageNum: "500"
	  },
	  {
	  	bookTitle: "How to kill a mockingbird",
		author: "Hemingway",
		datePub: "50",
		pageNum: "125"
	  }
  ];
  dbo.collection("Books").insertMany(book, function(err, res) {
    if (err) throw err;
    console.log(res);
    db.close();
  });
});