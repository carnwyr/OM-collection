$(document).ready(function() {
	$("#shortActions").click(() => enableOptions(false));
	$("#allActions").click(() => enableOptions(true));
	$("#useItems").click(() => enableItemOptions($("#useItems").is(":checked")));
	enableOptions($("#allActions").is(":checked"));
});

function enableOptions(enableAll) {
	if (enableAll) {
		$(".movesShort").hide();
		$(".itemsShort").hide();
		$(".moves").show();
		if ($("#useItems").is(":checked")) {
			$(".items").show();
		} else {
			$(".items").hide();
		}
	} else {
		$(".moves").hide();
		$(".items").hide();
		$(".movesShort").show();
		if ($("#useItems").is(":checked")) {
			$(".itemsShort").show();
		} else {
			$(".itemsShort").hide();
		}
	}
}

function enableItemOptions(allowItems) {
	if (allowItems) {
		if ($("#shortActions").is(":checked")) {
			$(".itemsShort").show();
		} else {
			$(".items").show();
		}
	} else {
		$(".items").hide();
		$(".itemsShort").hide();
	}
}