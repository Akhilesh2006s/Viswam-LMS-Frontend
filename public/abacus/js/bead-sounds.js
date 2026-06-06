(function () {
  let audioCtx = null;

  function getAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    return audioCtx;
  }

  function ensureAudioReady() {
    const ctx = getAudioContext();
    if (!ctx) return Promise.resolve(null);
    if (ctx.state === 'suspended') return ctx.resume().then(() => ctx);
    return Promise.resolve(ctx);
  }

  function playNoiseBurst(opts) {
    ensureAudioReady().then((ctx) => {
      if (!ctx) return;

      const { decay, frequency, gain: peakGain, q } = opts;
    const frameCount = Math.ceil(ctx.sampleRate * decay);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channel[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + decay + 0.02);
    });
  }

  function preloadBeadSounds() {
    return ensureAudioReady();
  }

  function playWoodenClick() {
    playNoiseBurst({ frequency: 800, q: 0.8, gain: 0.55, decay: 0.1 });
  }

  function playStoneTap() {
    playNoiseBurst({ frequency: 2000, q: 2.0, gain: 0.45, decay: 0.06 });
  }

  function playBeadSound(direction) {
    if (direction === 'up') playWoodenClick();
    else playStoneTap();
  }

  window.AbacusBeadSounds = {
    playBeadSound,
    playWoodenClick,
    playStoneTap,
    preloadBeadSounds,
  };
})();
