$(document).ready(function() {
  clearTimer();

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

  $("form#tree input").on("change", updateUserTree);
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


let timer, toastTimer, distance = 5;

function clearTimer() {
  clearInterval(timer);
  clearTimeout(toastTimer);
  timer = null;
  toastTimer = null;
  distance = 5;

  $("#treeToast .progress-bar").width("100%").attr('aria-valuenow', 100);
}

let changes = {};

function updateUserTree() {
  clearTimer();
  $("#treeToast").toast("show");
  $("#treeToast .progress").css("visibility", "visible");

  changes[$(this).val()] = $(this).is(":checked");

  timer = setInterval(function() {
    if (distance-- > 0) {
      $("#treeToast strong").text("Saving... (do not close tab)");
      $("#treeToast .progress-bar").width(distance/5 * 100 + "%").attr('aria-valuenow', distance * 10);
    } else {
      clearInterval(timer);
      $.post("/update_tree", { changes: changes })
        .done(function(result) {
          if (result.err) {
            $("#treeToast strong").text("Something went wrong.");
          } else {
            $("#treeToast strong").text("Saved!");
            $("#treeToast .progress").css("visibility", "hidden");
          }
          clearTimer();
          toastTimer = setTimeout(() => {
            $("#treeToast").toast("hide");
            $("#treeToast strong").text("");
          }, 5000);
          changes = {};
        });
    }
  }, 1000);
}
