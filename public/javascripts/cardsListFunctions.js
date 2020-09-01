var typingTimer;
var doneTypingInterval = 500;
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
	$('.cardPreview a').on('click', cardClicked);
	$('button#selectAll').on('click', function() { switchSelectionAll(true); } );
	$('button#deselectAll').on('click', function() { switchSelectionAll(false); });
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelectionMode.call(); });
	$('#expandFilters').on('click', function() { $(this).text($(this).text() === "Filters" ? "Hide filters" : "Filters"); })
});

window.onload = (event) => {
	fillRank("dcContainer");
	fillRank("mcContainer");
};

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

		fillRank("dcContainer");
		fillRank("mcContainer");
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
		scrollTop: $(divId).offset().top - 150
	}, 200);
}

function switchSelectionMode() {
	if (!selectionMode) {
		$.ajax({
	        type: 'get',
	        url: '/collection/getOwnedCards'
	    })
	    .done(function(cardNames){
	    	$('button#manageCollection').addClass('d-none');
	    	$('div#manageButtons').removeClass('d-none');
	    	$('div#selectionButtons').removeClass('d-none');
	    	selectionMode = true;
    		let oldHeight = $(document).height();
    		let oldScrollTop = $(window).scrollTop();
	    	$('.cardPreview').filter(function() {
	    		return !$(this).isInViewport();
	    	}).find('.img-max').addClass('no-transition');
			$('.cardPreview').filter(function() {
				return !cardNames.includes($(this).find('a').attr('href').replace('card/', ''));
			}).find('img').addClass('notSelectedCard');
			$('.cardPreview').find('.img-max')[0].offsetHeight;
			$('.cardPreview').find('.img-max').removeClass('no-transition');
    		let newHeight = $(document).height();
    		let newScrollTop = $(window).scrollTop();
    		let demonSectionOffset = $('#demonSection').offset().top;
    		$('html, body').animate({
				scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
			}, 500);
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
		    		$("div#failAlert").show().animate({top: 65}, 500);
			            setTimeout(function () {
			                $("div#failAlert").animate({top: -100}, 500).promise().done(function() {$("div#failAlert").hide()})
			              }, 2000);
		    		return;
		    	}
		    	changedCards = {};
	    		$('button#manageCollection').removeClass('d-none');
	    		$('div#manageButtons').addClass('d-none');
	    		$('div#selectionButtons').addClass('d-none');
		    	selectionMode = false;
		    	let oldHeight = $(document).height();
    			let oldScrollTop = $(window).scrollTop();
		    	$('.cardPreview').filter(function() {
		    		return !$(this).isInViewport();
		    	}).find('.img-max').addClass('no-transition');
				$('.cardPreview').find('img').removeClass('notSelectedCard');
				$('.cardPreview').find('.img-max')[0].offsetHeight;
				$('.cardPreview').find('.img-max').removeClass('no-transition');
				let newHeight = $(document).height();
    			let demonSectionOffset = $('#demonSection').offset().top;
				$('html, body').animate({
					scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
				}, 500);
				$("div#successAlert").show().animate({top: 65}, 500);
		            setTimeout(function () {
		                $("div#successAlert").animate({top: -100}, 500).promise().done(function() {$("div#successAlert").hide()})
		              }, 2000);
		    });
		} else {
			changedCards = {};
			$('button#manageCollection').removeClass('d-none');
	    	$('div#manageButtons').addClass('d-none');
	    	$('div#selectionButtons').addClass('d-none');
	    	selectionMode = false;
	    	let oldHeight = $(document).height();
			let oldScrollTop = $(window).scrollTop();
	    	$('.cardPreview').filter(function() {
	    		return !$(this).isInViewport();
	    	}).find('.img-max').addClass('no-transition');
			$('.cardPreview').find('img').removeClass('notSelectedCard');
			$('.cardPreview').find('.img-max')[0].offsetHeight;
			$('.cardPreview').find('.img-max').removeClass('no-transition');
			let newHeight = $(document).height();
    		let demonSectionOffset = $('#demonSection').offset().top;
			$('html, body').animate({
				scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
			}, 500);
		}
	}
}

