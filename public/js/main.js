function openForm() {
	document.getElementById("bookForm").style.display = "block";
};

function closeForm() {
	document.getElementById("bookForm").style.display = "none";
	let child = document.querySelector(".tg");
	child.removeChild(child.lastChild);
}