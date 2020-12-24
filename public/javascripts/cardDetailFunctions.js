$(document).ready(function() {
  $(".cards, .favourites").on("click", updateCollection);
  if (hasCard[0]===null) {
    $(".cards").addClass("addCardButton");
  } else {
    $(".cards").addClass("removeCardButton");
  }
  if (hasCard[1]===null) {
    $(".favourites").addClass("addCardButton");
  } else {
    $(".favourites").addClass("removeCardButton");
  }
});

function updateCollection() {
  var collectionType, updateType, action;
  if ($(this).hasClass("cards")) {
    collectionType = "cards";
  } else {
    collectionType = "favourites";
  }

  if ($(this).hasClass("addCardButton")) {
    updateType = "/addToCollection";
    action = "added to";
  } else {
    updateType = "/removeFromCollection";
    action = "removed from";
  }

  $.ajax({
    type: "post",
    url: "/card/" + cardName + updateType,
    contentType: "application/json",
    data: JSON.stringify({ collection: collectionType })
  }).done(function(data) {
    if (!data.error) {
      $('.'+collectionType).toggleClass("addCardButton removeCardButton");
      var updatedVal = data.updatedVal?data.updatedVal:0; // may be removed later
      if (collectionType==="cards") {
        $(".ownedCount").text("Collected by "+updatedVal+"% of users");
      } else {
        $(".faveCount").text("by "+updatedVal+"% of users");
      }
      $("div#successAlert").html("Card "+action+" your "+collectionType+" collection");
      showAlert("div#successAlert");
    } else {
      showAlert("div#failAlert");
    }
  });
}

function showAlert(alert) {
  $(alert).show().animate({ top: 65 }, 500);
  setTimeout(function() {
    $(alert).animate({ top: -100 }, 500).promise().done(function() {
      $(alert).hide();
    });
  }, 3600);
}
