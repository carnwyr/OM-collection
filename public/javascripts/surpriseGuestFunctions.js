$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	var character = urlParams.get("character")?urlParams.get("character"):"Lucifer";

	updateSettingsOnLoad();
	openCharacterTab(character);

	$("#shortActions").click(() => enableOptions(false));
	$("#allActions").click(() => enableOptions(true));
	$("#useItems").click(() => enableItemOptions($("#useItems").is(":checked")));
	$(".big-nav>.nav-link, .small-nav>.nav-link").click(function() {syncButtons($(this), urlParams);});
	$("#settingsCollapser").click(() => {
		localStorage.setItem("displaySettings", !$("#settings").hasClass("show"));
	});
});

function enableOptions(enableAll) {
	localStorage.setItem("multipleOptions", enableAll);
	if (enableAll) {
		$(".movesShort, .itemsShort").hide();
		$(".moves").show();
		if ($("#useItems").is(":checked")) {
			$(".items").show();
		} else {
			$(".items").hide();
		}
	} else {
		$(".moves, .items").hide();
		$(".movesShort").show();
		if ($("#useItems").is(":checked")) {
			$(".itemsShort").show();
		} else {
			$(".itemsShort").hide();
		}
	}
}

function enableItemOptions(allowItems) {
	localStorage.setItem("useItems", allowItems);
	if (allowItems) {
		if ($("#shortActions").is(":checked")) {
			$(".itemsShort").show();
		} else {
			$(".items").show();
		}
	} else {
		$(".items, .itemsShort").hide();
	}
}

function syncButtons(button, urlParams) {
	if (button.parent().hasClass("big-nav")) {
		$("#"+button.attr("id")+"Small").tab("show");
		urlParams.set("character", button.attr("id").replace("Pill", ""));
	} else {
		$("#"+button.attr("id").replace("Small", "")).tab("show");
		urlParams.set("character", button.attr("id").replace("PillSmall", ""));
	}
	window.history.replaceState(null, null, `${window.location.pathname}${urlParams.toString()===""?"":"?"+urlParams.toString()}`);
}

function updateSettingsOnLoad() {
	var multipleOptions = localStorage.getItem("multipleOptions");
	var useItems = localStorage.getItem("useItems");
	var displaySettings = localStorage.getItem("displaySettings");

	// convert values
	if (multipleOptions === null) {
		multipleOptions = true;
	} else {
		multipleOptions = (multipleOptions === "true");
	}
	if (useItems === null) {
		useItems = true;
	} else {
		useItems = (useItems === "true");
	}
	if (displaySettings === null) {
		displaySettings = true;
		localStorage.setItem("displaySettings", false);
	} else {
		displaySettings = (displaySettings === "true");
	}

	if (multipleOptions) {
		$("#allActions").prop("checked", true);
	} else {
		$("#shortActions").prop("checked", true);
	}
	$("#useItems").prop("checked", useItems);
	enableOptions(multipleOptions);

	if (displaySettings) {
		$("#settings").collapse("show");
	}
}

function openCharacterTab(character) {
	$("#"+character+"Pill, #"+character+"PillSmall").tab("show");
}
