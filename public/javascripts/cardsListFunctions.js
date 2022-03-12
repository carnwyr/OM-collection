let changedCards = {};
let selectionMode = false;
let ownedCards = [];
let querystr = new URLSearchParams(document.location.search);
let nextHandler, nextHandler2, ias, ias2;
let demon = {
	selected: "--",
	total: cardList.filter(card => card.type === "Demon").length
}, memory = {
	selected: "--",
	total: cardList.filter(card => card.type === "Memory").length
};

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

const cardOwned = (name) => ownedCards.includes(name);
const cardSelectionChanged = (name) => name in changedCards;
//#endregion

// TODO: create a single listener that controls all hover effects for dropdowns.

$(document).ready(function() {
	initInfiniteScroll();
	updateSelectedCardCount();

	$("#search, #filters form").on("submit", applyFilters);
	$("#filters form input").change(updateFilterParams);
	$("#resetFilters").click(resetFilters);
	$("#viewMenuDropdown a").click(updateViewType);

	$('#demoncards>div, #memorycards>div').on('click', ".cardPreview", cardClicked);

	$('button#manageCollection, button#saveManaging').on('click', switchSelectionMode);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });

	let openedTab = localStorage.getItem("cardTab") ? localStorage.getItem("cardTab") : "demon-tab";
	$('#' + openedTab).tab("show");
	$("#demon-tab, #memory-tab").on("click", function() {
		localStorage.setItem("cardTab", $(this).attr("id"));
	});

	$(window).on('beforeunload', () => { if (Object.keys(changedCards).length > 0) return confirm("Do you want to leave without saving your collection?"); });
});

function createCardDocuments(data, pageIndex) {
	let cardsPerRow = getRowCapacity();
	let frag = document.createDocumentFragment();
  let itemsPerPage = 100 - 100 % cardsPerRow;
  let totalPages = Math.ceil(data.length / itemsPerPage);
  let offset = pageIndex * itemsPerPage;
	let maxCardCount = data.length;
	if (data.length % cardsPerRow !== 0) {
		maxCardCount += cardsPerRow;
		maxCardCount -= maxCardCount % cardsPerRow;
	}

  for (let i = offset, len = offset + itemsPerPage; i < len && i < maxCardCount; i++) {
    let item = createCardElement(data[i]);
    frag.appendChild(item);
  }

	let hasNextPage = pageIndex < totalPages - 1;

	return { frag: frag, hasNextPage: hasNextPage };
}

function createCardElement(card) {
	let template, img_src;
	let imageSize = 'S', containerSize = "icon-container", viewtype = querystr.get('view');
	if (viewtype === 'original' || viewtype === "bloomed") {
		imageSize = 'L';
		containerSize = "full-container";
	}
	if (!card) {
		template = `<a class='cardPreview ${containerSize} placeholder'></a>`;
	} else {
		let bloomed = '';
		let figcaption = document.documentElement.lang === "ja"?card.ja_name:card.name;
		let sortby = querystr.get("sortby");

		if (viewtype === 'bloomed' && card.type === "Demon") {
			bloomed = '_b';
		}

		if (sortby && sortby.match(/^(min|max|fdt)_(-1|1)$/)) {
			figcaption = card.total ? card.total.toLocaleString("en") : "???";
		}

		img_src = `/images/cards/${imageSize}/${card.uniqueName}${bloomed}.jpg`;
	  template =
			`<a class="cardPreview ${containerSize}" href="card/${encodeURIComponent(card.name.replace(/ /g, "_"))}">
				<img loading="lazy" src="${img_src}">
				<figcaption>${figcaption}</figcaption>
			</a>`;
			// class="lazy"
	}

  let item = document.createElement('div');
  item.innerHTML = template.trim();

	if (selectionMode && card) {
		let cardNotSelected = cardSelectionChanged(card.uniqueName) == cardOwned(card.uniqueName);
		if (cardNotSelected) {
			$(item).find('img').addClass("notSelectedCard");
		}
	}

  return item.firstChild;
}

