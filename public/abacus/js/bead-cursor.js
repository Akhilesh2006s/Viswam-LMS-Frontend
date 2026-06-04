(function () {
  const WOOD = '#8B5E3C';
  const STONE = '#6B7280';
  const SIZE = 36;
  const HALF = SIZE / 2;
  const GRAD_ID = 'abacusBeadCursorGrad';

  let cursorEl = null;
  let currentFill = WOOD;
  let boardBound = false;

  function shadeHex(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function cursorMarkup(fill) {
    const light = shadeHex(fill, 55);
    const dark = shadeHex(fill, -45);
    return (
      '<svg width="' +
      SIZE +
      '" height="' +
      SIZE +
      '" viewBox="0 0 ' +
      SIZE +
      ' ' +
      SIZE +
      '">' +
      '<defs><radialGradient id="' +
      GRAD_ID +
      '" cx="38%" cy="32%" r="58%">' +
      '<stop offset="0%" stop-color="' +
      light +
      '"/>' +
      '<stop offset="72%" stop-color="' +
      fill +
      '"/>' +
      '<stop offset="100%" stop-color="' +
      dark +
      '"/>' +
      '</radialGradient></defs>' +
      '<circle cx="' +
      HALF +
      '" cy="' +
      HALF +
      '" r="16" fill="url(#' +
      GRAD_ID +
      ')"/>' +
      '<line x1="5" y1="' +
      HALF +
      '" x2="31" y2="' +
      HALF +
      '" stroke="rgba(0,0,0,0.28)" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="11" cy="10" r="2.5" fill="rgba(255,255,255,0.5)"/>' +
      '</svg>'
    );
  }

  function ensureCursor() {
    if (cursorEl) return cursorEl;
    cursorEl = document.createElement('div');
    cursorEl.id = 'abacus-bead-cursor';
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.innerHTML = cursorMarkup(currentFill);
    document.body.appendChild(cursorEl);
    return cursorEl;
  }

  function setFillForDirection(direction) {
    currentFill = direction === 'up' ? WOOD : STONE;
    const el = ensureCursor();
    el.innerHTML = cursorMarkup(currentFill);
  }

  function move(x, y) {
    const el = ensureCursor();
    el.style.left = x - HALF + 'px';
    el.style.top = y - HALF + 'px';
  }

  function setVisible(visible) {
    const el = ensureCursor();
    el.style.opacity = visible ? '1' : '0';
  }

  function setPressed(pressed) {
    const el = ensureCursor();
    el.style.transform = pressed ? 'scale(0.85)' : 'scale(1)';
  }

  function feedback(direction) {
    window.AbacusBeadSounds?.playBeadSound(direction);
    setFillForDirection(direction);
  }

  function bindBead(beadEl) {
    if (!beadEl) return;
    beadEl.style.cursor = 'none';
    beadEl.addEventListener('mousedown', function () {
      setPressed(true);
    });
  }

  function bindBoard(abacusEl) {
    if (!abacusEl || boardBound) return;
    const wrap = abacusEl.closest('.abacus-board-wrap') || abacusEl.parentElement || abacusEl;
    ensureCursor();
    setVisible(false);

    wrap.addEventListener('mousemove', function (e) {
      move(e.clientX, e.clientY);
    });
    wrap.addEventListener('mouseenter', function () {
      setVisible(true);
    });
    wrap.addEventListener('mouseleave', function () {
      setVisible(false);
    });

    if (!window.__abacusBeadCursorMouseUp) {
      window.__abacusBeadCursorMouseUp = true;
      window.addEventListener('mouseup', function () {
        setPressed(false);
      });
    }

    boardBound = true;
  }

  function resetBoardBinding() {
    boardBound = false;
  }

  window.AbacusBeadCursor = {
    feedback,
    bindBead,
    bindBoard,
    resetBoardBinding,
    setPressed,
  };
})();
