$(document).ready(function(){
	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	if (!document.cookie.split('; ').find(row => row.startsWith("closedSupportToast"))) {
    $("#supportToast").removeClass("d-none").toast("show");
  }
	$("button#closeToast, #supportNow").on("click", () => {
		document.cookie = "closedSupportToast=true; expires=" + cookieExpiryDate() + ";";
		$("#supportToast").remove();
	})
});

// cookie expires in three months
function cookieExpiryDate() {
	var d = new Date();

	d.setMonth(d.getMonth() + 3);

	return d.toUTCString();
}
