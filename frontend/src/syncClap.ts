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

    // Broad bandpass centered where a real clap's energy sits, rather than
    // a narrow tone - makes it stand out against low-frequency room hum
    // and keeps most of the webcam mics' usable frequency range loud.
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.98, now + 0.003); // fast attack, avoids a click
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // true decay, avoids a click on stop

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration + 0.02);
    noise.onended = () => ctx.close();
  } catch {
    // Audio isn't essential to the study - never let it block session start.
  }
}
