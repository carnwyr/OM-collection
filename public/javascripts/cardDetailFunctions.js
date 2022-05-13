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

  $("form#tree input").on("change", updateUserTreeNode);
});

function updateCollection() {
  let collectionType, updateType;
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
    url: "/card/" + CARD_NAME + "/modifyCollectionFromDetails",
    contentType: "application/json",
    data: JSON.stringify({ collection: collectionType, modify: updateType })
  }).done(function(data) {
    if (!data.err) {
      $('.'+collectionType).toggleClass("addCardButton removeCardButton");
      if (collectionType === "owned") {
        $(".ownedCount").text(i18next.collected_count.replace("undefined", data.updatedVal));
      } else {
        $(".favedCount").html(i18next.favourite_count.replace("undefined", data.updatedVal));
      }
      showAlert("success", data.message);
    } else {
      showAlert("danger", data.message);
    }
  });
}

function updateUserTreeNode() {
  $.post("/update_tree", { node: $(this).val(), isUnlocked: $(this).is(":checked") })
    .done(function(result) {
      if (result.err) {
        showAlert("danger", result.message);
      } else {
        showAlert("success", result.message);
      }
    });
}
