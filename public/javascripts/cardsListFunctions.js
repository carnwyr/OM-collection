$(document).ready(function(){
	resetFilters();
	$("form#rarityForm :input").on('click', formChanged);
	$("div#filters :input").on('change', filterApplied);
});

function formChanged(e) {
	var form = $(this).closest('form');
	var type = $(this).attr("type");
	if (type == 'checkbox') {
		var checkboxes = $(form).find('input[type=checkbox]:checked');
		var radio = $(form).find('input[type=radio');
		if (checkboxes.length == 0) {
			$(radio).prop('checked', true);
		}
		else if ($(radio).prop('checked')) {
			$(radio).prop('checked', false);
		}
	}
	if (type == 'radio') {
		var checkboxes = $(form).find('input[type=checkbox]:checked');
		if ($(this).prop('checked')) {
			$(checkboxes).each(function() {
				$(this).prop('checked', false);
			});
		}
	}
}

function filterApplied(e) {
	var rarity = "";
	$("form#rarityForm :input[type=checkbox]:checked").each(function(index, obj) {
		if (index != 0) {
			rarity += ", ";
		}
        rarity += "." + $(obj).attr("name");
    });
	$(".cardPreview").fadeOut(400).promise().done(function() {
		if (rarity != "") {
			$(".cardPreview").filter(rarity).fadeIn(400);
			//$(".cardPreview").filter(':not('+rarity+')').addClass("hidden");
		} else {
			$(".cardPreview").fadeIn(400);
		}
	});
}

function resetFilters() {
	$("input[type=checkbox]").prop('checked', false);
	$("input[type=radio]").prop('checked', true);
}