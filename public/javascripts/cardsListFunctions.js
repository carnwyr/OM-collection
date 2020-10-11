const doneTypingInterval = 500;

var typingTimer;
var changedCards = {};
var selectionMode = false;

$(document).ready(function(){
	$(".img-max").css("transition", "all .5s ease");
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
	$('button#manageCollection').on('click', switchSelectionMode);
	$('button#saveManaging').on('click', switchSelectionMode);
	$('.cardPreview').on('click', cardClicked);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });
	$('#expandFilters').on('click', function() { $(this).text($(this).text() === "Filters" ? "Hide filters" : "Filters"); })

	$("#shareCollection").on("click", () => { $("#userLink").val(window.location.href); });
	$("#copyLink").on("click", copyCollectionLink);
	$('#openLink').on('show.bs.modal', loadStatsImage);

	$("#b2t").on('click', () => $("html, body").animate({ scrollTop: 0 }, 1024));

	$(window).scroll(switchBackToTopButton);
	switchBackToTopButton();

	fillRank("demonSection");
	fillRank("memorySection");
});

function switchBackToTopButton() {
	if ($(window).scrollTop() > 64) {
		$("#b2t").fadeIn();
	} else {
		$("#b2t").fadeOut();
	}
}

function fillRank(container, cardsCount) {
	$('#'+container).find('.placeholder').remove();
	var visibleCardsCount = cardsCount ? cardsCount : $('#'+container).find('.cardPreview').filter(function() { return $(this).css('display') !== 'none'; }).length;

	if (visibleCardsCount > 0) {
		var html = '<div class="invisible placeholder mb-2 h-100">placeholder placeholder placeholder</div>';

		var currentCardsInRow = getRowCapacity();

		if (visibleCardsCount % currentCardsInRow === 0) { return; }
		else { var cardsToAdd = currentCardsInRow - visibleCardsCount % currentCardsInRow; }

		for (let i = 0; i < cardsToAdd; i++) {
			$('#'+container).append(html);
		}
	} else {
		var html = '<p class="col-12 text-muted placeholder" style="max-width: none !important;">No matching cards</p>';
		$('#'+container).append(html);
	}
}

function getRowCapacity() {
	// max number of cards for xs is 4, on smaller screens it's reduced by 1
	const cardsInRow = {576: Math.floor(($(window).width() - 100) / 100), 768: 4, 992: 6, 1200: 8, xl: 9};
	for (let [screen, cards] of Object.entries(cardsInRow)) {
		if (screen === "xl" || $(window).width() <= screen) {
			return cards;
		}
	}
}

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
	var filters = getFiltersAsStrings();
	var search = $('input#nameFilter').val();
	var originalPosition = $(window).scrollTop();
	if ($('.cardPreview:visible').length > 0)
		var cardHeight = $($('.cardPreview:visible')[0]).height()
	else
		var cardHeight = 100;

	$(".cardPreview").fadeOut(400).promise().done(function() {
		var cardsToDisplay = filterCardsToDisplay($(".cardPreview"), filters, search);

		var currentCardsInRow = getRowCapacity();
		var maxRowsOnScreen = Math.ceil($(window).height() / cardHeight);
		var maxVisibleCards = currentCardsInRow * maxRowsOnScreen;

		if(cardsToDisplay.slice(maxVisibleCards).length > 0) {
			var showCards = function() { $(cardsToDisplay.slice(maxVisibleCards)).css('display', 'block') }	;
			applyEffectWithoutTransition($(cardsToDisplay.slice(maxVisibleCards)).find('.img-max'), showCards);
		}
		$(cardsToDisplay.slice(0, maxVisibleCards)).fadeIn(400);

		$(window).scrollTop(originalPosition);

		fillRank("demonSection", $(cardsToDisplay).filter(function() { $(this).parent().attr('id') === '#demonSection'; }).length);
		fillRank("memorySection", $(cardsToDisplay).filter(function() { $(this).parent().attr('id') === '#memorySection'; }).length);
	});
}

function getFiltersAsStrings() {
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
	return filters;
}

