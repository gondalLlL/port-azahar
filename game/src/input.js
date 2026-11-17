export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SHOOT = 16;
export const ACTION_SAVE = 32;
export const ACTION_MUTE = 64;

export function createInput(canvas) {
  const keys = new Set();
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  let mouseDown = false;
  let actionsPressed = 0;

  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'KeyL' || e.code === 'KeyM' || e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter') {
      if (e.code === 'Space' || e.code === 'Enter') actionsPressed |= ACTION_CONFIRM;
      if (e.code === 'Escape' || e.code === 'KeyP') actionsPressed |= ACTION_PAUSE;
      if (e.code === 'KeyE' || e.code === 'KeyF') actionsPressed |= ACTION_INTERACT;
      if (e.code === 'KeyL') actionsPressed |= ACTION_SAVE;
      if (e.code === 'KeyM') actionsPressed |= ACTION_MUTE;
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
  });

  canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    actionsPressed |= ACTION_CONFIRM;
    if (e.button === 0) actionsPressed |= ACTION_SHOOT;
    if (e.button === 2) actionsPressed |= ACTION_PUNCH;
  });

  canvas.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    isDown(code) {
      return keys.has(code);
    },
    getAxis() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      return { x, y };
    },
    isSprinting() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    isHandbrake() {
      return keys.has('Space');
    },
    getMouse() {
      return { x: mouseX, y: mouseY, down: mouseDown };
    },
    takeActions() {
      const a = actionsPressed;
      actionsPressed = 0;
      return a;
    }
  };
}
