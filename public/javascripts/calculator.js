$(function() {
  // startCountdown();
	$("input#stagesCleared, input.custom-range").change(function() {
		var val = $(this).val();
		$("input#stagesCleared, input.custom-range").val(val);
	});
});

function startCountdown(d) {
	var countDownDate = new Date(d).getTime();
	var x = setInterval(function() {
	  var now = new Date().getTime();
		var distance = countDownDate - now;

		// TODO: If day < 1, do the normal calculation; else, countdown to JSP 00:00

	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	  $("span.countdown").text(hours + "h " + minutes + "m " + seconds + "s ");
	}, 1000);
}