function filterCardsToDisplay(cards, filters, search) {
	Object.keys(filters).forEach(function(key) {
		if (filters[key] != "")
			cards = $(cards).filter(filters[key]);
	});
	if (search != "") {
		cards =$(cards).filter(function() {
			var cardName = $(this).find(".figure-caption").text();
			return cardName.toLowerCase().includes(search.toLowerCase());
		});
	}
	return cards;
}

function applyEffectWithoutTransition(elements, effect, args) {
	if (elements.length === 0) {
		effect(args);
		return;
	}
	elements.addClass('no-transition');
	effect(args);
	elements[0].offsetHeight;
	elements.removeClass('no-transition');
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
	if ($(window).width() < 768)
		var sectionHeaderOffset = 175;
	else
		var sectionHeaderOffset = 150;
	$('html, body').animate({
		scrollTop: $(divId).offset().top - sectionHeaderOffset
	}, 200);
}

function switchSelectionMode() {
	if (!selectionMode) {
		$.ajax({
			type: 'get',
			url: '/collection/getOwnedCards'
		})
		.done(function(cardNames){
			selectionMode = true;
			switchManagementButtons();
			switchCardsSelection(cardNames)
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
					showAlert("div#failAlert", "Something went wrong, please reload the page");
					return;
				}
				changedCards = {};
				selectionMode = false;
				switchManagementButtons();
				switchCardsSelection()
				showAlert("div#successAlert", "Collection modified successfully");
			});
		} else {
			changedCards = {};
			selectionMode = false;
			switchManagementButtons();
			switchCardsSelection()
		}
	}
}

function switchManagementButtons() {
	if (selectionMode) {
		$('button#manageCollection').addClass('d-none');
		$('div#manageButtons').removeClass('d-none');
		$('div#selectionButtons').removeClass('d-none');
	}
	else {
		$('button#manageCollection').removeClass('d-none');
		$('div#manageButtons').addClass('d-none');
		$('div#selectionButtons').addClass('d-none');
	}
}

function switchCardsSelection(cardNames) {
	var oldHeight = $(document).height();
	var oldScrollTop = $(window).scrollTop();

	var invisibleCards = $('.cardPreview').filter(function() {
		return !$(this).isInViewport();
	}).find('img.img-max');

	if (selectionMode) {
		var selectOwnedCards = function(cardNames) { $('.cardPreview').filter(function() {
			return !cardNames.includes($(this).attr('href').replace('card/', ''));
		}).find('img').addClass('notSelectedCard') };
		applyEffectWithoutTransition(invisibleCards, selectOwnedCards, cardNames);
	} else {
		var removeNonSelectedEffect = function() { $('.cardPreview').find('img').removeClass('notSelectedCard'); }
		applyEffectWithoutTransition(invisibleCards, removeNonSelectedEffect);
	}

	var newHeight = $(document).height();
	var demonSectionOffset = $('#demonSection').offset().top;
	$('html, body').animate({
		scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
	}, 500);
}

$.fn.isInViewport = function () {
	let elementTop = $(this).offset().top;
	let elementBottom = elementTop + $(this).outerHeight();

	let viewportTop = $(window).scrollTop();
	let viewportBottom = viewportTop + $(window).height();

	return elementBottom > viewportTop && elementTop < viewportBottom;
}

function showAlert(alert, message) {
	$(alert).html(message);
    $(alert).show().animate({top: 65}, 500);
    setTimeout(function () {
        $(alert).animate({top: -100}, 500).promise().done(function() {$(alert).hide()})
      }, 2000);
}

function cardClicked(e) {
	if (!selectionMode)
		return;
	if (e)
		e.preventDefault();

	var image = $(this).find('img');
	var cardName = $(this).attr('href').replace('card/', '');

	if ($(image).hasClass('notSelectedCard')) {
		$(image).removeClass('notSelectedCard');
		if (cardName in changedCards) {
			delete changedCards[cardName];
		} else {
			changedCards[cardName] = true;
		}
	} else {
		$(image).addClass('notSelectedCard');
		if (cardName in changedCards) {
			delete changedCards[cardName];
		} else {
			changedCards[cardName] = false;
		}
	}
}

