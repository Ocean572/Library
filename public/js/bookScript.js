let template = document.querySelector(".node");  
let tg = document.querySelector(".tg");

let myLibrary = [];

let book = {
	bookTitle: "",
	author: "",
	datePub: "",
	pageNum: ""
};

function addBook() {
	let clone = template.cloneNode(true);
	clone.querySelector(".title").innerText = book.bookTitle;
	clone.querySelector(".author").innerText = book.author;
	clone.querySelector(".datePub").innerText = book.datePub;
	clone.querySelector(".pageNum").innerText = book.pageNum;
	tg.appendChild(clone);
};

function deleteBook(event) {
	row = this.event.path[1];
	row.remove();
}

function readBook(event) {
	row = this.event.path[0];
	if(row.innerText == "No") {
		row.innerText = "Yes"
	}	else {
		row.innerText = "No"
	}
}

$("form").submit(function(event) {
	let array = $(this).serializeArray();
	event.preventDefault();
	book.bookTitle = array[0].value;
	book.author = array[1].value;
	book.datePub = array[2].value;
	book.pageNum = array[3].value;
	addBook();
});
