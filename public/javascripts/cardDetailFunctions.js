$(document).ready(function() {
  $(".owned, .favourites").on("click", updateCollection);
  if (stats.ownsCard === false) {
    $(".owned").addClass("addCardButton");
  } else {
    $(".owned").addClass("removeCardButton");
  }
  if (stats.favesCard === false) {
    $(".favourites").addClass("addCardButton");
  } else {
    $(".favourites").addClass("removeCardButton");
  }
});

function updateCollection() {
  var collectionType, updateType;
  if ($(this).hasClass("owned")) {
    collectionType = "owned";
  } else {
    collectionType = "favourites";
  }

  if ($(this).hasClass("addCardButton")) {
    updateType = "add";
  } else {
    updateType = "remove";
  }

  $.ajax({
    type: "post",
    url: "/card/" + cardName + "/modifyCollectionFromDetails",
    contentType: "application/json",
    data: JSON.stringify({ collection: collectionType, modify: updateType })
  }).done(function(data) {
    if (!data.err) {
      $('.'+collectionType).toggleClass("addCardButton removeCardButton");
      if (collectionType === "owned") {
        $(".ownedCount").text("Collected by "+data.updatedVal+"% of users");
      } else {
        $(".favedCount").text("by "+data.updatedVal+"% of users");
      }
      showAlert("success", data.message);
    } else {
      showAlert("warning", "Something went wrong :(");
    }
  });
}
