function paginate(tableData) {
  if ('URLSearchParams' in window) {
    const params = new URLSearchParams(document.location.search.substring(1));
    const page = params.get("page")?params.get("page"):1;
    const sortby = params.get("sortby")?params.get("sortby"):"date";

    var totalpage = tableData.totalpage;

    // add first
    if (tableData.previouspage) {
      $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=1&${sortby}">First</a></li>`)
    } else {
      $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">First</a></li>`)
    }
    // add in-between
    for (let i = 1; i < totalpage + 1; i++) {
      $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=${i}&sortby=${sortby}">${i}</a></li>`)
    }
    // add last
    if (tableData.nextpage) {
      $("ul.pagination").append(`<li class="page-item"><a class="page-link" href="?page=${tableData.totalpage}&sortby=${sortby}">Last</a></li>`)
    } else {
      $("ul.pagination").append(`<li class="page-item disabled"><a class="page-link" href="#">Last</a></li>`)
    }
  } else {
    console.log("Unsupported Browser");
  }
}
