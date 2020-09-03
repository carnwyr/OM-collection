$(document).ready(function(){
    $(".addCardButton").on('click', addCard);
    $(".removeCardButton").on('click', removeCard);
	if (hasCard) {
        showButton(showAddButton=false);
	}
	else {
        showButton(showAddButton=true);
	}
});

function showButton(showAddButton) {
    if (showAddButton) {
        $(".addCardButton").show();
        $(".removeCardButton").hide();
    } else {
        $(".addCardButton").hide();
        $(".removeCardButton").show();
    }
}

function addCard(e) {
	$.ajax({
        type: 'post',
        url: '/card/'+cardName+'/addToCollection'
    })
    .done(function(data){
    	if (data == 'ok') {
            showButton(showAddButton=false);
            $("div#successAlert").html('Card successfully added to your collection');
            showAlert("div#successAlert");
    	}
        else {
            showAlert("div#failAlert");
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
    		showButton(showAddButton=true);
            $("div#successAlert").html('Card successfully removed from your collection');
            showAlert("div#successAlert");
    	}
        else {
            showAlert("div#failAlert");
        }
    });
}

function showAlert(alert) {
    $(alert).show().animate({top: 65}, 500);
    setTimeout(function () {
        $(alert).animate({top: -100}, 500).promise().done(function() {$(alert).hide()})
      }, 2000);
}