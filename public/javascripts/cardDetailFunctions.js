$(document).ready(function(){
    $(".addCardButton").on('click', addCard);
    $(".removeCardButton").on('click', removeCard);
	if (hasCard) {
        $(".removeCardButton").show();
	}
	else {

        $(".addCardButton").show();
	}
});

function addCard(e) {
	$.ajax({
        type: 'post',
        url: '/card/'+cardName+'/addToCollection'
    })
    .done(function(data){
    	if (data == 'ok') {
            $(".addCardButton").hide();
            $(".removeCardButton").show();
            $("div#successAlert").html('Card successfully added to your collection');
            $("div#successAlert").show().animate({top: 65}, 500);
            setTimeout(function () {
                $("div#successAlert").animate({top: -100}, 500).promise().done(function() {$("div#successAlert").hide()})
              }, 2000);
    	}
        else {
            $("div#failAlert").show().animate({top: 65}, 500);
            setTimeout(function () {
                $("div#failAlert").animate({top: -100}, 500).promise().done(function() {$("div#failAlert").hide()})
              }, 2000);
        }
    });
}

function removeCard(e) {
	$.ajax({
        type: 'post',
        url: '/card/'+cardName+'/removeFromCollection'
    })
    .done(function(data){
    	if (data == 'ok') {
    		$(".addCardButton").show();
            $(".removeCardButton").hide();
            $("div#successAlert").html('Card successfully removed from your collection');
            $("div#successAlert").show().animate({top: 65}, 500);
            setTimeout(function () {
                $("div#successAlert").animate({top: -100}, 500).promise().done(function() {$("div#successAlert").hide()})
              }, 2000);
    	}
        else {
            $("div#failAlert").show().animate({top: 65}, 500);
            setTimeout(function () {
                $("div#failAlert").animate({top: -100}, 500).promise().done(function() {$("div#failAlert").hide()})
              }, 2000);
        }
    });
}