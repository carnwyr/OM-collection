$(document).ready(function(){
	$("#uploadL").on('change', {extra: '#imageResultL'}, imageUploaded);
	$("#uploadLB").on('change', {extra: '#imageResultLB'}, imageUploaded);
	$("#uploadS").on('change', {extra: '#imageResultS'}, imageUploaded);
});

function imageUploaded(e) {
	console.log()
	if (this.files && this.files[0]) {
        var reader = new FileReader();

        var imageArea = e.data.extra;
        reader.onload = function (e) {
            $(imageArea).attr('src', e.target.result);
        };
        reader.readAsDataURL(this.files[0]);
    }
}