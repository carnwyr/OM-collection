const doneTypingInterval = 500;
var typingTimer;
var changedCards = {};
var selectionMode = false;
var viewType = "icon";
var showCards = "";
var ownedCards = [];
var querystr = new URLSearchParams(document.location.search.substring(1));

$(document).ready(function() {
	resetFilters();
	if ('URLSearchParams' in window) {
		applyQuery();
	} else {
		$("#demonWrapper, #memoryWrapper").removeClass("invisible");
	}

	$("img.lazy").on("load", function() { $(this).removeClass("lazy"); });
	$("img.lazy").each(function() {
		if (this.complete && this.naturalHeight !== 0) {
			$(this).removeClass("lazy");
		}
	});

	$("form input").on('click', updateFilters);
	$("div#filters input").on('change', applyFilters);
	$("input#nameFilter").on('input', inputChanged);
	$("#searchForm input").on('keypress', function(e) {
		if (e.which == '13') {
			e.preventDefault();
		}
	});
	$("#gotoDemon, #gotoMemory").on("click", scrollToSection);
	$("div#resetFilters>a").on("click", function(e) {
		for (param of querystr.keys()) {
			if (param !== "view") {
				querystr.delete(param);
			}
		}
		resetFilters();
		applyFilters();
	});
	$('button#manageCollection, button#saveManaging').on('click', switchSelectionMode);
	$('.cardPreview').on('click', cardClicked);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });

	$(".viewBtn").on('click', function() { switchViewOption($(this).data('viewmode')) });

	fillRank("demonSection");
	fillRank("memorySection");

	$(window).on('beforeunload', () => {if (Object.keys(changedCards).length > 0) return confirm("Do you want to leave without saving your collection?");});

	$('#viewMenuDropdown, .dropdown-menu').hover(function() {
		$(this).parent().find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
	}, function() {
		$(this).parent().find('.dropdown-menu').first().stop(true, true).delay(250).slideUp();
	});
});

function fillRank(container) {
	$('#'+container).find('.placeholder').remove();
	var visibleCardsCount = $(`#${container}>.cardPreview`).filter(function() {
		return $(this).css("display") !== "none";
	}).length;

	var html;
	if (visibleCardsCount > 0) {
		var currentCardsInRow = getRowCapacity();
		if (visibleCardsCount % currentCardsInRow === 0) return;
		var cardsToAdd = currentCardsInRow - visibleCardsCount % currentCardsInRow;

		if (viewType == "icon") {
			html = '<div class="invisible placeholder icon-container w-100 m-1"></div>';
		} else {
			html = '<div class="invisible placeholder full-container w-100 m-1"></div>';
		}

		for (let i = 0; i < cardsToAdd; i++) {
			$('#'+container).append(html);
		}
	} else {
		html = '<p class="col-12 text-muted placeholder">No matching cards</p>';
		$('#'+container).append(html);
	}
}

function getRowCapacity() {
	// max number of cards for xs is 4, on smaller screens it's reduced by 1 (possibly outdated)
	var cardsInRow;
	if (viewType === "icon") {
		cardsInRow = {576: Math.floor(($(window).width() - 100) / 100), 768: 6, 992: 6, 1200: 7, xl: 9};
	} else {
		cardsInRow = {576: Math.floor(($(window).width() - 100) / 100), 768: 4, 992: 3, 1200: 4, xl: 5};
	}

	for (let [screen, cards] of Object.entries(cardsInRow)) {
		if (screen === "xl" || $(window).width() <= screen) {
			return cards;
		}
	}
}

