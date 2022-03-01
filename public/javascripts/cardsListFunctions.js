var changedCards = {};
var selectionMode = false;
var ownedCards = [];
var querystr = new URLSearchParams(document.location.search);

//#region constants
const splitCardsByVisibility = (cards, currentCard) => {
	let cardImage = $(currentCard).find('img');
	if ($(currentCard).isInViewport()) {
		cards.visible.push(cardImage);
	} else {
		cards.invisible.push(cardImage);
	}
	return cards;
};
//#endregion

// TODO: create a single listener that controls all hover effects for dropdowns.

// add fade effect when displaying cards
// update tabber view
// add translations


$(document).ready(function() {
	initInfiniteScroll();

	$("#search, #filters form").on("submit", applyFilters);
	$("#filters form input").change(udpateFilterParams);
	$("#resetFilters").click(resetFilters);
	$("#viewMenuDropdown a").click(updateViewType);

	$('#demoncards>div, #memorycards>div').on('click', ".cardPreview", cardClicked);

	$('button#manageCollection, button#saveManaging').on('click', switchSelectionMode);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });

	$(window).on('beforeunload', () => { if (Object.keys(changedCards).length > 0) return confirm("Do you want to leave without saving your collection?"); });
});

// TODO: change itemsPerPage to fill rank.
// TODO: added too many placeholders.
function createCardDocuments(data, pageIndex) {
	let frag = document.createDocumentFragment();
  let itemsPerPage = 100;
  let totalPages = Math.ceil(data.length / itemsPerPage);
  let offset = pageIndex * itemsPerPage;

  for (let i = offset, len = offset + itemsPerPage; i < len; i++) {
    let item = createCardElement(data[i]);
    frag.appendChild(item);
  }

	let hasNextPage = pageIndex < totalPages - 1;

	return { frag: frag, hasNextPage: hasNextPage };
}

function createCardElement(card) {
	var template, img_src;
	var imageSize = 'S', containerSize = "icon-container", viewtype = querystr.get('view');
	if (viewtype === 'original' || viewtype === "bloomed") {
		imageSize = 'L';
		containerSize = "full-container";
	}
	if (!card) {
		template = `<a class='cardPreview ${containerSize} placeholder'></a>`;
	} else {
		let bloomed = '';
		if (viewtype === 'bloomed' && card.type === "Demon") {
			bloomed = '_b';
		}
		img_src = `/images/cards/${imageSize}/${card.uniqueName}${bloomed}.jpg`;
	  template =
			`<a class="cardPreview ${containerSize}" href="card/${card.uniqueName}">
				<img class="lazy" loading="lazy" data-src="${img_src}">
				<figcaption>${card.name}</figcaption>
			</a>`;
	}

  let item = document.createElement('div');
  item.innerHTML = template.trim();

	if (selectionMode) {
		// check if card is owned,
		// add selected card/ not selected based on outcome
	}

	if (selectionMode && card) {
		let cardSelectionChanged = card.uniqueName in changedCards;
		let cardOwned = ownedCards.includes(card.uniqueName);
		let cardNotSelected = cardSelectionChanged == cardOwned;
		if (cardNotSelected) {
			$(item).find('img').addClass("notSelectedCard");
		}
	}

  return item.firstChild;
}

function applyFilters(e) {
	e.preventDefault();

	// update query string
	var filters = new FormData($("#filters form")[0]);
	var params = new URLSearchParams();

	for (let [key, value] of filters.entries()) {
		if (value) params.append(key, value);
	}

	if (params.get("cards") === "all") params.delete("cards");

	var search = $("input[name='search']").val();
	if (search) params.set("search", search);

	if (querystr.get("view")) params.set('view', querystr.get("view"));

	if (params.toString() === document.location.search.substring(1)) return;

	querystr = new URLSearchParams(params.toString());
	updateURL();

	$("#demoncards>div, #memorycards>div").html("Loading...");

	// request cards
	var collectionPath = window.location.pathname.split('/').at(-1);
	params.set("path", collectionPath);
	if (collectionPath === "favourites" || collectionPath === "collection") {
		params.set("user", window.location.pathname.split('/').at(-2));
	}
	$.get("/getCards?" + params.toString(), function(data) {
		if (data.err) {
			showAlert("danger", "Something went wrong");
			return;
		}
		cardList = data.cards;
		initInfiniteScroll();
	});
}

function updateURL() {
	window.history.replaceState(null, '', `${window.location.pathname}?${querystr.toString()}`);
}

function updateViewType() {
	var currentView = querystr.get("view");
	var newView = $(this).data("viewtype");
	if (newView === currentView) return;

	$("#viewMenuDropdown>button").text($(this).text());
	$(`a[data-viewtype=${currentView}]`).removeClass("text-primary font-weight-bold");
	$(this).addClass("text-primary font-weight-bold");

	querystr.set("view", $(this).data("viewtype"));

	initInfiniteScroll();
	updateURL();
}

