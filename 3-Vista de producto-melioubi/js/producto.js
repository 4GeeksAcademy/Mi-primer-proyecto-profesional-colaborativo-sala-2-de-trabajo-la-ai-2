(function () {
  window.updateQty = function (delta) {
    var input = document.getElementById('cantidad');
    if (!input) return;
    var val = parseInt(input.value, 10) + delta;
    var min = parseInt(input.min, 10);
    var max = parseInt(input.max, 10);
    if (val >= min && val <= max) {
      input.value = val;
    }
  };
})();
