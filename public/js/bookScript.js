let template = document.querySelector(".node");  
let tg = document.querySelector(".tg");
let cssStyler = ((1.3*book.length) + 14)
let cssStylerDown = (((1.3*book.length) + 14) - 1.3)

window.onload = function() {
	for(i = 0; i < book.length; i++) {
	let clone = template.cloneNode(true);
	clone.querySelector(".title").innerText = book[i].title;
	clone.querySelector(".author").innerText = book[i].author;
	clone.querySelector(".datePub").innerText = book[i].datePub;
	clone.querySelector(".pageNum").innerText = book[i].pageNum;
	let preLink = "/deleteRow/" + book[i].title;
	let link = preLink.replace(/ /g, '_');
	clone.querySelector('#linker').href = link;
	let preLinkUpload = '/uploadFile/' + book[i].title;
	let linkUpload = preLinkUpload.replace(/ /g, '_');
	clone.querySelector('#uploadLinker').action = linkUpload;
	if(book[i].bookFile == true){
		clone.querySelector('#uploadLinker').remove();
		var observeFileLink = clone.querySelector('#readBookLinks');
		observeFileLink.innerText = 'Read Book'
		observeFileLink.href = '/openFile/' + book[i].title;
	};
	tg.appendChild(clone);
	};
	if(book.length >= 0) {
		document.querySelector('.tableContainer').style.top = cssStyler + "em";
	};
};

/*
function addBook() {
	let clone = template.cloneNode(true);
	clone.querySelector(".title").innerText = book.bookTitle;
	clone.querySelector(".author").innerText = book.author;
	clone.querySelector(".datePub").innerText = book.datePub;
	clone.querySelector(".pageNum").innerText = book.pageNum;
	tg.appendChild(clone);
};
*/

/*
function deleteBook(event) {
	row = this.event.path[1];
	row.remove();
	if(book.length >= 0) {
		document.querySelector('.tableContainer').style.top = cssStylerDown + "em";
	};
}
*/

function readBook(event) {
	row = this.event.path[0];
	if(row.innerText == "No") {
		row.innerText = "Yes"
	}	else {
		row.innerText = "No"
	}
}