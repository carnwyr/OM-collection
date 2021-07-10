var originalUniqueName = '';

$(document).ready(function() {
  originalUniqueName = $('#uniqueName').val() ? $('#uniqueName').val() : '';

  $('#name').on('focusout', fillUniqueName);

  $("#uploadL").on('change', {extra: '#imageResultL'}, imageUploaded);
  $("#uploadLB").on('change', {extra: '#imageResultLB'}, imageUploaded);
  $("#uploadS").on('change', {extra: '#imageResultS'}, imageUploaded);

  $('.image-area button').on('click', removeImage);

  $('#save').on('click', saveChanges);

  $("#addEvent, #ja_addEvent").on("click", addEvent);
  $("#removeEvent, #ja_removeEvent").on("click", removeEvent);
});

function fillUniqueName() {
  var name = $('#name').val();
  var uniqueName = name.replace(/[\\/:*?"<>|]/g, '');
  uniqueName = uniqueName.replace(/ /g, '_');
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

  var uploadId = '#upload' + $(this).siblings('img').attr('id').replace('imageResult', '');
  $(uploadId).val('');
}

function saveChanges(e) {
  e.preventDefault();
  if (!validateFields()) {
    return;
  }
  updateCard();
}

function validateFields() {
  var uniqueName = $('#uniqueName').val();
  if (/[\\/:*?"<>| ]/.test(uniqueName)) {
    showAlert("danger", 'Invalid unique name');
    return false;
  }
  if (!$('#name').val() || !uniqueName) {
    showAlert("danger", 'Name and unique name must be filled');
    return false;
  }
  var images = $('.upload');
  for (let image of images) {
    let fileName = $(image).val();
    if (fileName) {
      let parts = fileName.split('.');
      let extension = parts[parts.length - 1];
      if (extension !== 'jpg') {
        showAlert("danger", 'All uploaded images must be jpg');
        return false;
      }
    }
  }
  return true;
}

function updateCard() {
  var images = {};
  var readL = readImage($('#uploadL')[0]);
  var readLB = readImage($('#uploadLB')[0]);
  var readS = readImage($('#uploadS')[0]);

  Promise.all([readL, readLB, readS]).then(values => {
    if (values[0]) images.L = values[0];
    if (values[1]) images.LB = values[1];
    if (values[2]) images.S = values[2];
    sendCardData(images);
  }, reason => {
    showAlert("danger", "Can't load images\n" + reason.message);
  });
}

function readImage(upload) {
  return new Promise((resolve, reject) => {
    if (upload.files && upload.files[0]) {
      let reader = new FileReader();
      reader.onloadend = function (e) {
        resolve(e.target.result);
      };
      try {
        reader.readAsDataURL(upload.files[0]);
      } catch(err) {
        reject(err);
      }
    } else {
      resolve('');
    }
  });
}

function sendCardData(images) {
  var cardData = {
    name: $('#name').val(),
    uniqueName: $('#uniqueName').val(),
    ja_name: $("#ja_name").val(),
    source: getCardSource("#source"),
    ja_source: getCardSource("#ja_source"),
    type: $('#type').val(),
    rarity: $('#rarity').val(),
    attribute: $('#attribute').val(),
    characters: $('#characters').val(),
    number: $('#number').val(),
    originalUniqueName: originalUniqueName,
    images: images,
    isHidden: $('#isHidden')?$('#isHidden').prop('checked'):false
  };

  $.ajax({
    type: 'post',
    url: '/card/updateCard',
    contentType: 'application/json',
    data: JSON.stringify({cardData: cardData})
  })
  .done(function(result) {
    if (result.err) {
      showAlert("danger", result.message);
      return;
    }
    showAlert("success", 'Card successfully updated!');
  });
}

function getCardSource(src) {
  var list = $.map($(src).children(), input => $(input).val()).filter(x => x !== "");
  return list;
}

function addEvent() {
  var target = $(this).data("target");
  $(target).append(`<input class="form-control" type="text" name="${target}">`);
}

function removeEvent() {
  var target = $(this).data("target");
  $(target + " input:last-child").remove();
}
