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
	$('button#manageCollection').on('click', switchSelection);
	$('button#saveManaging').on('click', switchSelection);
	$('.cardPreview a').on('click', cardClicked);
	$('button#selectAll').on('click', function() {
		$('.cardPreview:visible a').filter(function() { return $(this).find('img').hasClass('notSelectedCard'); }).each(function() { cardClicked.call($(this)); });
	});
	$('button#deselectAll').on('click', function() {
		$('.cardPreview:visible a').filter(function() { return !$(this).find('img').hasClass('notSelectedCard'); }).each(function() { cardClicked.call($(this)); });
	});
	$('button#cancelManaging').on('click', function() { changedCards = {}; switchSelection.call(); });
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
		scrollTop: $(divId).offset().top - 190
	}, 200);
}

function switchSelection() {
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
	    	$('.cardPreview').filter(function() {
	    		return !$(this).isInViewport();
	    	}).find('.img-max').addClass('no-transition');
			$('.cardPreview').filter(function() {
				return !cardNames.includes($(this).find('a').attr('href').replace('card/', ''));
			}).find('img').addClass('notSelectedCard');
			$('.cardPreview').find('.img-max')[0].offsetHeight;
			$('.cardPreview').find('.img-max').removeClass('no-transition');
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
		    	$('.cardPreview').filter(function() {
		    		return !$(this).isInViewport();
		    	}).find('.img-max').addClass('no-transition');
				$('.cardPreview').find('img').removeClass('notSelectedCard');
				$('.cardPreview').find('.img-max')[0].offsetHeight;
				$('.cardPreview').find('.img-max').removeClass('no-transition');
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
	    	$('.cardPreview').filter(function() {
	    		return !$(this).isInViewport();
	    	}).find('.img-max').addClass('no-transition');
			$('.cardPreview').find('img').removeClass('notSelectedCard');
			$('.cardPreview').find('.img-max')[0].offsetHeight;
			$('.cardPreview').find('.img-max').removeClass('no-transition');
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

function fillRank(container) {
  const c = document.getElementById(container);
  let html = `<div class="card invisible" id="placeholders"><a class="mb-2 h-100" href=""><figure class="figure text-center"><figcaption class="figure-caption text-center img-max">placeholder placeholder placeholder</figure></a></div>`;
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
      c.innerHTML += html;
    } else if ($(window).width() <= 768) {
      while (i < cardNum + (4 - (cardNum % 4))) {
        c.innerHTML += html;
        i++;
      }
    } else if ($(window).width() <= 992) {
      while (i < cardNum + (6 - (cardNum % 6))) {
        c.innerHTML += html;
        i++;
      }
    } else if ($(window).width() <= 1200) {
      while (i < cardNum + (8 - (cardNum % 8))) {
        c.innerHTML += html;
        i++;
      }
    } else {
      while (i < cardNum + (9 - (cardNum % 9))) {
        c.innerHTML += html;
        i++;
      }
    }

    if (cardNum === 0) {
      c.innerHTML =
        `<p class="col-12 text-muted">No matching cards</p>` +
        c.innerHTML;
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