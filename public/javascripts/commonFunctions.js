$(document).ready(function(){
	$(".navbar .nav-item.active").removeClass('active');
	$('.navbar .nav-item a[href="' + location.pathname + '"]').closest('li').addClass('active');

	$('.toast').toast('show');
});
