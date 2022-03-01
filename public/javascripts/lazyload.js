document.addEventListener("DOMContentLoaded", initLazyLoad);

let lazyloadImages;
let imageObserver
function initLazyLoad() {
  if ("IntersectionObserver" in window) {
    imageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var image = entry.target;
          checkImage(image.dataset.src, function() {
            image.src = image.dataset.src;
          });
          image.classList.remove("lazy");
          imageObserver.unobserve(image);
        }
      });
    });

    observeLazyImages();
  } else {
    var lazyloadThrottleTimeout;
    lazyloadImages = document.querySelectorAll(".lazy");

    function lazyload() {
      if (lazyloadThrottleTimeout) {
        clearTimeout(lazyloadThrottleTimeout);
      }

      lazyloadThrottleTimeout = setTimeout(function () {
        var scrollTop = window.pageYOffset;
        lazyloadImages.forEach(function (img) {
          if (img.offsetTop < window.innerHeight + scrollTop) {
            checkImage(image.dataset.src, function() {
              image.src = image.dataset.src;
            });
            img.classList.remove("lazy");
          }
        });
        if (lazyloadImages.length == 0) {
          document.removeEventListener("scroll", lazyload);
          window.removeEventListener("resize", lazyload);
          window.removeEventListener("orientationChange", lazyload);
        }
      }, 20);
    }

    document.addEventListener("scroll", lazyload);
    window.addEventListener("resize", lazyload);
    window.addEventListener("orientationChange", lazyload);
  }
}

function observeLazyImages(selector = ".lazy") {
  document.querySelectorAll(selector).forEach((image) => {
    imageObserver.observe(image);
  });
}

function checkImage(src, good/*, bad*/) {
  var img = new Image();
  img.onload = good;
  // img.onerror = bad;
  img.src = src;
}
