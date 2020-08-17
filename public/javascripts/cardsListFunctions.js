var typingTimer;
var doneTypingInterval = 500;
var changedCards = {};
var selectionMode = false;

$(document).ready(function(){
	resetFilters();
	$("form :input").on('click', formChanged);
	$("div#filters :input[type!=text]").on('change', filterApplied);
	$("input#nameFilter").on('input', inputChanged);
	$("#searchForm input").on('keypress', function(e) {
		if (e.which == '13') {
			e.preventDefault();
		}
	});
	$('#gotoDemon').on('click', scrollToSection);
	$('#gotoMemory').on('click', scrollToSection);
	$('button#resetFilters').on('click', function(e) {
		resetFilters();
		filterApplied();
	});
	$('button#manageCollection').on('click', switchSelection);
	$('.cardPreview a').on('click', cardClicked);
});

function formChanged(e) {
	var form = $(this).closest('form');
	var type = $(this).attr("type");
	if (type == 'checkbox') {
		var checkboxes = $(form).find('input[type=checkbox]:checked');
		var radio = $(form).find('input[type=radio]');
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

function filterApplied() {
	var filters = {};
	$("form").each(function() {
		var formId = $(this).attr("id");
		filters[formId] = "";
		$(this).find(":input[type=checkbox]:checked").each(function(index, obj) {
			if (index != 0) {
				filters[formId] += ", ";
			}
			filters[formId] += "." + $(obj).attr("name");
		});
	});
	var search = $('input#nameFilter').val();

	$(".cardPreview").fadeOut(400).promise().done(function() {
		var cards = $(".cardPreview");
		Object.keys(filters).forEach(function(key) {
			if (filters[key] != "")
				cards = $(cards).filter(filters[key]);
		});
		if (search != "") {
			cards =$(cards).filter(function() {
				var cardName = $(this).find("figcaption").text();
				return cardName.toLowerCase().includes(search.toLowerCase());
			});
		}
		cards.fadeIn(400);
	});
}

function resetFilters() {
	$("input[type=checkbox]").prop('checked', false);
	$("input[type=radio]").prop('checked', true);
	$("input[type=text]").val("");
}

function inputChanged(e) {
	clearTimeout(typingTimer);
	typingTimer = setTimeout(filterApplied, doneTypingInterval);
}

function scrollToSection(e) {
	var divId = $(this).attr('href');
	$('html, body').animate({
		scrollTop: $(divId).offset().top - 170
	}, 200);
}

function switchSelection() {
	if (!selectionMode) {
		$.ajax({
	        type: 'get',
	        url: '/collection/getOwnedCards'
	    })
	    .done(function(cardNames){
	    	$('button#manageCollection').text('Save');
	    	selectionMode = true;
			$('.cardPreview').filter(function() {
				return !cardNames.includes($(this).find('a').attr('href').replace('card/', ''));
			}).find('img').addClass('notSelectedCard');
	    });
	} else {
		if (Object.keys(changedCards).length > 0) {
			$.ajax({
		        type: 'post',
		        url: '/collection/updateOwnedCards',
        		contentType: 'application/json',
		        data: JSON.stringify({changedCards: changedCards})
		    })
		    .done(function(result){
		    	if (result === 'error') {
		    		//prompt user
		    		return;
		    	}
		    	changedCards = {};
		    	$('button#manageCollection').text('Manage collection');
		    	selectionMode = false;
				$('.cardPreview').find('img').removeClass('notSelectedCard');
		    });
		} else {
			changedCards = {};
			$('button#manageCollection').text('Manage collection');
	    	selectionMode = false;
			$('.cardPreview').find('img').removeClass('notSelectedCard');
		}
	}
}

function cardClicked(e) {
	if (!selectionMode)
		return;

	e.preventDefault();
	var image = $(this).find('img');
	if ($(image).hasClass('notSelectedCard')) {
		$(image).removeClass('notSelectedCard');
		if ($(this).attr('href').replace('card/', '') in changedCards) {
			delete changedCards[$(this).attr('href').replace('card/', '')];
		} else {
			changedCards[$(this).attr('href').replace('card/', '')] = true;
		}
	} else {
		$(image).addClass('notSelectedCard');
		if ($(this).attr('href').replace('card/', '') in changedCards) {
			delete changedCards[$(this).attr('href').replace('card/', '')];
		} else {
			changedCards[$(this).attr('href').replace('card/', '')] = false;
		}
	}
}