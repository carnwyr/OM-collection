var changedCards = {};
var selectionMode = false;
var ownedCards = [];
var querystr = new URLSearchParams(document.location.search.substring(1));
const INIT_DISPLAY_COUNT = 100;


// TODO: strip extra data from card list.
// TODO: create a single listener that controls all hover effects.
// TODO: change initial display count to fill rank.

// add fade effect when displaying cards
// style load more buttons
// add message when no card to display
// add click x to clear search bar


$(document).ready(function() {

	let ias = new InfiniteAjaxScroll('#demonSection', {
	  item: '.cardPreview',
	  next: nextHandler,
		trigger: {
	    element: '#trigger1',
			when: (pageIndex) => pageIndex >= 0
	  }
	});

	let ias2 = new InfiniteAjaxScroll('#memorySection', {
	  item: '.cardPreview',
	  next: nextHandler2,
		trigger: {
	    element: '#trigger2',
			when: (pageIndex) => pageIndex >= 0
	  }
	});

	$("#filters form").on("submit", function(e) {
		e.preventDefault();

		var filters = new FormData($("#filters form")[0]);
		var params = new URLSearchParams();

		for (let [key, value] of filters.entries()) {
			if (value) params.append(key, value);
		}

		if (params.get("cards")) params.set("cards", $("input[name='cards']:checked").val());
		if (querystr.get("search")) params.append('search', querystr.get("search"));
		if (querystr.get("view")) params.append('view', querystr.get("view"));

		console.log(params.toString());

		window.location.href = `${window.location.pathname}?${params.toString()}`;
	});

	$("#search").on("submit", function(e) {
		e.preventDefault();

		var search = $("input[name='search']").val();
		if (!search) querystr.delete("search");
		else querystr.set("search", search);

		window.location.href = `${window.location.pathname}?${querystr.toString()}`;
	});

	$("#viewMenuDropdown a").click(function() {
		if ($(this).data("viewtype") === querystr.get("view")) return;

		// update view
		querystr.set("view", $(this).data("viewtype"));
		window.location.href = `${window.location.pathname}?${querystr.toString()}`;
	});

	$("#gotoDemon, #gotoMemory").on("click", scrollToSection);

	$("#filters form input").change(updateFilters);
	$("#resetFilters").click(resetFilters);

	$('button#manageCollection, button#saveManaging').on('click', switchSelectionMode);
	$('.cardPreview').on('click', cardClicked);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });

	$(window).on('beforeunload', () => { if (Object.keys(changedCards).length > 0) return confirm("Do you want to leave without saving your collection?"); });
});

let nextHandler = function(pageIndex) {
	var data = CARD_LIST.filter(card => card.type === "Demon");
  var result = createCardDocuments(data, pageIndex);

  return this.append(Array.from(result.frag.childNodes))
		.then(() => result.hasNextPage);
};

let nextHandler2 = function(pageIndex) {
	let data = CARD_LIST.filter(card => card.type === "Memory");
	var result = createCardDocuments(data, pageIndex);

  return this.append(Array.from(result.frag.childNodes))
		.then(() => result.hasNextPage);
};

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
	if (!card) {
		template = "<a class='cardPreview placeholder'></a>";
	} else {
		let size = 'S', bloomed = '', viewtype = querystr.get('view');
		if (viewtype === 'original' || viewtype === "bloomed") {
			size = 'L';
		}
		if (viewtype === 'bloomed' && card.type === "Demon") {
			bloomed = '_b';
		}
		img_src = `/images/cards/${size}/${card.uniqueName}${bloomed}.jpg`;
	  template =
			`<a class="cardPreview" href="card/${card.uniqueName}">
				<img loading="lazy" src="${img_src}">
				<figcaption>${card.name}</figcaption>
			</a>`;
	}

  let item = document.createElement('div');
  item.innerHTML = template.trim();

	if (selectionMode) {
		// check if card is owned,
		// add selected card/ not selected based on outcome
	}

  return item.firstChild;
}

function updateFilters() {
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

function scrollToSection(e) {
	var divId = $(this).attr('href');
	if ($(window).width() < 768)
		var sectionHeaderOffset = 175;
	else
		var sectionHeaderOffset = 150;

	$('html, body').animate({scrollTop:$(divId).offset().top - sectionHeaderOffset}, 500);
}


/* Collection Management */

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
	// TODO: select all cards from list instead of what's visible on page.
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
