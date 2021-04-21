$(document).ready(function() {
	$("#shareLink").on("click", () => { $("#userLink").val(window.location.href); });
	$("#copyLink").on("click", copyCollectionLink);
  var path = window.location.pathname.split("/").pop();
  if (path === "collection") {
    $('#openLink').on('show.bs.modal', loadStatsImage);
  } else if (path === "profile") {
    var text = encodeURIComponent("My #obeyme profile and card collections ↓↓↓\n"+window.location.href+"\n\n@karasu_os\n#obeyme #おべいみー");
    $(".twitter-share-button").attr("href", "https://twitter.com/intent/tweet?text="+text);
  }
});

function copyCollectionLink() {
	var copyText = document.getElementById("userLink");
	copyText.select();
	copyText.setSelectionRange(0, 9999);
	document.execCommand("copy");
	showAlert("div#successAlert", "Link successfully copied!");
}

function loadStatsImage(e) {
	var html = prepareHtml();
	$('#statsMessage').html("");
	$('#statsImage').attr('src', "");
	var spinner = $('#statsSpinner').show();
	$.ajax({
		type: 'post',
		url: './getStatsImage',
		data: {html: html},
		cache: false
	})
	.done(function(imageData){
		spinner.hide();
		if(imageData) {
			$('#statsImage').attr('src', imageData);
		} else {
			$('#statsMessage').html("Sorry, couldn't load the image");
		}
	});
}

function prepareHtml() {
	var head = $(document.head.cloneNode(true));
	var links = $('body link').clone().appendTo(head);
	$(head).find('link').each(function() {
		if ($(this).attr('href')==='/stylesheets/style.css') {
			$(this).remove();
			return;
		}
		if ($(this).attr('href')[0]==='/') {
			$(this).attr('href', "http://localhost:3000" + $(this).attr('href'));
		}
	});

	var body = document.createElement('body');
	var container = document.createElement('div');
	container.className = 'container-fluid';

	container.appendChild(document.getElementById('statsTotal').cloneNode(true));
	$(container).find('#statsTotal').attr('style', 'max-width: 400px');
	$(container).find('#statsTotal').addClass('mb-3');
	container.appendChild(document.getElementById('charNav').cloneNode(true));
	$(container).find('#charNav').addClass('show active mb-4');
	container.appendChild(document.getElementById('sideCharNav').cloneNode(true));
	$(container).find('#sideCharNav').addClass('show active mb-4');
	container.appendChild(document.getElementById('rarityNav').cloneNode(true));
	$(container).find('#rarityNav').addClass('show active mb-2');
	container.appendChild(document.createElement('div'));

	var watermark = document.createElement('div');
	watermark.innerHTML = window.location.href.split('/').slice(-2)[0] + "'s Obey Me collection stats<br />Made with karasu-os.com";
	watermark.className = 'text-muted text-right';

	container.appendChild(watermark);

	var newHTML = document.implementation.createHTMLDocument();
	$(head).children().appendTo($(newHTML).find('head')[0]);
	newHTML.body.appendChild(container);
	return new XMLSerializer().serializeToString(newHTML);
}
