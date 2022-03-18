let originalData;
let selectPickerOptions = {
	liveSearch: true,
	style: '',
	styleBase: 'form-control mb-0',
	title: 'required item name'
};

$(document).ready(function() {
	originalData = JSON.stringify(getCardData());

	$("#name").on("focusout", fillUniqueName);

	$("#uploadL").on("change", {extra: "#imageResultL"}, imageUploaded);
	$("#uploadLB").on("change", {extra: "#imageResultLB"}, imageUploaded);
	$("#uploadS").on("change", {extra: "#imageResultS"}, imageUploaded);

	$("#submit").on("click", submitChange);  // function is in pug file

	$("#addEvent").on("click", addEvent);
	$("#removeEvent").on("click", removeEvent);

	$('.item-select').selectpicker(selectPickerOptions);
});

$(document).on("click", ".add-item", function() {
	let template = $(this).data("clone");
	$(this).parent().children("div:first-of-type").append($(template).html());
	$('.item-select').selectpicker(selectPickerOptions);
});
$(document).on("click", ".remove-item", function() {
	$(this).parent().remove();
});

function fillUniqueName() {
	var name = $("#name").val();
	var uniqueName = name.replace(/[\\/:*?"<>|]/g, "");
	uniqueName = uniqueName.replace(/ /g, "_");
	$("#uniqueName").val(uniqueName);
}

function imageUploaded(e) {
	if (this.files && this.files[0]) {
		var reader = new FileReader();
		var imageArea = e.data.extra;

		reader.onload = function (e) {
			$(imageArea).attr("src", e.target.result);
			$(imageArea).siblings("button").show();
		};
		reader.readAsDataURL(this.files[0]);
	}
}

function validateFields() {
	var uniqueName = $("#uniqueName").val();
	if (/[\\/:*?"<>| ]/.test(uniqueName)) {
		showAlert("danger", "Invalid unique name");
		return false;
	}
	if (!$("#name").val() || !uniqueName) {
		showAlert("danger", "Name and unique name must be filled");
		return false;
	}
	var images = $(".upload");
	for (let image of images) {
		let fileName = $(image).val();
		if (fileName) {
			let parts = fileName.split(".");
			let extension = parts[parts.length - 1];
			if (extension !== "jpg") {
				showAlert("danger", "All uploaded images must be jpg");
				return false;
			}
		}
	}
	return true;
}

function getCardData() {
	let data = {
		name: $("#name").val(),
		uniqueName: $("#uniqueName").val(),
		ja_name: $("#ja_name").val(),
		source: getCardSource("#source"),
		strength: getCardStrength(),
		type: $("#type").val(),
		rarity: $("#rarity").val(),
		attribute: $("#attribute").val(),
		characters: getSelectedCharacters(),
		dt: getTreeRewards(),
		number: $("#number").val(),
		isHidden: $("#isHidden")?$("#isHidden").prop("checked"):false
	};
	if (data.rarity === "UR+") {
		data.animation = {
			type: $("input[name='animationType']:checked").val(),
			link1: $("input#animation1").val(),
			link2: $("input#animation2").val()
		};
	}
	return data;
}

function getCardStrength() {
	let formData = new FormData($("div#strength>form")[0]);
	let data = {
		pride: [],
		greed: [],
		envy: [],
		wrath: [],
		lust: [],
		gluttony: [],
		sloth: []
	};

	for (var pair of formData.entries()) {
		data[pair[0]].push(pair[1]);
	}

	for (const key in data) {
		data[key] = {
			min: data[key][0],
			max: data[key][1],
			fdt: data[key][2]
		}
	}

	return data;
}

function getSelectedCharacters() {
	var arr = [];
	$("input[name=\"characters\"]:checked").each(function() {
		arr.push($(this).val());
	});
	return arr;
}

function getCardSource(src) {
	var list = $.map($(src).children(), input => $(input).val()).filter(x => x !== "");
	return list;
}

function addEvent() {
	var target = $(this).data("target");
	$(target).append("<input class=\"form-control\" type=\"text\">");
}

function removeEvent() {
	var target = $(this).data("target");
	$(target + " input:last-child").remove();
}

function getTreeRewards() {
	let rewards = [];

	$("div#dt-content form").each(function() {
		let formData = new FormData(this);
		let node = { requirements: [] };
		let name;
		for(let pair of formData.entries()) {
			console.log(pair);
			if (pair[0] === "name") {
				name = pair[1];
			} else if (pair[0] === "amount") {
				node.requirements.push({ name: name, amount: pair[1] });
			} else {
				node[pair[0]] = pair[1];
			}
		}
		rewards.push(node);
	});

	rewards = rewards.filter(x => x.reward && x.type);

	return rewards;
}
