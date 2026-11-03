import * as THREE from 'three';

/**
 * High-frequency transient input & spatial tracking store.
 * Mutated directly by touch/pointer/keyboard handlers and read inside R3F useFrame
 * to achieve zero-garbage, zero-rerender 60fps performance on smartphones.
 */
export interface TransientInputState {
  // Normalized analog joystick vector [-1..1]
  moveX: number;
  moveY: number; // +1 = forward (up on joystick), -1 = backward

  // Keyboard directional state (merged seamlessly with touch joystick)
  keys: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  };

  // Camera orbit angles controlled by right-side touch drag
  cameraYaw: number;
  cameraPitch: number;

  // Player live spatial transforms for camera & NPC gaze tracking
  playerPosition: THREE.Vector3;
  playerHeading: number;
  playerSpeed: number;

  // Male character live head/world position for cross-gaze tracking
  malePosition: THREE.Vector3;
}

export const transientInput: TransientInputState = {
  moveX: 0,
  moveY: 0,
  keys: {
    forward: false,
    backward: false,
    left: false,
    right: false,
  },
  cameraYaw: 0,
  cameraPitch: 0.24,
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerHeading: 0,
  playerSpeed: 0,
  malePosition: new THREE.Vector3(0, 0, 0),
};

export function resetPlayerTransform(
  pos: [number, number, number],
  heading = 0,
  cameraYaw = 0,
  cameraPitch = 0.24
): void {
  transientInput.playerPosition.set(pos[0], pos[1], pos[2]);
  transientInput.playerHeading = heading;
  transientInput.playerSpeed = 0;
  transientInput.moveX = 0;
  transientInput.moveY = 0;
  transientInput.cameraYaw = cameraYaw;
  transientInput.cameraPitch = cameraPitch;
}

export function getCombinedMovementVector(): { x: number; y: number; magnitude: number } {
  let kx = 0;
  let ky = 0;
  if (transientInput.keys.left) kx -= 1;
  if (transientInput.keys.right) kx += 1;
  if (transientInput.keys.forward) ky += 1;
  if (transientInput.keys.backward) ky -= 1;

  let x = transientInput.moveX + kx;
  let y = transientInput.moveY + ky;

  const mag = Math.hypot(x, y);
  if (mag > 1) {
    x /= mag;
    y /= mag;
  }
  return { x, y, magnitude: Math.min(1, mag) };
}
