$(document).on("koolAid", showFallback);

$(document).ready(function () {
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
	// let cookieName = "result0423";
	// if (!document.cookie.split('; ').find(row => row.startsWith(cookieName))) {
	// 	$("#announcementToast").removeClass("d-none").toast("show");  // if is toast
	// 	// $("#announcementToast").removeClass("d-none");  // if is alert
	// }
	// $("#announcementToast .close").on("click", () => {
	// 	document.cookie = cookieName + "=true; expires=" + cookieExpiryDate() + ";";
	// 	$("#announcementToast").toast("hide");  // if is toast
	// });
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

async function detectAdBlock(callback) {
  let adBlockEnabled = false;
  const googleAdUrl = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=";
  try {
    await fetch(new Request(googleAdUrl)).catch((_) => (adBlockEnabled = true));
  } catch(e) {
    adBlockEnabled = true;
	} finally {
		if (callback) {
			callback(adBlockEnabled);
		}
  }
}

$(window).on("load", function() {
	detectAdBlock(adBlockEnabled => {
		if (adBlockEnabled) {
			showFallback();
		}
		// else {
		// 	let script = document.createElement('script');
		// 	script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1710157662563352";
		// 	script.crossorigin = "anonymous";
		// 	script.onerror = () => document.dispatchEvent(new CustomEvent('koolAid'));
		// 	document.head.append(script);
		// }
	});
});

function showFallback() {
	$(".kool-aid").each(function() {
		let templateId = "#" + $(this).attr("data-fallback");
		let fallback = $.parseHTML($(templateId).html());
		$(fallback[0]).height($(this).height());
		$(this).find(".row").hide();
		$(this).append(fallback);
	});
}

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

function setCookie(cname, cvalue, exdays = cookieExpiryDate()) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	let name = cname + "=";
	let ca = document.cookie.split(';');
	for(let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
