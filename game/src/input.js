// Keyboard and mouse input for Gobble Getaway.
// The world reads two things each frame: which keys are held right now, and
// which actions were pressed since the last frame (edge-triggered, so a jump
// queued between frames is never lost). Clicking the canvas jumps; clicking a
// menu button is handled by the caller through the reported pointer position.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointer = { x: 0, y: 0, clicked: false, down: false };

  function codeOf(event) {
    return event.code;
  }

  function onKeyDown(event) {
    const gameKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyX', 'KeyP', 'KeyM', 'KeyR', 'Enter'];
    if (gameKeys.includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.add(codeOf(event));
    held.add(codeOf(event));
  }

  function onKeyUp(event) {
    held.delete(codeOf(event));
  }

  function onPointerDown(event) {
    // The canvas is scaled by CSS, so map the click back into logical pixels.
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      clicked: true,
      down: true,
    };
    pressed.add('Pointer');
  }

  function onPointerUp() {
    pointer = { ...pointer, down: false };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    // Held-down queries.
    jumpHeld() {
      return held.has('Space') || held.has('ArrowUp') || held.has('KeyW');
    },
    duckHeld() {
      return held.has('ArrowDown') || held.has('KeyS');
    },
    dashHeld() {
      return held.has('ShiftLeft') || held.has('ShiftRight') || held.has('KeyX');
    },
    // Edge-triggered queries: true once per physical press.
    jumpPressed() {
      return pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW') || pressed.has('Pointer');
    },
    dashPressed() {
      return pressed.has('ShiftLeft') || pressed.has('ShiftRight') || pressed.has('KeyX');
    },
    startPressed() {
      return pressed.has('Enter') || pressed.has('Space') || pressed.has('Pointer');
    },
    restartPressed() {
      return pressed.has('KeyR') || pressed.has('Enter') || pressed.has('Pointer');
    },
    pausePressed() {
      return pressed.has('KeyP');
    },
    mutePressed() {
      return pressed.has('KeyM');
    },
    pointer() {
      return pointer;
    },
    // Called at the end of each frame so presses do not leak into the next one.
    endFrame() {
      pressed.clear();
      pointer = { ...pointer, clicked: false };
    },
  };
}