function updateFilters(e) {
	var form = $(this).closest("form");
	var type = $(this).attr("type");
	if (type == 'checkbox') {
		var checkboxes = $(form).find('input[type=checkbox]:checked');
		var radio = $(form).find('input[type=radio]');
		if (checkboxes.length == 0) {
			$(radio).prop('checked', true);
		} else if ($(radio).prop('checked')) {
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
	applyFilters();
}

async function applyFilters() {
	var filters = getFiltersAsStrings();
	var search = $('input#nameFilter').val();

	if (search !== '') {
		querystr.set("search", search);
	}

	if ($('#checkCardsNotOwned').prop('checked')) {
		showCards = "NotOwned";
	} else if ($('#checkCardsOwned').prop('checked')) {
		showCards = "Owned";
	} else {
		showCards = '';
	}

	if (showCards !== '') {
		querystr.set("cards", showCards);
		ownedCards = await $.ajax({
			type: 'get',
			url: '/collection/getOwnedCards',
			cache: false
		});
	} else {
		querystr.delete("cards");
	}
	updateQuery();
	updateCardDisplay(filterCardsToDisplay($(".cardPreview"), filters, search, ownedCards));
}

function getFiltersAsStrings() {
	var filters = {};
	$("#filters form").each(function() {
		var formId = $(this).attr("id");
		var param = formId.slice(0, -4);
		var entries = "";
		filters[formId] = "";

		$(this).find("input[type=checkbox]:checked").each(function(index, obj) {
			if (index != 0) {
				filters[formId] += ", ";
				entries += " ";
			}
			filters[formId] += "." + $(obj).attr("value");
			entries += $(obj).attr("value");
		});

		if (entries !== '') {
			querystr.set(param, entries);
		} else if (param !== "search") {
			querystr.delete(param);
		} else if ($('input#nameFilter').val() === '') {
			querystr.delete(param);
		}
	});

	updateQuery();
	return filters;
}

function updateQuery() {
	window.history.replaceState(null, null, `${window.location.pathname}${querystr.toString()===''?'':'?'+querystr.toString()}`);
}

function updateCardDisplay(cards, view) {
	$(".cardPreview").fadeOut(400).promise().done(function() {
		if (view) {
			$('.cardPreview>img').each(function() {
				$(this).attr('src', changes[view]['srcAction'](this));
			});

			changes[view]['fullViewAction']($('.cardPreview'));
			$('.cardPreview>img').addClass("lazy");
		}

		var cardHeight = $(cards[0]).height();
		var currentCardsInRow = getRowCapacity();
		var maxRowsOnScreen = Math.ceil($(window).height() / cardHeight);
		var maxVisibleCards = currentCardsInRow * maxRowsOnScreen;

		if(cards.slice(maxVisibleCards).length > 0) {
			var cardsOnDisplay = function() { $(cards.slice(maxVisibleCards)).css('display', 'block') };
			applyEffectWithoutTransition($(cards.slice(maxVisibleCards)).find('img'), cardsOnDisplay);
		}
		$(cards.slice(0, maxVisibleCards)).fadeIn(400);

		fillRank("demonSection");
		fillRank("memorySection");

		$("#demonWrapper, #memoryWrapper").removeClass("invisible");
	});
}

function filterCardsToDisplay(cards, filters, search, excludedCards) {
	Object.keys(filters).forEach(function(key) {
		if (filters[key] !== "") cards = $(cards).filter(filters[key]);
	});
	cards = $(cards).filter(function() {
		var cardName = $(this).find("figcaption").text();
		var isSearched = search !== "" ? cardName.toLowerCase().includes(search.toLowerCase()) : true;
		var uniqueCardName = $("img", this).attr('src').slice(16, -4);
		if (showCards === "Owned") {
			var toShow = excludedCards.includes(uniqueCardName);
		} else if (showCards === "NotOwned") {
			var toShow = !excludedCards.includes(uniqueCardName);
		} else {
			var toShow = true;
		}
		return isSearched && toShow;
	});
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
	$("#filters input[type=radio]").prop("checked", true);
	$("#filters input[type=checkbox]").prop("checked", false);
	$("#filters input[type=text]").val("");
	$("#checkCardsAll").prop("checked", true);
}

function inputChanged(e) {
	clearTimeout(typingTimer);
	typingTimer = setTimeout(applyFilters, doneTypingInterval);
}

function scrollToSection(e) {
	var divId = $(this).attr('href');
	if ($(window).width() < 768)
		var sectionHeaderOffset = 175;
	else
		var sectionHeaderOffset = 150;

	$('html, body').animate({scrollTop:$(divId).offset().top - sectionHeaderOffset}, 500);
}

function switchSelectionMode() {
	if (!selectionMode) {
		$.ajax({
			type: 'get',
			url: '/collection/getOwnedCards',
			cache: false
		})
		.done(function(cardNames) {
			selectionMode = true;
			switchManagementButtons();
			switchCardsSelection(cardNames);
		});
	} else {
		if (Object.keys(changedCards).length > 0) {
			$.ajax({
				type: 'post',
				url: '/collection/modifyCollection',
				contentType: 'application/json',
				data: JSON.stringify({changedCards: changedCards, collection: "owned"}),
				cache: false
			})
			.done(function(result) {
				if (result.err) {
					showAlert("danger", result.message);
					return;
				}
				changedCards = {};
				selectionMode = false;
				switchManagementButtons();
				switchCardsSelection();
				showAlert("success", "Collection updated!");
			});
		} else {
			changedCards = {};
			selectionMode = false;
			switchManagementButtons();
			switchCardsSelection();
		}
	}
}

function switchManagementButtons() {
	if (selectionMode) {
		$('button#manageCollection').addClass('d-none');
		$('div#manageButtons').removeClass('d-none');
		$('div#selectionButtons').removeClass('d-none');
	} else {
		$('button#manageCollection').removeClass('d-none');
		$('div#manageButtons').addClass('d-none');
		$('div#selectionButtons').addClass('d-none');
	}
}

function switchCardsSelection(cardNames) {
	var invisibleCards = $('.cardPreview').filter(function() {
		return !$(this).isInViewport();
	}).find('img');

	if (selectionMode) {
		var selectOwnedCards = function(cardNames) {
			$('.cardPreview').filter(function() {
				return !cardNames.includes($("img", this).attr('src').slice(16, -4));
			}).find('img').addClass('notSelectedCard');
		};
		applyEffectWithoutTransition(invisibleCards, selectOwnedCards, cardNames);
	} else {
		var removeNonSelectedEffect = function() { $('.cardPreview').find('img').removeClass('notSelectedCard'); }
		applyEffectWithoutTransition(invisibleCards, removeNonSelectedEffect);
	}
}

$.fn.isInViewport = function () {
	let elementTop = $(this).offset().top;
	let elementBottom = elementTop + $(this).outerHeight();

	let viewportTop = $(window).scrollTop();
	let viewportBottom = viewportTop + $(window).height();

	return elementBottom > viewportTop && elementTop < viewportBottom;
}

function cardClicked(e) {
	if (!selectionMode) return;
	if (e) e.preventDefault();

	var image = $(this).find('img');
	var cardName = $("img", this).attr('src').slice(16, -4);

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
	if (cardsToSwitch.length == 0) return;

	var cardImages = $(cardsToSwitch).filter(function() {
		return !$(this).isInViewport();
	}).find('img');

	if (select) {
		var changeSelection = function() { $(cardsToSwitch).find('img').removeClass('notSelectedCard'); }
	} else {
		var changeSelection = function() { $(cardsToSwitch).find('img').addClass('notSelectedCard'); }
	}

	applyEffectWithoutTransition(cardImages, changeSelection);
	addCardsToChangedList(cardsToSwitch, select);
}

function addCardsToChangedList(cardsToSwitch, select) {
	var cardNames = [];
	for (var i=0; typeof(cardsToSwitch[i])!='undefined'; cardNames.push(cardsToSwitch[i++].childNodes[0].getAttribute('src').slice(16, -4)));
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

/***/
const removeFullImageClass = function(target) { $(target).removeClass('full-container').addClass("icon-container"); }
const addFullImageClass = function(target) { $(target).removeClass("icon-container").addClass('full-container'); }
const replaceSToL = function(target) { return target.replace('/S/', '/L/'); }
const replaceLToS = function(target) { return target.replace('/L/', '/S/'); }
const removeBloom = function(target) { return target.replace('_b.jpg', '.jpg'); }
const makeBloomed = function(target) { return target.replace('.jpg', '_b.jpg'); }

const changes = {
	'icon': {
		'dropdownText': i18next["icon_view"],
		'fullViewAction': removeFullImageClass,
		'srcAction': function (target) { return removeBloom(replaceLToS($(target).attr('src'))); }
	},
	'original': {
		'dropdownText': i18next["full_original"],
		'fullViewAction': addFullImageClass,
		'srcAction': function (target) { return removeBloom(replaceSToL($(target).attr('src'))); }
	},
	'bloomed': {
		'dropdownText': i18next["full_bloomed"],
		'fullViewAction': addFullImageClass,
		'srcAction': function (target) {
			if ($(target).parent().parent().attr('id') === 'demonSection') return makeBloomed(replaceSToL($(target).attr('src')));
			else return replaceSToL($(target).attr('src'));
		}
	}
};
/***/

function switchViewOption(changeViewTo) {
	if (viewType === changeViewTo) return;

	var cardsToDisplay = $(".cardPreview:visible");
	viewType = changeViewTo;
	querystr.set("view", viewType);

	$("#viewMenuDropdown").text(changes[viewType]['dropdownText']);
	for (var mode in changes) {
		if (mode == viewType) {
			$("." + mode + "ViewBtn>span").removeClass("font-weight-normal").addClass("font-weight-bold text-primary");
		} else {
			$("." + mode + "ViewBtn>span").removeClass("font-weight-bold text-primary").addClass("font-weight-normal");
		}
	}

	updateCardDisplay($(".cardPreview:visible"), viewType);
	updateQuery();
}

async function applyQuery() {
	resetFilters();
	if (querystr.toString() === '' || querystr.toString() === "view=icon") {
		history.scrollRestoration = "auto";
		$("#demonWrapper, #memoryWrapper").removeClass("invisible");
		return;
	} else {
		history.scrollRestoration = "manual";
	}

	for (param of querystr.keys()) {
		var filterList = querystr.get(param).split(" ");
		var isFilter = ["character", "rarity", "attribute"].includes(param);

		if (isFilter) {
			if (filterList.length !== 0) {
				$(`input[type=radio][name=${param}]`).prop('checked', false);
				filterList.forEach(f => {
					$(`input[value=${f}]`).prop("checked", true);
				});
			}
		} else if (param === "search") {
			$('input#nameFilter').val(querystr.get(param));
		} else if (param === "cards") {
			if (!$("#checkCardsOwned").prop("disabled")) {
				showCards = querystr.get("cards");
				$("#checkCards"+showCards).prop("checked", true);
				ownedCards = await $.ajax({
					type: 'get',
					url: '/collection/getOwnedCards',
					cache: false
				});
			} else {
				querystr.delete("cards");
			}
		}
	}

	if (["bloomed", "original", "icon"].includes(querystr.get("view"))) {
		viewType = querystr.get("view");
	}

	$("#viewMenuDropdown").text(changes[viewType]['dropdownText']);
	for (var mode in changes) {
		if (mode == viewType) {
			$("." + mode + "ViewBtn>span").removeClass("font-weight-normal").addClass("font-weight-bold text-primary");
		} else {
			$("." + mode + "ViewBtn>span").removeClass("font-weight-bold text-primary").addClass("font-weight-normal");
		}
	}

	updateCardDisplay(filterCardsToDisplay($(".cardPreview"), getFiltersAsStrings(), $('input#nameFilter').val(), ownedCards), viewType);
}
