var adBlock;
$(document).ready(function(){
	$("head").append(`<meta property="og:url" content="${window.location.href}">`);
	$("head").append(`<link rel="alternate" hreflang="${$("select#language").val()}" href="${window.location.href}">`);
	$("select#language").on("change", function() {
		window.location.href = window.location.href.split('?')[0] + "?lang=" + $("select#language").val();
	});

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
	// if (!document.cookie.split('; ').find(row => row.startsWith("announcementToast"))) {
	// 	$("#announcementToast").removeClass("d-none").toast("show");
	// }
	// $("#announcementToast .close, #announcementToast a").on("click", () => {
	// 	document.cookie = "announcementToast=true; expires=" + cookieExpiryDate() + ";";
	// 	$("#announcementToast").toast("hide");
	// });
	/***/

	$('.navbar .dropdown').hover(function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
		$(this).delay(250).addClass('show');
	}, function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp()
		$(this).delay(100).removeClass('show');
	});
});

$(document).on("adBlocked", () => { adBlock = true; });
$(window).on("load", () => {
	if (adBlock === true) {
		$(".ddd>.row").hide();
		$(".ddd").append(`<div class="card shadow-none"><div class="card-body col-md-8 mx-auto my-4"><h5 class="card-title">Using an ad-blocker?</h5><p class="card-text">Karasu-OS.com is supported by donation and advertisement. <br>Please consider whitelisting karasu-os.com or making a donation to keep karasu alive for your enjoyment.</p><a class="btn supportBtn" href="https://www.buymeacoffee.com/karasuos" role="button" target="_blank">&#x1F608 Donate now</a></div></div>`);
	} else {
		$("[data-target='#removeAdsModal']").show();
	}
})

var footerOffset;
$(window).on("scroll", () => {
	if ($("footer").isInViewport()) {
		footerOffset = window.innerHeight - document.querySelector("footer").getBoundingClientRect().top;
		$("#bmc-wbtn, #b2t").css("bottom", "calc(32px + " + footerOffset + "px)");
		$("#bmc-wbtn").css({ "z-index": "1030", "transition": "0s" });  // hardcoded
		$("#cookieToast").css("bottom", "calc(100px + " + footerOffset + "px)");
	} else {
		$("#bmc-wbtn, #b2t").css("bottom", "32px");
		$("#cookieToast").css("bottom", "100px");
	}
});

var cookieExpiryDate = () => {
	var d = new Date();
	d.setMonth(d.getMonth() + 3);
	return d.toUTCString();
}

function showAlert(type, message) {
	$("#alert").removeClass().addClass("alert alert-"+type);
	$("#alert").html(message);
	$("#alert").show().animate({ top: 65 }, 500);
	setTimeout(function() {
		$("#alert").animate({ top: -100 }, 500).promise().done(function() { $("#alert").hide() });
	}, 5000);
}

$.fn.isInViewport = function() {
	var elementTop = $(this).offset().top;
	var elementBottom = elementTop + $(this).outerHeight();

	var viewportTop = $(window).scrollTop();
	var viewportBottom = viewportTop + $(window).height();

	return elementBottom > viewportTop && elementTop < viewportBottom;
}
