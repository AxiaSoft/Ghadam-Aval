import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Compass } from 'lucide-react';
import { transientInput } from '../state/inputStore';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';

const PLAYABLE_STAGES = new Set([
  'MISSION_1',
  'MISSION_2',
  'MISSION_3',
  'CLASSROOM_GAMEPLAY',
  'FINAL_DECISION',
]);

export const MobileControls: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const isPaused = useGameStore((s) => s.isPaused);
  const finalDecision = useGameStore((s) => s.finalDecision);
  const activeInteraction = useGameStore((s) => s.activeInteraction);

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joyPointerId = useRef<number | null>(null);
  const joyOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);

  const camPointerId = useRef<number | null>(null);
  const camLastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isPlayable =
    PLAYABLE_STAGES.has(stage) &&
    !isPaused &&
    !(stage === 'FINAL_DECISION' && finalDecision !== null);

  useEffect(() => {
    if (!isPlayable) {
      transientInput.moveX = 0;
      transientInput.moveY = 0;
      joyPointerId.current = null;
      camPointerId.current = null;
      setKnobOffset({ x: 0, y: 0 });
      setJoyActive(false);
    }
  }, [isPlayable]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlayable) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          transientInput.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          transientInput.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          transientInput.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          transientInput.keys.right = true;
          break;
        case 'KeyE':
        case 'Space':
          if (useGameStore.getState().activeInteraction) {
            e.preventDefault();
            audioManager.playSfx('ui_tap');
            useGameStore.getState().activeInteraction?.onInteract();
          }
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          transientInput.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          transientInput.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          transientInput.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          transientInput.keys.right = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      transientInput.keys.forward = false;
      transientInput.keys.backward = false;
      transientInput.keys.left = false;
      transientInput.keys.right = false;
    };
  }, [isPlayable]);

  if (!isPlayable) return null;

  const MAX_RADIUS = 44;

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== null) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    joyPointerId.current = e.pointerId;

    const rect = joystickBaseRef.current?.getBoundingClientRect();
    if (rect) {
      joyOrigin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    } else {
      joyOrigin.current = { x: e.clientX, y: e.clientY };
    }

    setJoyActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const dx = clientX - joyOrigin.current.x;
    const dy = clientY - joyOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(MAX_RADIUS, dist);
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setKnobOffset({ x: kx, y: ky });

    const normX = kx / MAX_RADIUS;
    const normY = -ky / MAX_RADIUS;
    const deadzone = 0.08;
    const mag = Math.hypot(normX, normY);
    if (mag < deadzone) {
      transientInput.moveX = 0;
      transientInput.moveY = 0;
    } else {
      transientInput.moveX = normX;
      transientInput.moveY = normY;
    }
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== joyPointerId.current) return;
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== joyPointerId.current) return;
    e.stopPropagation();
    joyPointerId.current = null;
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    transientInput.moveX = 0;
    transientInput.moveY = 0;
  };

  const handleCamDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (camPointerId.current !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    camPointerId.current = e.pointerId;
    camLastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCamMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== camPointerId.current) return;
    const dx = e.clientX - camLastPos.current.x;
    const dy = e.clientY - camLastPos.current.y;
    camLastPos.current = { x: e.clientX, y: e.clientY };

    transientInput.cameraYaw -= dx * 0.0065;
    transientInput.cameraPitch = Math.max(
      0.04,
      Math.min(0.62, transientInput.cameraPitch + dy * 0.0045)
    );
  };

  const handleCamUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== camPointerId.current) return;
    camPointerId.current = null;
  };

  const handleInteractTap = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!activeInteraction) return;
    audioManager.playSfx('ui_tap');
    activeInteraction.onInteract();
  };

  // Note: dir="ltr" keeps Left Joystick on Left & Right Camera/Action on Right per ergonomic game conventions
  return (
    <div className="mobile-controls-layer" dir="ltr">
      <div
        className="camera-touch-zone"
        onPointerDown={handleCamDown}
        onPointerMove={handleCamMove}
        onPointerUp={handleCamUp}
        onPointerCancel={handleCamUp}
        aria-label="چرخش دوربین با لمس"
      >
        <span className="camera-zone-hint" dir="rtl">
          <Compass size={13} /> برای چرخش دوربین، این سمت را بکش
        </span>
      </div>

      {/* LEFT SIDE: Virtual Movement Joystick */}
      <div
        className={`joystick-zone ${joyActive ? 'is-active' : ''}`}
        onPointerDown={handleJoyDown}
        onPointerMove={handleJoyMove}
        onPointerUp={handleJoyUp}
        onPointerCancel={handleJoyUp}
        role="slider"
        aria-label="جوی‌استیک حرکت"
        aria-valuenow={Math.round(transientInput.moveY * 100)}
      >
        <div ref={joystickBaseRef} className="joystick-base">
          <div
            className="joystick-knob"
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
          />
        </div>
        <span className="joystick-caption" dir="rtl">راه رفتن</span>
      </div>

      {/* RIGHT SIDE: Dedicated Interaction Button + Context-Sensitive Action Prompt */}
      <div className="right-action-cluster">
        {activeInteraction && (
          <button
            type="button"
            className="context-action-pill"
            dir="rtl"
            onClick={handleInteractTap}
            style={
              activeInteraction.accentColor
                ? ({ '--accent': activeInteraction.accentColor } as React.CSSProperties)
                : undefined
            }
          >
            <span className="context-action-title">{activeInteraction.label}</span>
            {activeInteraction.sublabel && (
              <span className="context-action-sub">{activeInteraction.sublabel}</span>
            )}
          </button>
        )}

        <button
          type="button"
          className={`interact-circle-btn ${activeInteraction ? 'is-ready' : 'is-idle'}`}
          disabled={!activeInteraction}
          onClick={handleInteractTap}
          aria-label={activeInteraction ? activeInteraction.label : 'تعامل'}
        >
          <Sparkles size={22} />
          <span>لمس کن</span>
        </button>
      </div>
    </div>
  );
};
