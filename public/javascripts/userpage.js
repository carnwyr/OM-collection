$(document).ready(function(){
  $(".form-control").focusout(updateSupportStatus);
});

function paginate(tableData) {
  if ('URLSearchParams' in window) {
    const params = new URLSearchParams(document.location.search.substring(1));
    const page = params.get("page")?params.get("page"):1;
    const sortby = params.get("sortby")?params.get("sortby"):"date";

    var totalpage = tableData.totalpage;

    // add first
    if (tableData.previouspage) {
      $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=1&sortby=${sortby}">First</a></li>`)
    } else {
      $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">First</a></li>`)
    }
    // add in-between
    for (let i = 1; i < totalpage + 1; i++) {
      $("ul.pagination").append(`<li class="page-item${i==page?" active":""}"><a class="page-link" href="?page=${i}&sortby=${sortby}">${i}</a></li>`)
    }
    // add last
    if (tableData.nextpage) {
      $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=${totalpage}&sortby=${sortby}">Last</a></li>`)
    } else {
      $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">Last</a></li>`)
    }
  } else {
    console.error("Unsupported Browser for URLSearchParams");
  }
}

function updateSupportStatus() {
  var supportstatus = new Object();
  var str = $(this).val();
  supportstatus.user = $(this).parent().attr("id");
  supportstatus.newstatus = str.substring(2, str.length - 2).split('","');

  $.ajax({
    type: "post",
    url: "/updateSupport",
    contentType: "application/json",
    data: JSON.stringify({ supportstatus: supportstatus })
  }).done(function(result) {
    if (result.err) {
      // console.error(result.message);
      return;
    } else {
      // console.log(result.message);
    }
  });
}
