$(function() {
  // startCountdown();
	$("input#stagesCleared, input.custom-range").change(function() {
		var val = $(this).val();
		$("input#stagesCleared, input.custom-range").val(val);
	});
});

// completely copied from w3school :)
function startCountdown(d) {
	// Set the date we're counting down to
	var countDownDate = new Date(d).getTime();

	// Update the count down every 1 second
	var x = setInterval(function() {

	  // Get today's date and time
	  var now = new Date().getTime();

	  // Find the distance between now and the count down date
	  var distance = countDownDate - now;

		// TODO: If day < 1, do the normal calculation; else, countdown to JSP 00:00

	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	  // Display the result in the element with id="demo"
	  document.getElementById("demo").innerHTML = hours + "h " + minutes + "m " + seconds + "s ";

	  // If the count down is finished, write some text
	  if (distance < 0) {
	    clearInterval(x);
	    document.getElementById("demo").innerHTML = "EXPIRED";
	  }
	}, 1000);
}

function startEventCountdown(d) {
	// Set the date we're counting down to
	var countDownDate = new Date(d).getTime();

	// Update the count down every 1 second
	var x = setInterval(function() {

	  // Get today's date and time
	  var now = new Date().getTime();

	  // Find the distance between now and the count down date
	  var distance = countDownDate - now;

	  // Time calculations for days, hours, minutes and seconds
	  var days = Math.floor(distance / (1000 * 60 * 60 * 24));

		if (day < 1) {
			document.getElementById("demo").innerHTML = "< " + days;
		} else {
			document.getElementById("demo").innerHTML = days;
		}

	  // If the count down is finished, write some text
	  if (distance < 0) {
	    clearInterval(x);
	    document.getElementById("demo").innerHTML = "EXPIRED";
	  }
	}, 1000);
}
