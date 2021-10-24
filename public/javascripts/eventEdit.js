$(document).ready(function () {
	createMasks();

	$("form").on("click", ".form-inline>button", removeItem);
	$("#addReward, #addAP").on("click", addItem);
	$("#submit").on("click", saveChanges);

	bindCustomTags();
});

function createMasks() {
	var maskOptions = {
		mask: 'YYYY.MM.DD, hh:mm:ss',
		lazy: false,
		blocks: {
			YYYY: {
				mask: IMask.MaskedRange,
				from: 2019,
				to: 2050
			},
			MM: {
				mask: IMask.MaskedRange,
				from: 1,
				to: 12,
				maxLength: 2
			},
			DD: {
				mask: IMask.MaskedRange,
				from: 1,
				to: 31,
				maxLength: 2
			},
			hh: {
				mask: IMask.MaskedRange,
				from: 0,
				to: 23,
				maxLength: 2
			},
			mm: {
				mask: IMask.MaskedRange,
				from: 0,
				to: 60,
				maxLength: 2
			},
			ss: {
				mask: IMask.MaskedRange,
				from: 0,
				to: 60,
				maxLength: 2
			}
		}
	};
	var start = document.getElementById('start');
	var end = document.getElementById('end');
	var maskStart = IMask(start, maskOptions);
	var maskEnd = IMask(end, maskOptions);
	maskStart.value = start.getAttribute('value');
	maskEnd.value = end.getAttribute('value');
}

function removeItem() {
	$(this).parent().remove();
}

function addItem() {
	var parentForm = $(this).data("target");
	var template = $(this).data("clone");
	var newItem = $(parentForm).append($(template).html());
	newItem.find("button").click(removeItem);
	newItem.find("select").change(switchCustomTagDisplay);
}

function bindCustomTags() {
	var tagDropdowns = $('#rewards select');
	tagDropdowns.each((index, reward) => {
		if (!$(reward).val()) {
			$(reward).next().addClass('d-block').removeClass('d-none');
		};
	});

	tagDropdowns.change(switchCustomTagDisplay)
}

function switchCustomTagDisplay(event) {
	var tag = event.target;
	if (!$(tag).val()) {
		$(tag).next().addClass('d-block').removeClass('d-none');
	} else {
		$(tag).next().addClass('d-none').removeClass('d-block');
	};
}

// TODO merge with card edit functions
// TODO fix page reload (not needed, shows old values)
function saveChanges(e) {
  e.preventDefault();
  if (!validateFields()) {
    return;
  }
  submitChange();
}

function validateFields() {
    if (!$('#en-name').val()) {
    showAlert("danger", 'English name must be filled');
    return false;
  }
  let fileName = $('#uploadImage').val();
	if (fileName) {
		let parts = fileName.split('.');
		let extension = parts[parts.length - 1];
		if (extension !== 'jpg') {
			showAlert("danger", 'Uploaded image must be jpg');
			return false;
		}
	}
  return true;
}

function submitChange() {
	var data = {};

	var formData = new FormData(document.getElementById('info'));
	formData.forEach((value, key) => data[key] = value);

	if (data.type !== "Nightmare") {
		data.rewards = getRewards();
		data.ap = getAP();
	}

	data.name = {
		en: data["en-name"],
		ja: data["ja-name"],
		zh: data["zh-name"]
	};
	["en-name", "ja-name", "zh-name"].forEach(e => delete data[e]);

	for (let key in data) {
		if (data[key] === "") {
			if (data.type === "Nightmare" && ["stages", "pageCost"].includes(key)) {
				continue;
			}
			showAlert("danger", "Please fill: "+key);
			return;
		}
	}

	var image = readImage($('#uploadImage')[0]);
	image
		.then(res => sendRequest(data, res))
		.catch(err => showAlert("danger", "Can't load image: " + err.message));
}

function getRewards() {
	var rewards = $("#rewards form").map((index, form) => {
		var formData = new FormData(form);
		var reward = {};
		formData.forEach((value, key) => reward[key] = value);
		if (!reward.tag) {
			reward.tag = reward.customTag;
		}
		delete reward.customTag;
		return reward;
	}).toArray();

	rewards = rewards.filter(r => r.tag && r.points);

	return rewards;
}

function getAP() {
	var apRewards = $("#AP form").map((index, form) => {
		var formData = new FormData(form);
		var ap = {};
		formData.forEach((value, key) => { if (value) ap[key] = value });
		return ap;
	}).toArray();

	apRewards = apRewards.filter(r => r.amount && r.points);

	return apRewards;
}

function sendRequest(data, image) {
	$.ajax({
		type: "post",
		url: location.pathname,
		contentType: "application/json",
		data: JSON.stringify({
			data: data,
			img: image,
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
