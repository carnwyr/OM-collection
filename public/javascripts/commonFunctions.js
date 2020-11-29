var adBlock;

$(document).ready(function(){
	$('head').append(`<meta property="twitter:url" content="${window.location.href}">`);
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

	$('.navbar .dropdown').hover(function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
	}, function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp()
	});

	var os = getOS();
	if (os == 'Mac OS' || os == 'Android') {
		$("#b2t").on('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
	} else {
		$("#b2t").on('click', () => $('html, body').animate({
		    scrollTop: 0
		}, 500));
	}
	$(window).scroll(switchBackToTopButton);
	switchBackToTopButton();
});

$(document).on("adBlocked", () => { adBlock = true; });

$(window).on("load", () => {
	if (window.location.pathname !== "/" && adBlock === true) {
		$(".ad-container").append(`<div class="card card-body"><p class="col-md-8 mx-auto my-5">Karasu-OS.com is supported by donation and advertisement. <br>Please consider whitelisting karasu-os.com or making a donation to keep karasu alive for your enjoyment. <br><br><a class="btn supportBtn" href="https://www.buymeacoffee.com/karasuos" role="button" target="_blank">&#x1F608 Donate now</a></p></div>`);
	};
})

var cookieExpiryDate = () => {
	var d = new Date();
	d.setMonth(d.getMonth() + 3);
	return d.toUTCString();
}

function switchBackToTopButton() {
	if ($(window).scrollTop() > $(window).height()*4) {
		$("#b2t").fadeIn();
		if ($(window).width() < 540) {
			$("#cookieToast").css("transform", "translate(0, -64px)");
		}
	} else {
		$("#b2t").fadeOut();
		$("#cookieToast").css("transform", "");
	}
}

function getOS() {
  var userAgent = window.navigator.userAgent,
      platform = window.navigator.platform,
      macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'Mac', 'darwin'],
      windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
      iosPlatforms = ['iPhone', 'iPad', 'iPod'],
      os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (!os && /Linux/.test(platform)) {
    os = 'Linux';
  }

  return os;
}
