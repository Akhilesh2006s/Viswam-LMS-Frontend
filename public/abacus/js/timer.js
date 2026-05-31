(function () {
  let timer = null;

  function startTimer() {
    if (timer) clearInterval(timer);

    const TOTAL_TIME = 300;

    let startTime = Date.now();
    const display = document.getElementById('timer');

    timer = setInterval(() => {
      let elapsed = Math.floor((Date.now() - startTime) / 1000);
      let remaining = TOTAL_TIME - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        display.innerText = '0:00';
        showWorksheet();
        return;
      }

      let min = Math.floor(remaining / 60);
      let sec = remaining % 60;

      display.innerText = min + ':' + (sec < 10 ? '0' + sec : sec);
    }, 1000);
  }

  window.startTimer = startTimer;
})();