function cardClicked(e) {
	if (!selectionMode)
		return;
	if (e)
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

function switchSelectionAll(select) {
	if (select) {
		var cardsToSwitch = $('.cardPreview:visible a').filter(function() { return $(this).find('img').hasClass('notSelectedCard'); });
		if (cardsToSwitch.length == 0)
			return;
	}
	else {
		var cardsToSwitch = $('.cardPreview:visible a').filter(function() { return !$(this).find('img').hasClass('notSelectedCard'); });
		if (cardsToSwitch.length == 0)
			return;
	}

	var oldHeight = $(document).height();
	var oldScrollTop = $(window).scrollTop();
	$(cardsToSwitch).filter(function() {
		return !$(this).isInViewport();
	}).find('.img-max').addClass('no-transition');
	if (select) {
		$(cardsToSwitch).find('img').removeClass('notSelectedCard');
		$(cardsToSwitch).find('.img-max')[0].offsetHeight;
		$(cardsToSwitch).find('.img-max').removeClass('no-transition');
	} else {
		$(cardsToSwitch).find('img').addClass('notSelectedCard');
		$(cardsToSwitch).find('.img-max')[0].offsetHeight;
		$(cardsToSwitch).find('.img-max').removeClass('no-transition');
	}
	var newHeight = $(document).height();
	var demonSectionOffset = $('#demonSection').offset().top;
	$('html, body').animate({
		scrollTop: oldScrollTop * (newHeight - demonSectionOffset - $(window).height()) / (oldHeight - demonSectionOffset - $(window).height())
	}, 500);

	var cardNames = [];
	for (var i=0; typeof(cardsToSwitch[i])!='undefined'; cardNames.push(cardsToSwitch[i++].getAttribute('href').replace('card/', '')));
	for (const [key, value] of Object.entries(changedCards)) {
		if (key in cardNames) {
			delete changedCards[key];
			cardNames.splice(cardNames.indexOf(key), 1);
		}
	}
	cardNames.forEach(function(name) {
		changedCards[name] = select;
	});
}

function fillRank(container) {
  const c = document.getElementById(container);
  let html = '<a class="mb-2 h-100" href=""><figure class="figure text-center"><figcaption class="figure-caption text-center img-max">placeholder placeholder placeholder</figure></a>';
  var wrapper = document.createElement('div');
  wrapper.setAttribute("class", "card invisible");
  wrapper.setAttribute("id", "placeholders");
  wrapper.innerHTML = html;
  let children = c.childNodes;
  let cardNum = children.length;
  let i;

  if (c.hasChildNodes()) {
    for (i = 0; i < children.length; i++) {
      // do something with each child as children[i]
      if (children[i].className === "card invisible" || children[i].nodeName == "P") {
        c.removeChild(children[i]);
        i--;
        cardNum--;
      } else if (children[i].style.display == "none") {
        cardNum--;
      } else {
        // do nothing...
      }
    }

    // console.log("<!-- start of calculation -->")

    i = cardNum;
    if ($(window).width() <= 576) {
    	c.appendChild(wrapper);
    } else if ($(window).width() <= 768) {
      while (i < cardNum + (4 - (cardNum % 4))) {
        c.appendChild(wrapper.cloneNode(true));
        i++;
      }
    } else if ($(window).width() <= 992) {
      while (i < cardNum + (6 - (cardNum % 6))) {
        c.appendChild(wrapper.cloneNode(true));
        i++;
      }
    } else if ($(window).width() <= 1200) {
      while (i < cardNum + (8 - (cardNum % 8))) {
        c.appendChild(wrapper.cloneNode(true));
        i++;
      }
    } else {
      while (i < cardNum + (9 - (cardNum % 9))) {
        c.appendChild(wrapper.cloneNode(true));
        i++;
      }
    }

    if (cardNum === 0) {
    	wrapper = document.createElement('p');
		wrapper.setAttribute("class", "col-12 text-muted");
		wrapper.removeAttribute("id");
    	wrapper.textContent = 'No matching cards';
		c.insertBefore(wrapper, c.firstChild);
    }
  }
}

$.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();

    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};