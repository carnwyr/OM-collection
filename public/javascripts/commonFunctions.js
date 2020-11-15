$(document).ready(function(){
	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	if (!document.cookie.split('; ').find(row => row.startsWith("acceptedCookies"))) {
		$("#cookieToast").removeClass("d-none").toast("show");
	}
	$("button#acceptCookies").on("click", () => {
		document.cookie = "acceptedCookies=true; expires=" + cookieExpiryDate() + ";";
		$("#cookieToast").toast("hide");
	});

	$('.navbar .dropdown').hover(function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
	}, function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp()
	});

	$("#b2t").on('click', () => $('body,html').animate({ scrollTop: 0 }, 500));
	$(window).scroll(switchBackToTopButton);
	switchBackToTopButton();
});

var cookieExpiryDate = () => {
	var d = new Date();

	d.setMonth(d.getMonth() + 3);

	return d.toUTCString();
}

function switchBackToTopButton() {
	if ($(window).scrollTop() > 64) {
		$("#b2t").fadeIn();
	} else {
		$("#b2t").fadeOut();
	}
}
