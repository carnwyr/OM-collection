$(function() {
  // startCountdown();
	$("input#stagesCleared, input.custom-range").change(function() {
		var val = $(this).val();
		$("input#stagesCleared, input.custom-range").val(val);
	});
});

function startCountdown(d) {
	var countDownDate = new Date(d).getTime();
	var today = new Date();

	var x = setInterval(function() {
	  var now = new Date().getTime();
		var distance = countDownDate - now;
		var days = Math.floor(distance / (1000 * 60 * 60 * 24));

		if (days > 0) {
			var timezoneOffset = (today.getTimezoneOffset() + 9 * 60) * 60 * 1000;
			var jst = new Date(now + timezoneOffset);  // get current time in jst

			distance = new Date(2025, 0) - jst;
		}

	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	  $("span.countdown").text(hours + "h " + minutes + "m " + seconds + "s ");
	}, 1000);
}
