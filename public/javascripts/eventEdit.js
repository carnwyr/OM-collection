var selectPickerOptions = {
	liveSearch: true,
	style: '',
	styleBase: 'form-control mb-0',
	size: 15,
	title: 'card name'
};

$(document).ready(function () {
	createMasks();

	$(document).on("click", ".add-item", addItem);
	$(document).on("click", ".remove-item", removeItem);

	$(".add-ap").click(addAP);

	$("#submit").click(saveChanges);  // function is in pug file

	// $("select[name='tag']").change(checkIfCustom);

	$('.card-select').selectpicker(selectPickerOptions);

	$('.preset').click(applyPreset);
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
	var template = $(this).data("clone");
	$(this).parent().children("div:first-of-type").append($(template).html());

	if (template === "#rewardTemplate") {
		$('.card-select').selectpicker(selectPickerOptions);
	}
}

function checkIfCustom() {
	if ($(this).val() === "custom") {
		$("input[name='customTag']").show();
	} else {
		$("input[name='customTag']").hide();
	}
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

function prepareEventData() {
	var generalInfo = new FormData(document.getElementById('info'));
	generalInfo.forEach((value, key) => generalInfo[key] = value);
	generalInfo.name = {
		en: generalInfo["en-name"],
		ja: generalInfo["ja-name"],
		zh: generalInfo["zh-name"]
	};
	["en-name", "ja-name", "zh-name"].forEach(e => delete generalInfo[e]);

	var data = generalInfo;

	if (generalInfo.type === "PopQuiz") {
		let rewardType = $("input[name='rewardListType']:checked").val();
		let popQuizData = {
			isLonelyDevil: $("input#lonelydevil").is(":checked"),
			isBirthday: $("input#birthday").is(":checked"),
			hasKeys: $("input#has-keys").is(":checked"),
			rewardListType: rewardType,
			stages: $("input#stages").val()
		};

		if (popQuizData.hasKeys) {
			data.lockedStages = getLockedStages();
			data.keyDroppingStages = $("input[name='keydrops']").val().split(',').map(element => {
				element.trim();
			});
		}

		if (rewardType === "points") {
			popQuizData.listRewards = getRewards();
			popQuizData.ap = getAP();
			popQuizData.pageCost = $("input[name='pageCost']").val();
		} else {
			popQuizData.boxRewards = getBoxRewards();
		}

		data = Object.assign(popQuizData, data);
	}

	return data;
}

function getRewards() {
	var rewards = $("#rewards form").map((index, form) => {
		var formData = new FormData(form);
		var reward = {};
		formData.forEach((value, key) => reward[key] = value);
		if (reward.tag === "custom") {
			reward.tag = reward.customTag;
		}

		delete reward.customTag;
		return reward;
	}).toArray();

	rewards = rewards.filter(r => r.card && r.points);

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

function getBoxRewards() {
	var sets = []

	$("div.boxset").each(function() {
		let set = {
			name: $(this).find("input[name='box-set-name']").val(),
			cost: $(this).find("input[name='box-set-cost']").val(),
			boxes: []
		};

		$(this).find("form").each(function() {
			var formData = new FormData(this);
			var boxData = {};
			formData.forEach((value, key) => boxData[key] = value);
			set.boxes.push(boxData);
		});

		sets.push(set);
	});

	sets = sets.filter(r => r.name && r.cost);

	return sets;
}

function getLockedStages() {
	var stages = []

	$("div#keys form").each(function() {
		var formData = new FormData(this);
		var boxData = {};
		formData.forEach((value, key) => boxData[key] = value);
		stages.push(boxData);
	});

	stages = stages.filter(r => r.name && r.requirement);

	return stages;
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



function addAP() {
	var parentForm = $(this).data("target");
	var template = $(this).data("clone");
	var newItem = $($(template).html()).appendTo($(parentForm));

	// newItem.find(".remove-item").click(removeItem);
	// newItem.find(".tag-select").change(switchCustomTagDisplay);
	// newItem.find(".card-select").selectpicker(selectPickerOptions);

	return newItem;
}

function applyPreset() {
	var presetName = $(this).val();
	var presetData = apPresets[presetName];

	$("#AP").empty();

	presetData.forEach(ap => {
		let newItem = addAP.call($("#addAP"));
		newItem.find('[name="amount"]').val(ap.amount);
		newItem.find('[name="points"]').val(ap.points);
		if (ap.page)
			newItem.find('[name="page"]').val(ap.page);
	});
}
