$(document).ready(function(){
	$("#uploadL").on('change', {extra: '#imageResultL'}, imageUploaded);
	$("#uploadLB").on('change', {extra: '#imageResultLB'}, imageUploaded);
	$("#uploadS").on('change', {extra: '#imageResultS'}, imageUploaded);

    $('.image-area button').on('click', removeImage);
});

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