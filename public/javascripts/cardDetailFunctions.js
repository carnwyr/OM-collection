$(document).ready(function(){
	if (!hasCard) {
		$("button#alterCollection").on('click', addCard);
    	$("button#alterCollection").html('Add to collection');
	}
	else {
		$("button#alterCollection").on('click', removeCard);
    	$("button#alterCollection").html('Remove from collection');
	}
});

function addCard(e) {
	$.ajax({
        type: 'post',
        url: '/card/'+cardName+'/addToCollection'
    })
    .done(function(data){
    	if (data == 'ok') {
    		$("button#alterCollection").off('click', addCard);
    		$("button#alterCollection").on('click', removeCard);
    		$("button#alterCollection").html('Remove from collection');
    	}
    	alert(data);
    });
}

function removeCard(e) {
	$.ajax({
        type: 'post',
        url: '/card/'+cardName+'/removeFromCollection'
    })
    .done(function(data){
    	if (data == 'ok') {
    		$("button#alterCollection").off('click', removeCard);
    		$("button#alterCollection").on('click', addCard);
    		$("button#alterCollection").html('Add to collection');
    	}
    	alert(data);
    });
}