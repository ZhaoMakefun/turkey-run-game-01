// Gobble Getaway — boot and main loop.
// Wires the canvas, input, world, renderer and synthesised sound together:
// a fixed logical field scaled to the window, a requestAnimationFrame loop
// with clamped delta time, and one sound per world event. In screenshot mode
// (`?shot=...`) the staged scene is rendered once and the loop never advances
// it, so the capture is exactly the frame the maker staged.

import { FIELD } from './config.js';
import { createInput } from './input.js';
import { createWorld, updateWorld, startRun } from './world.js';
import { renderWorld } from './render.js';
import { applyShot } from './shots.js';
import {
  unlockAudio, toggleMute, isMuted,
  playJump, playDash, playCorn, playFeather, playPie, playHit,
  playKnifeWhizz, playHide, playGobble, playStageClear, playCaught, playEscaped,
} from './audio.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

canvas.width = FIELD.width;
canvas.height = FIELD.height;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const seed = (Date.now() % 2147483646) + 1;
const world = createWorld(seed);
const input = createInput(canvas);
const shot = applyShot(world, window.location.search);

// Handle for smoke tests and for players who want to peek at the state.
window.__gobble = { world, input };

function playEventSound(event) {
  switch (event) {
    case 'jump': playJump(); break;
    case 'dash': playDash(); break;
    case 'corn': playCorn(); break;
    case 'feather': playFeather(); break;
    case 'pie': playPie(); break;
    case 'hit': playHit(); break;
    case 'knife': playKnifeWhizz(); break;
    case 'hide': playHide(); break;
    case 'gobble': playGobble(); break;
    case 'stage': playStageClear(); break;
    case 'caught': playCaught(); break;
    case 'escaped': playEscaped(); break;
    default: break;
  }
}

function announceStatus() {
  if (!statusLine) return;
  const phaseText = {
    title: 'Gobble Getaway title screen. Press Enter to start running from the farmer.',
    playing: `Running. Score ${world.score}, ${Math.floor(world.distanceMetres)} metres, ${world.lives} lives.`,
    paused: 'Paused.',
    caught: `Caught. Final score ${world.score}. Press R to run again.`,
    escaped: `Escaped. Final score ${world.score}. Press R to run again.`,
  };
  const text = phaseText[world.phase] || '';
  if (statusLine.textContent !== text) statusLine.textContent = text;
}

function frame(time) {
  const dt = Math.min(0.05, (time - frame.last) / 1000 || 0.016);
  frame.last = time;
  if (input.mutePressed()) toggleMute();
  if (world.phase === 'paused' && input.restartPressed()) startRun(world);
  const events = updateWorld(world, input, dt);
  for (const event of events) playEventSound(event);
  renderWorld(ctx, world);
  announceStatus();
  input.endFrame();
  requestAnimationFrame(frame);
}
frame.last = 0;

canvas.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio, { once: false });

if (shot) {
  // A staged screenshot: one exact frame, no advancing the simulation, so the
// capture is the frame the maker staged and nothing the clock happened to show.
  renderWorld(ctx, world);
  announceStatus();
  document.title = `Gobble Getaway — ${shot} shot`;
} else {
  document.title = 'Gobble Getaway — The Great Thanksgiving Escape';
  requestAnimationFrame(frame);
}
