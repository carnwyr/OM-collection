var adBlock;

$(document).ready(function(){
	$('head').append(`<meta property="og:url" content="${window.location.href}">`);
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

	$("#b2t").on('click', () => { $('html, body').animate({scrollTop:0}, 500); });
	$(window).scroll(switchBackToTopButton);
	switchBackToTopButton();
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

function showAlert(type, message) {
	$("#alert").removeClass().addClass("alert").addClass("alert-"+type);
	$("#alert").html(message);
	$("#alert").show().animate({top: 65}, 500);
	setTimeout(function () {
		$("#alert").animate({top: -100}, 500).promise().done(function() {$("#alert").hide()})
	}, 5000);
}
