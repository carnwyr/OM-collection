$(document).ready(function(){
    $('#name').on('focusout', fillUniqueName);

	$("#uploadL").on('change', {extra: '#imageResultL'}, imageUploaded);
	$("#uploadLB").on('change', {extra: '#imageResultLB'}, imageUploaded);
	$("#uploadS").on('change', {extra: '#imageResultS'}, imageUploaded);

    $('.image-area button').on('click', removeImage);

    $('#save').on('click', saveChanges);
});

function fillUniqueName() {
    var name = $('#name').val();
    var uniqueName = name.replace(/[\\/:*?"<>|]/g, '');
    var uniqueName = uniqueName.replace(/ /g, '_');
    $('#uniqueName').val(uniqueName);
}

function imageUploaded(e) {
	if (this.files && this.files[0]) {
        var reader = new FileReader();

        var imageArea = e.data.extra;
        reader.onload = function (e) {
            $(imageArea).attr('src', e.target.result);
            $(imageArea).siblings('button').show();
        };
        reader.readAsDataURL(this.files[0]);
    }
}

function removeImage(e) {
    e.preventDefault();
    $(this).siblings('img').attr('src', '');
    $(this).hide();
    // remove file
}

function saveChanges(e) {
    e.preventDefault();
    if (!validateFields()) {
        return;
    }
}

function validateFields() {
    var uniqueName = $('#uniqueName').val();
    if (/[\\/:*?"<>| ]/.test(uniqueName)) {
        showAlert(false, 'Invalid unique name');
        return false;
    }
    var images = $('.upload');
    for (let i = 0; i < images.length; i++) {
        let fileName = $(images[i]).val();
        if (fileName) {
            let parts = fileName.split('.');
            let extension = parts[parts.length - 1];
            if (extension !== 'jpg') {
                showAlert(false, 'All uploaded images must be jpg');
                return false;
            }
        }
    }
    return true;
}

function showAlert(isSuccess, message) {
    var alert = isSuccess ? '#successAlert' : '#failAlert';
    $(alert).html(message);
    $(alert).show().animate({top: 65}, 500);
    setTimeout(function () {
        $(alert).animate({top: -100}, 500).promise().done(function() {$(alert).hide()})
      }, 3000);
}