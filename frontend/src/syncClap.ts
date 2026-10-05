// Loud clap-style sync marker, played once all 3 recordings (2 webcams +
// screen) are confirmed rolling. Synthesized via Web Audio (filtered noise
// burst, not a pure tone) instead of a bundled asset so there's nothing to
// load/license, and so it reads as a sharp, broadband transient rather than
// a tone that can blend into ambient room hum.
export function playSyncClap() {
  try {
    const ctx = new AudioContext();
    const duration = 0.18;
    const now = ctx.currentTime;

    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Highpass rather than a narrow bandpass - cuts the low-frequency room
    // hum/fan noise a clap doesn't have, but otherwise passes almost all of
    // the broadband noise energy through, which reads as much louder than
    // a narrow band centered on one frequency.
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1.6, now + 0.003); // fast attack, avoids a click
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // true decay, avoids a click on stop

    // Limiter on the boosted signal - catches the overs from pushing gain
    // past 1.0 so the clap reads louder without just hard-clipping into
    // harsh distortion.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 4;
    compressor.ratio.value = 20;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.1;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(compressor);
    compressor.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration + 0.02);
    noise.onended = () => ctx.close();
  } catch {
    // Audio isn't essential to the study - never let it block session start.
  }
}
