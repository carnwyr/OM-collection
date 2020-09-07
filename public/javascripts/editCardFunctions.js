$(document).ready(function(){
    $('#name').on('focusout', fillUniqueName);

	$("#uploadL").on('change', {extra: '#imageResultL'}, imageUploaded);
	$("#uploadLB").on('change', {extra: '#imageResultLB'}, imageUploaded);
	$("#uploadS").on('change', {extra: '#imageResultS'}, imageUploaded);

    $('.image-area button').on('click', removeImage);
});

function fillUniqueName() {
    var name = $('#name').val();
    var uniqueName = name.replace(/[\/:*?"<>|]+/g, '');
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
}