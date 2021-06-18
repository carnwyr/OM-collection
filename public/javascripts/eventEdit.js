$(document).ready(function() {
	$("input[type=file]").on("change", loadImage);
	$("#addReward").on("click", addReward);
	$("#addAP").on("click", addAP);
});

function loadImage(event) {
	// const files = event.target.files;
	//
	// console.log('files', files);
	//
	// var image = document.getElementById('output');
	// image.src = URL.createObjectURL(event.target.files[0]);

	const preview = document.getElementById("preview");
	const file = event.target.files[0];
	const reader = new FileReader();

	reader.addEventListener("load", function () {
		// convert image file to base64 string
		preview.src = reader.result;

		// console.log(preview.src);

	}, false);

	if (file) {
		reader.readAsDataURL(file);
	}

	// console.log(image.src);
}

function addReward() {
	var rewardTemplate = "";
	$("#rewards").append("");
}

function addAP() {
	$("#AP").append("");
}