function applyFilters(e) {
	e.preventDefault();

	// update query string
	let filters = new FormData($("#filters form")[0]);
	let params = new URLSearchParams();

	for (let [key, value] of filters.entries()) {
		if (value) params.append(key, value);
	}

	if (params.get("cards") === "all") params.delete("cards");

	let search = $("input[name='search']").val();
	if (search) params.set("search", search);

	if (querystr.get("view")) params.set('view', querystr.get("view"));

	if (params.toString() === document.location.search.substring(1)) return;

	querystr = new URLSearchParams(params.toString());
	updateURL();

	$("#demoncards>div, #memorycards>div").html("Loading...");
	unbindInfiniteScroll();

	// request cards
	params.set("path", PATH);
	if (PATH === "favourites" || PATH === "collection") {
		params.set("user", window.location.pathname.split('/').at(-2));
	}
	$.get("/getCards?" + params.toString(), function(data) {
		if (data.err) {
			showAlert("danger", "Something went wrong");
			return;
		}
		cardList = data.cards;
		initInfiniteScroll();
		updateSelectedCardCount();
	});
}

function updateURL() {
	window.history.replaceState(null, '', `${window.location.pathname}?${querystr.toString()}`);
}

function updateViewType() {
	let currentView = querystr.get("view");
	let newView = $(this).data("viewtype");
	if (newView === currentView) return;

	$("#viewMenuDropdown>button").text($(this).text());
	$(`a[data-viewtype=${currentView}]`).removeClass("text-primary font-weight-bold");
	$(this).addClass("text-primary font-weight-bold");

	querystr.set("view", $(this).data("viewtype"));

	initInfiniteScroll();
	updateURL();
}

function initInfiniteScroll() {
	unbindInfiniteScroll();

	$("#demoncards>div, #memorycards>div").html("");

	let demonCards = cardList.filter(card => card.type === "Demon");
	let memoryCards = cardList.filter(card => card.type === "Memory");

	if (demonCards.length !== 0) {
		nextHandler = function(pageIndex) {
		  let result = createCardDocuments(demonCards, pageIndex);
		  return this.append(Array.from(result.frag.childNodes))
				.then(() => result.hasNextPage);
		};
		ias = new InfiniteAjaxScroll('#demoncards>div', {
			item: '.cardPreview',
			next: nextHandler,
			logger: false
		});
		// ias.on("appended", fadeInImages);
		$("#demoncards>p").addClass("d-none");
	} else {
		$("#demoncards>p").removeClass("d-none");
	}

	if (memoryCards.length !== 0) {
		nextHandler2 = function(pageIndex) {
			let result = createCardDocuments(memoryCards, pageIndex);
		  return this.append(Array.from(result.frag.childNodes))
				.then(() => result.hasNextPage);
		};
	  ias2 = new InfiniteAjaxScroll('#memorycards>div', {
	    item: '.cardPreview',
	    next: nextHandler2,
			logger: false
	  });
		// ias2.on("appended", fadeInImages);
		$("#memorycards>p").addClass("d-none");
	} else {
		$("#memorycards>p").removeClass("d-none");
	}
}

function unbindInfiniteScroll() {
	if (ias) ias.unbind();
	if (ias2) ias2.unbind();
}

function updateFilterParams() {
	let name = $(this).attr("name");

	if (name === "cards") return;

	let checkedItems = $(`input[name=${name}][type=checkbox]:checked`);

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
	$("select[name='sortby']").val('').change();
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

			demon.selected = cardList.filter(x => (x.type === "Demon" && cardOwned(x.uniqueName))).length;
			memory.selected = cardList.filter(x => (x.type === "Memory" && cardOwned(x.uniqueName))).length
			$("#demoncount").text(` ${demon.selected}/${demon.total}`);
			$("#memorycount").text(` ${memory.selected}/${memory.total}`);
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

				updateSelectedCardCount();
			});
		} else {
			changedCards = {};
			selectionMode = false;
			switchManagementButtons();
			switchCardsVisualState();
		}

		updateSelectedCardCount();
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
			.filter(function () { return !cardNames.includes($("img", this).attr("src").slice(16, -4)) })
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
	let cardName = $("img", this).attr("src").slice(16, -4);

	updateChangedCards([cardName], $(image).hasClass('notSelectedCard'));
	$(image).toggleClass('notSelectedCard');

	updateSelectedCardCount();
}

