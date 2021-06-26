$(document).ready(function() {
	$("input[type=file]").on("change", loadImage);
	$("#addReward, #addAP").on("click", addItem);
	$("#submit").on("click", submitChange);
});

function loadImage(event) {
	const preview = document.getElementById("preview");
	const file = event.target.files[0];
	const reader = new FileReader();

	reader.addEventListener("load", function () {
		// convert image file to base64 string
		preview.src = reader.result;

		console.log(preview);


	}, false);

	if (file) {
		reader.readAsDataURL(file);
	}
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

	data.img = $("img#preview").attr("src");

	var rewardData = new FormData($("form")[1]),
			apData = new FormData($("form")[2]),
			temp = {};
	data.rewards = [], data.ap = [];
	for (let form of [rewardData, apData]) {
		let lst, end;
		if (form === rewardData) {
			lst = data.rewards;
			end = "card";
		} else {
			lst = data.ap;
			end = "page";
		}
		for (let pair of form.entries()) {
			temp[pair[0]] = pair[1];
			if (pair[0] === end) {
				lst.push(temp);
				temp = {};
			}
		}
	}

	for (let key in data) {
		if (data[key] === "") {
			showAlert("danger", "Please fill: "+key);
			return;
		}
	}

	$.ajax({
    type: "post",
    url: "/event/updateEvent",
    contentType: "application/json",
    data: JSON.stringify({ data: data })
  })
  .done(function(result) {
    if (result.err) {
      showAlert("danger", result.message);
      return;
    }
    showAlert("success", "Event updated!");
  });
}
