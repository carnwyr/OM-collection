$(document).ready(function() {
	$("input[type=file]").on("change", loadImage);
	$("input[name=name]").on("focusout", addImageName);
	$("form").on("click", ".form-inline>button", removeItem);
	$("#addReward, #addAP").on("click", addItem);
	$("#submit").on("click", submitChange);
});

function loadImage(event) {
	const preview = document.getElementById("preview");
	const file = event.target.files[0];
	const reader = new FileReader();

	reader.addEventListener("load", function() {
		preview.src = reader.result;  // convert image file to base64 string
	}, false);

	if (file) {
		reader.readAsDataURL(file);
	}

	// change file input display name
	var fileName = $(this).val();
	$(this).next(".custom-file-label").text(fileName.replace("C:\\fakepath\\", ""));
}

function addImageName() {
	var img_name = $(this).val().replace(/[\\/:*?"<>|]/g, '').replace(/ /g, '_');
	$("input[name=img_name]").val(img_name);
}

function removeItem() {
	$(this).parent().remove();
}

function addItem() {
	var parentForm = $(this).data("target");
	var template = $(this).data("clone");
	$(parentForm).append($(template).html());
}

function submitChange() {
	var data = {};

	var formData = new FormData($("form")[0]);
	for (let pair of formData.entries()) {
		data[pair[0]] = pair[1];
	}

	if (navigator.userAgent.indexOf("Chrome") !== -1) {
		data.start += ":00.000Z";
		data.end += ":00.000Z";
	}

	if (data.type !== "Nightmare") {
		data.rewards = formatRewards(new FormData($("form")[1]), "card");
		data.ap = formatRewards(new FormData($("form")[2]), "page");
	}

	for (let key in data) {
		if (data[key] === "") {
			if (data.type === "Nightmare" && ["stages", "pageCost"].includes(key)) {
				continue;
			}
			showAlert("danger", "Please fill: "+key);
			return;
		}
	}

	// console.log(data);

	$.ajax({
		type: "post",
		url: "/event/updateEvent",
		contentType: "application/json",
		data: JSON.stringify({
			data: data,
			img: $("img#preview").attr("src"),
			name: location.pathname.split("/")[2]
		})
	}).done(function(result) {
			if (result.err) {
				showAlert("danger", result.message);
				return;
			}
			showAlert("success", result.message);
		});
}

function formatRewards(f, end) {
	var temp = {}, lst = [];
	for (let pair of f.entries()) {
		temp[pair[0]] = pair[1];
		if (pair[0] === end) {
			lst.push(temp);
			temp = {};
		}
	}
	return lst;
}