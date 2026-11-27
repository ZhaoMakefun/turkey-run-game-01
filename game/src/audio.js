// Synthesised sound for Gobble Getaway: no audio files, everything is built
// with WebAudio oscillators and filtered noise at run time. The context is
// created lazily on the first user gesture, so the title screen stays silent
// until the player interacts, and M toggles mute (remembered per browser).

import { MUTE_KEY } from './config.js';

let context = null;
let muted = false;
try {
  muted = window.localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Storage unavailable (private mode): mute still works for this visit.
  }
  return muted;
}

function ensureContext() {
  if (context) return context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context = new AudioContext();
  return context;
}

export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

// A single short tone: oscillator, quick attack, exponential decay.
function tone(freq, duration, type, volume, when = 0, slideTo = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// A burst of filtered noise, for thuds, flaps and the oven's roar.
function noiseBurst(duration, volume, cutoff, when = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

export function playJump() {
  tone(280, 0.16, 'sine', 0.16, 0, 620);
}

export function playDash() {
  noiseBurst(0.22, 0.12, 2400);
  tone(520, 0.14, 'triangle', 0.1, 0, 900);
}

export function playCorn() {
  tone(880, 0.09, 'sine', 0.16);
  tone(1318, 0.12, 'sine', 0.14, 0.07);
}

export function playFeather() {
  [1046, 1318, 1568, 2093].forEach((freq, i) => tone(freq, 0.12, 'triangle', 0.13, i * 0.06));
}

export function playPie() {
  [523, 659, 784].forEach((freq, i) => tone(freq, 0.14, 'sine', 0.14, i * 0.08));
}

export function playHit() {
  noiseBurst(0.25, 0.3, 700);
  tone(140, 0.3, 'sawtooth', 0.2, 0, 60);
}

export function playKnifeWhizz() {
  noiseBurst(0.18, 0.1, 5200);
}

export function playHide() {
  noiseBurst(0.3, 0.12, 900);
  tone(392, 0.12, 'sine', 0.1, 0.1, 330);
}

// The turkey's own voice: three quick descending gobbles.
export function playGobble() {
  [0, 0.14, 0.28].forEach((when) => {
    tone(520, 0.07, 'square', 0.09, when, 300);
    tone(380, 0.07, 'square', 0.07, when + 0.06, 240);
  });
}

export function playStageClear() {
  [523, 659, 784, 1046].forEach((freq, i) => tone(freq, 0.18, 'triangle', 0.16, i * 0.1));
}

export function playCaught() {
  [392, 330, 262, 196].forEach((freq, i) => tone(freq, 0.28, 'sawtooth', 0.14, i * 0.16));
}

export function playEscaped() {
  [523, 659, 784, 1046, 1318, 1568].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.15, i * 0.09));
  noiseBurst(0.5, 0.06, 6000, 0.2);
}