function switchSelectionAll(select) {
	var cardsToSwitch = $('.cardPreview:visible').filter(function() { return select === $(this).find('img').hasClass('notSelectedCard'); });
	if (cardsToSwitch.length == 0)
		return;

	var oldHeight = $(document).height();
	var oldScrollTop = $(window).scrollTop();

	var cardImages = $(cardsToSwitch).filter(function() {
		return !$(this).isInViewport();
	}).find('img.img-max');

	if (select) {
		var changeSelection = function() { $(cardsToSwitch).find('img').removeClass('notSelectedCard'); }
	} else {
		var changeSelection = function() { $(cardsToSwitch).find('img').addClass('notSelectedCard'); }
	}

	applyEffectWithoutTransition(cardImages, changeSelection);

	var newHeight = $(document).height();
	var demonSectionOffset = $('#demonSection').offset().top;
	$('html, body').animate({
		scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
	}, 500);

	addCardsToChangedList(cardsToSwitch, select)
}

function addCardsToChangedList(cardsToSwitch, select) {
	var cardNames = [];
	for (var i=0; typeof(cardsToSwitch[i])!='undefined'; cardNames.push(cardsToSwitch[i++].getAttribute('href').replace('card/', '')));
	for (const [key, value] of Object.entries(changedCards)) {
		if (cardNames.includes(key)) {
			delete changedCards[key];
			cardNames.splice(cardNames.indexOf(key), 1);
		}
	}
	cardNames.forEach(function(name) {
		changedCards[name] = select;
	});
}

function copyCollectionLink() {
	var copyText = document.getElementById("userLink");
	copyText.select();
	copyText.setSelectionRange(0, 9999);
	document.execCommand("copy");
	showAlert("div#successAlert", "Link successfully copied!");
}

function loadStatsImage(e) {
	var html = prepareHtml();
	$('#statsMessage').html("");
	$('#statsImage').attr('src', "");
	var spinner = $('#statsSpinner').show();
	$.ajax({
		type: 'post',
		url: './getStatsImage',
		data: {html: html}
	})
	.done(function(imageData){
		spinner.hide();
		if(imageData) {
			/*var canvas = document.createElement('canvas');
			var context = canvas.getContext("2d");

			var total = new Image();
			var chars = new Image();
			var sideChars = new Image();
			var rarity = new Image();
			total.scr = imageData[0];
			chars.scr = imageData[1];
			sideChars.scr = imageData[2];
			rarity.scr = imageData[3];

			context.drawImage(total, 0, 0);
			context.drawImage(chars, 0, total.height);
			context.drawImage(sideChars, 0, total.height + chars.height);
			context.drawImage(rarity, 0, total.height + chars.height + rarity.height);

			var img = canvas.toDataURL("image/png");*/

			$('#statsImage').attr('src', imageData);
		} else {
			$('#statsMessage').html("Sorry, couldn't load the image");
		}
	});
}

function prepareHtml() {
	var head = $(document.head.cloneNode(true));
	var links = $('body link').clone().appendTo(head);
	$(head).find('link').each(function() {
		if ($(this).attr('href')==='/stylesheets/style.css') {
			$(this).remove();
			return;
		}
		if ($(this).attr('href')[0]==='/') {
			$(this).attr('href', "http://localhost:3000" + $(this).attr('href'));
		}
	});
	
	var body = document.createElement('body');
	var container = document.createElement('div');
	container.className = 'container-fluid';

	container.appendChild(document.getElementById('statsTotal').cloneNode(true));
	$(container).find('#statsTotal').attr('style', 'max-width: 400px');
	$(container).find('#statsTotal').addClass('mb-3');
	container.appendChild(document.getElementById('charNav').cloneNode(true));
	$(container).find('#charNav').addClass('mb-4');
	container.appendChild(document.getElementById('sideCharNav').cloneNode(true));
	$(container).find('#sideCharNav').addClass('show active mb-4');
	container.appendChild(document.getElementById('rarityNav').cloneNode(true));
	$(container).find('#rarityNav').addClass('show active mb-4');
	container.appendChild(document.createElement('div'));

	var newHTML = document.implementation.createHTMLDocument();
	$(head).children().appendTo($(newHTML).find('head')[0]);
	newHTML.body.appendChild(container);
	return new XMLSerializer().serializeToString(newHTML);
}