$(document).ready(function(){
	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	if (!document.cookie.split('; ').find(row => row.startsWith("closedSupportToast"))) {
    $(".toast").toast("show");
  }
	$("button#closeToast").on("click", () => { document.cookie = "closedSupportToast=true; expires=Fri, 31 Dec 2020 23:59:59 GMT"; })
});
