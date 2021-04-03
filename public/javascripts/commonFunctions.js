var adBlock;

$(document).ready(function(){
	$('head').append(`<meta property="og:url" content="${window.location.href}">`);

	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	if (!document.cookie.split('; ').find(row => row.startsWith("acceptedCookies"))) {
		$("#cookieToast").removeClass("d-none").toast("show");
	}
	$("button#acceptCookies").on("click", () => {
		document.cookie = "acceptedCookies=true; expires=" + cookieExpiryDate() + ";";
		$("#cookieToast").toast("hide");
	});

	/***/
	if (!document.cookie.split('; ').find(row => row.startsWith("shareKarasu"))) {
		$("#shareKarasu").removeClass("d-none").toast("show");
	}
	$("#shareKarasu .close, #shareKarasu a").on("click", () => {
		document.cookie = "shareKarasu=true; expires=" + cookieExpiryDate() + ";";
		$("#shareKarasu").toast("hide");
	});
	/***/

	$('.navbar .dropdown').hover(function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
		$(this).delay(250).addClass('show');
	}, function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp()
		$(this).delay(100).removeClass('show');
	});

	$("#b2t").on('click', () => { $('html, body').animate({scrollTop:0}, 500); });
	$(window).scroll(switchBackToTopButton);
	switchBackToTopButton();
});

$(document).on("adBlocked", () => { adBlock = true; });

$(window).on("load", () => {
	if (adBlock === true) {
		$(".ad-container>.row").hide();
		$(".ad-container").append(`<div class="card"><div class="card-body col-md-8 mx-auto my-4"><h5 class="card-title">Using an ad-blocker?</h5><p class="card-text">Karasu-OS.com is supported by donation and advertisement. <br>Please consider whitelisting karasu-os.com or making a donation to keep karasu alive for your enjoyment.</p><a class="btn supportBtn" href="https://www.buymeacoffee.com/karasuos" role="button" target="_blank">&#x1F608 Donate now</a></div></div>`);
	} else {
		$("[data-target='#removeAdsModal']").show();
	}
})

var cookieExpiryDate = () => {
	var d = new Date();
	d.setMonth(d.getMonth() + 3);
	return d.toUTCString();
}

function switchBackToTopButton() {
	if ($(window).scrollTop() > $(window).height()*3) {
		$("#b2t").fadeIn();
		if ($(window).width() < 540) {
			$("#cookieToast").css("transform", "translate(0, -64px)");
		}
	} else {
		$("#b2t").fadeOut();
		$("#cookieToast").css("transform", "");
	}
}
