$(document).ready(function(){
	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	if (!document.cookie.split('; ').find(row => row.startsWith("closedSupportToast"))) {
	    $("#supportToast").removeClass("d-none").toast("show");
	}
	if (!document.cookie.split('; ').find(row => row.startsWith("acceptedCookies"))) {
	    $("#cookieToast").removeClass("d-none").toast("show");
	}

	$("button#closeToast, #supportNow").on("click", () => {
		document.cookie = "closedSupportToast=true; expires=" + cookieExpiryDate() + ";";
		$("#supportToast").toast("hide");
	});
	$("button#acceptCookies").on("click", () => {
		document.cookie = "acceptedCookies=true; expires=" + cookieExpiryDate() + ";";
		$("#cookieToast").toast("hide");
	});

	$('.navbar .dropdown').hover(function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(250).slideDown();
	}, function() {
		$(this).find('.dropdown-menu').first().stop(true, true).delay(100).slideUp()
	});
});

// cookie expires in three months
function cookieExpiryDate() {
	var d = new Date();

	d.setMonth(d.getMonth() + 3);

	return d.toUTCString();
}