function switchSelectionAll(select) {
	let cardsToSelect = getCardsToSelect(select);
	if (cardsToSelect.length == 0) return;

	//TODO remove slice
	let visibleCards = $('.cardPreview:visible:not(".placeholder")')
		.filter((idx, el) => $(el).isInViewport())
		.filter((idx, el) => cardsToSelect.includes($(el).find('img').attr("src").slice(16, -4)));

	let invisibleCards = $('.cardPreview:visible:not(".placeholder")')
		.filter((idx, el) => !$(el).isInViewport())
		.filter((idx, el) => cardsToSelect.includes($(el).find('img').attr("src").slice(16, -4)));

	let changeSelection;
	if (select) {
		changeSelection = x => $(x).find('img').removeClass('notSelectedCard');
	} else {
		changeSelection = x => $(x).find('img').addClass('notSelectedCard');
	}

	updateChangedCards(cardsToSelect, select);
	changeSelection(visibleCards);
	applyEffectWithoutTransition(invisibleCards, () => changeSelection(invisibleCards));
	updateSelectedCardCount();
}

function updateChangedCards(cards, selected) {
	cards.forEach(uniqueName => {
		changedCards[uniqueName] = selected;
		if (changedCards[uniqueName] === cardOwned(uniqueName)) {
			delete changedCards[uniqueName];
		}
	});
}

function getRowCapacity() {
	// max number of cards for xs is 4, on smaller screens it's reduced by 1 (possibly outdated)
	let cardsInRow;
	if (querystr.get('view') !== "original" || querystr.get('view') !== "bloomed") {
		cardsInRow = { 576: Math.floor(($(window).width() - 100) / 100), 768: 6, 992: 6, 1200: 7, xl: 9 };
	} else {
		cardsInRow = { 576: Math.floor(($(window).width() - 100) / 100), 768: 4, 992: 3, 1200: 4, xl: 5 };
	}

	for (let [size, cardCount] of Object.entries(cardsInRow)) {
		if (size === "xl" || $(window).width() <= screen) {
			return cardCount;
		}
	}
}

// function fadeInImages() {
// 	$("img.lazy").off("load").on("load", function() { $(this).removeClass("lazy"); });
// }

function getCardsToSelect(select) {
	let demonTabSelected = $("#demon-tab").hasClass("active");
	let cardsToSelect = cardList.filter(x => (x.type === "Demon") === demonTabSelected);

	if (select) {
		cardsToSelect = cardsToSelect.filter(x => (!cardOwned(x.uniqueName) || !changedCards[x.uniqueName]));
	} else {
		cardsToSelect = cardsToSelect.filter(x => (cardOwned(x.uniqueName) || changedCards[x.uniqueName]));
	}

	return cardsToSelect.map(x => x.uniqueName);
}

function updateSelectedCardCount() {
	let demonTabSelected = $("#demon-tab").hasClass("active");
	let cardsToSelect = cardList.filter(x => (x.type === "Demon") === demonTabSelected);

	cardsToSelect = cardsToSelect.filter(x => (cardOwned(x.uniqueName) && !cardSelectionChanged(x.uniqueName)) || changedCards[x.uniqueName]).map(x => x.uniqueName);

	if (selectionMode) {
		if (demonTabSelected) {
			demon.selected = cardsToSelect.length;
		} else {
			memory.selected = cardsToSelect.length;
		}
	} else {
		demon.selected = "--";
		memory.selected = "--";
	}

	$("#demoncount").text(` ${demon.selected}/${demon.total}`);
	$("#memorycount").text(` ${memory.selected}/${memory.total}`);
}
