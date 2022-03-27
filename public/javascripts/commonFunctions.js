$(document).ready(function() {
	$("head").append(`<meta property="og:url" content="${window.location.href}">`);
	$("head").append(`<link rel="alternate" hreflang="${$("select#language").val()}" href="${window.location.href}">`);
	$("select#language").on("change", function() {
		window.location.href = "https://" + ($("select#language").val()==="en"?"www":$("select#language").val()) + ".karasu-os.com" + location.pathname;
	});

	$(".navbar .nav-item.active").removeClass("active");
	$(".navbar .nav-item a[href=\"" + location.pathname + "\"]").closest("li").addClass("active");

	if (!document.cookie.split("; ").find(row => row.startsWith("acceptedCookies"))) {
		$("#cookieToast").removeClass("d-none").toast("show");
	}
	$("button#acceptCookies").on("click", () => {
		document.cookie = "acceptedCookies=true; expires=" + cookieExpiryDate() + ";";
		$("#cookieToast").toast("hide");
	});

	/***/
	let cookieName = "dt";
	if (!document.cookie.split('; ').find(row => row.startsWith(cookieName))) {
		$("#announcementToast").removeClass("d-none").toast("show");  // if is toast
		// $("#announcementToast").removeClass("d-none");  // if is alert
	}
	$("#announcementToast .close").on("click", () => {
		document.cookie = cookieName + "=true; expires=" + cookieExpiryDate() + ";";
		$("#announcementToast").toast("hide");  // if is toast
	});
	/***/

	$(".navbar .dropdown").hover(function() {
		$(this).find(".dropdown-menu").first().stop(true, true).delay(250).slideDown();
		$(this).delay(250).addClass("show");
	}, function() {
		$(this).find(".dropdown-menu").first().stop(true, true).delay(100).slideUp();
		$(this).delay(100).removeClass("show");
	});

	$("#b2t").on("click", () => { $("html, body").animate({scrollTop:0}, 500); });
});

$(document).on("koolAid", () => {
	$("#kool-aid>.row").hide();
	$("#kool-aid").append(`<div class="card shadow-none" style="background:rgba(255,255,255,.8)"><div class="card-body col-md-8 mx-auto" style="border-radius:1rem;"><h5 class="card-title">Using an ad-blocker?</h5><img style="width:7rem;height:auto;margin-bottom:1rem;" src="/images/adblocked.png"><p>Advertisements help us cover the cost to keep karasu-os online.</p><p>Please consider whitelisting karasu-os.com to keep the website free for everyone!</p></div></div>`);
});

$(window).on("scroll", () => {
	switchBackToTopButton();
	if ($("footer").isInViewport() && window.innerWidth < 576) {
		$("#cookieToast, #b2t").css({ "position": "absolute", "bottom": "-1rem" });
	} else {
		$("#cookieToast, #b2t").css({ "position": "fixed", "bottom": "32px" });
	}
});

var cookieExpiryDate = () => {
	var d = new Date();
	d.setMonth(d.getMonth() + 3);
	return d.toUTCString();
};

function showAlert(type, message) {
	$("#alert").removeClass().addClass("alert alert-"+type);
	$("#alert").html(message);
	$("#alert").show().animate({ top: 65 }, 500);
	setTimeout(function() {
		$("#alert").animate({ top: -100 }, 500).promise().done(function() { $("#alert").hide(); });
	}, 5000);
}

$.fn.isInViewport = function() {
	var elementTop = $(this).offset().top;
	var elementBottom = elementTop + $(this).outerHeight();

	var viewportTop = $(window).scrollTop();
	var viewportBottom = viewportTop + $(window).height();

	return elementBottom > viewportTop && elementTop < viewportBottom;
};

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