function initInfiniteScroll() {
	$("#demoncards>div, #memorycards>div").html("");

	var demonCards = cardList.filter(card => card.type === "Demon");
	var memoryCards = cardList.filter(card => card.type === "Memory");

	if (demonCards.length !== 0) {
		var nextHandler = function(pageIndex) {
		  var result = createCardDocuments(demonCards, pageIndex);
		  return this.append(Array.from(result.frag.childNodes))
				.then(() => result.hasNextPage);
		};
		var ias = new InfiniteAjaxScroll('#demoncards>div', {
			item: '.cardPreview',
			next: nextHandler,
			// logger: false
		});
		$("#demoncards>p").addClass("d-none");
	} else {
		$("#demoncards>p").removeClass("d-none");
	}

	if (memoryCards.length !== 0) {
		var nextHandler2 = function(pageIndex) {
			var result = createCardDocuments(memoryCards, pageIndex);
		  return this.append(Array.from(result.frag.childNodes))
				.then(() => result.hasNextPage);
		};
	  var ias2 = new InfiniteAjaxScroll('#memorycards>div', {
	    item: '.cardPreview',
	    next: nextHandler2,
			// logger: false
	  });
		$("#memorycards>p").addClass("d-none");
	} else {
		$("#memorycards>p").removeClass("d-none");
	}
}

function udpateFilterParams() {
	var name = $(this).attr("name");

	if (name === "cards") return;

	var checkedItems = $(`input[name=${name}][type=checkbox]:checked`);

	if ($(this).attr("type") === "radio") {
		if (name !== "characters")
			checkedItems.prop('checked', false);
		else
			$("#characters label.btn").removeClass("active");
	} else {
		if (checkedItems.length === 0 ||
				checkedItems.length === $(`input[name=${name}][type=checkbox]`).length) {
			$(`input[name=${name}][type=radio]`).prop("checked", true);
			checkedItems.prop('checked', false);
		} else {
			$(`input[name=${name}][type=radio]`).prop("checked", false);
		}
	}
}

function resetFilters() {
	$("#filters input[type=radio]").prop("checked", true);
	$("#filters input[type=checkbox]").prop("checked", false);
	$("#checkCardsAll").prop("checked", true);
	$("#characters label.btn").removeClass("active");
	$("input[name='search']").val('');
}

function applyEffectWithoutTransition(elements, effect) {
	if (elements.length === 0) {
		return;
	}
	elements.addClass('no-transition');
	effect(elements);
	elements[0].offsetHeight;
	elements.removeClass('no-transition');
}


/* Collection Management */

function switchSelectionMode() {
	if (!selectionMode) {
		$.ajax({
			type: 'get',
			url: '/collection/getOwnedCards',
			cache: false
		})
		.done(function (cardNames) {
			ownedCards = cardNames;
			selectionMode = true;
			switchManagementButtons();
			switchCardsVisualState(cardNames);
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
				switchCardsVisualState();
				showAlert("success", "Collection updated!");
			});
		} else {
			changedCards = {};
			selectionMode = false;
			switchManagementButtons();
			switchCardsVisualState();
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

function switchCardsVisualState(cardNames = []) {
	let applyEffect;
	let cardPreviews;

	if (selectionMode) {
		let notOwnedCards = $('.cardPreview:not(".placeholder")')
			.filter(function () { return !cardNames.includes($("img", this).attr('src').slice(16, -4)) })
			.toArray();
		cardPreviews = notOwnedCards.reduce(splitCardsByVisibility, { visible: [], invisible: [] });
		applyEffect = el => el.addClass('notSelectedCard');
	} else {
		cardPreviews = $('.cardPreview')
			.toArray()
			.reduce(splitCardsByVisibility, { visible: [], invisible: [] });
		applyEffect = el => el.removeClass('notSelectedCard');
	}

	cardPreviews.visible.forEach(card => applyEffect(card));
	cardPreviews.invisible.forEach(card => applyEffectWithoutTransition($(card), applyEffect));
}

function cardClicked(e) {
	if (!selectionMode) return;

	e.preventDefault();
	e.stopPropagation();

	let image = $(this).find('img');
	let cardName = $("img", this).attr('src').slice(16, -4);

	changedCards[cardName] = $(image).hasClass('notSelectedCard');
	$(image).toggleClass('notSelectedCard');
}

function switchSelectionAll(select) {
	let cardOwned = card => ownedCards.includes(card.uniqueName);
	let cardChanged = card => Object.keys(changedCards).includes(card.uniqueName);
	let demonTabSelected = $("#demon-tab").hasClass("active");
	let cardsToSelect = cardList.filter(x => (x.type === "Demon") === demonTabSelected);
	cardsToSelect = cardsToSelect.filter(x => (!cardOwned(x) && cardChanged(x) !== select) || (cardOwned(x) && cardChanged(x) === select)).map(x => x.uniqueName);
	console.log(cardsToSelect.length)
	if (cardsToSelect.length == 0) return;

	//TODO remove slice
	let visibleCards = $('.cardPreview:visible')
		.filter((idx, el) => $(el).isInViewport())
		.filter((idx, el) => cardsToSelect.includes($(el).find('img').attr('src').slice(16, -4)));

	let invisibleCards = $('.cardPreview:visible')
		.filter((idx, el) => !$(el).isInViewport())
		.filter((idx, el) => cardsToSelect.includes($(el).find('img').attr('src').slice(16, -4)));

	let changeSelection;
	if (select) {
		changeSelection = x => $(x).find('img').removeClass('notSelectedCard');
	} else {
		changeSelection = x => $(x).find('img').addClass('notSelectedCard');
	}

	addCardsToChangedList(cardsToSelect, select);
	changeSelection(visibleCards);
	applyEffectWithoutTransition(invisibleCards, () => changeSelection(invisibleCards));
}

function addCardsToChangedList(cardsToSwitch, select) {
	var cardsToAdd = [];
	cardsToSwitch.forEach(uniqueName => {
		if (Object.keys(changedCards).includes(uniqueName)) {
			delete changedCards[uniqueName];
		} else {
			cardsToAdd.push(uniqueName);
		}
	});
	cardsToAdd.forEach(uniqueName => changedCards[uniqueName] = select);
}
