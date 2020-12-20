$(document).ready(function() {
	multipleOptions = document.cookie.split('; ').find(row => row.startsWith("sgpMultipleOptions"));
	if (multipleOptions) {
		multipleOptions = multipleOptions.split("=")[1] === 'true';
	} else {
		$('#settings').collapse('show');
		multipleOptions = true;
	}
	useItems = document.cookie.split('; ').find(row => row.startsWith("sgpUseItems"))
	useItems = useItems ? useItems.split("=")[1] === 'true' : true;

	if (multipleOptions) {
		$("#allActions").prop('checked', true);
	} else {
		$("#shortActions").prop('checked', true);
	}
	if (useItems) {
		$("#useItems").prop('checked', true);
	}
	const urlParams = new URLSearchParams(window.location.search);
	const character = urlParams.get('character');
	if (character) {
		openCharacterTab(character);
	}

	$("#shortActions").click(() => enableOptions(false));
	$("#allActions").click(() => enableOptions(true));
	$("#useItems").click(() => enableItemOptions($("#useItems").is(":checked")));
	enableOptions($("#allActions").is(":checked"));
	$('.big-nav>.nav-link, .small-nav>.nav-link').click(function() {syncButtons($(this), urlParams)});
});

function enableOptions(enableAll) {
	if (enableAll) {
		document.cookie = "sgpMultipleOptions=true; expires=Tue, 19 Jan 2038 00:00:00 UTC; SameSite=Lax";
		$(".movesShort").hide();
		$(".itemsShort").hide();
		$(".moves").show();
		if ($("#useItems").is(":checked")) {
			$(".items").show();
		} else {
			$(".items").hide();
		}
	} else {
		document.cookie = "sgpMultipleOptions=false; expires=Tue, 19 Jan 2038 00:00:00 UTC; SameSite=Lax";
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
		document.cookie = "sgpUseItems=true; expires=Tue, 19 Jan 2038 00:00:00 UTC; SameSite=Lax";
		if ($("#shortActions").is(":checked")) {
			$(".itemsShort").show();
		} else {
			$(".items").show();
		}
	} else {
		document.cookie = "sgpUseItems=false; expires=Tue, 19 Jan 2038 00:00:00 UTC; SameSite=Lax";
		$(".items").hide();
		$(".itemsShort").hide();
	}
}

function syncButtons(button, urlParams) {
	if (button.parent().hasClass('big-nav')) {
		$('.small-nav>.nav-link.active').removeClass('active');
		$('#'+button.attr('id')+'Small').addClass('active');
		urlParams.set('character', button.attr('id').replace('Pill', ''));
		console.log(urlParams)
	} else {
		$('.big-nav>.nav-link.active').removeClass('active');
		$('#'+button.attr('id').replace('Small', '')).addClass('active');
		urlParams.set('character', button.attr('id').replace('PillSmall', ''));
	}
	window.history.replaceState(null, null, `${window.location.pathname}${urlParams.toString()===''?'':'?'+urlParams.toString()}`);
}

function openCharacterTab(character) {
	$('.big-nav>.nav-link.active').removeClass('active');
	$('#'+character+'Pill').addClass('active');
	$('.small-nav>.nav-link.active').removeClass('active');
	$('#'+character+'PillSmall').addClass('active');
}