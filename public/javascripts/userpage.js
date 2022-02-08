var page, sortby, order;
$(document).ready(function() {
  $(".form-control[name='support']").focusout(updateSupportStatus);

  if ('URLSearchParams' in window) {
    const params = new URLSearchParams(document.location.search.substring(1));
    page = params.get("page")?params.get("page"):1;
    sortby = params.get("sortby")?params.get("sortby"):'';
    order = params.get("order")?params.get("order"):1;

    $("select[name='sortby']").val(sortby);
    $(`input[value="${order}"]`).prop("checked", true);

    paginate(tableData)
  } else {
    console.error("Unsupported Browser for URLSearchParams");
  }
});

function paginate(tableData) {
  const totalpage = tableData.totalpage;
  sortby = "&sortby=" + sortby;
  order = "&order=" + order;

  // add first
  if (tableData.previouspage) {
    $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=1${sortby}${order}">First</a></li>`)
  } else {
    $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">First</a></li>`)
  }
  // add in-between
  for (let i = 1; i < totalpage + 1; i++) {
    $("ul.pagination").append(`<li class="page-item${i==page?" active":""}"><a class="page-link" href="?page=${i}${sortby}${order}">${i}</a></li>`)
  }
  // add last
  if (tableData.nextpage) {
    $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=${totalpage}${sortby}${order}">Last</a></li>`)
  } else {
    $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">Last</a></li>`)
  }
}

function updateSupportStatus() {
  $.post("/updateSupport", {
    user: $(this).parent().attr("id"),
    newstatus: $(this).val()
  }).done(function(result) {
    alert(JSON.stringify(result));
  });
}
