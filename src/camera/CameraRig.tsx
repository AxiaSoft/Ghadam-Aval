import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGameStore } from '../state/gameStore';
import { transientInput } from '../state/inputStore';
import { CinematicShot, GameStage } from '../types/game';

export interface IndoorClampBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY?: number;
}

export interface CameraRigProps {
  followDistance?: number;
  followHeight?: number;
  indoorClamp?: IndoorClampBounds | null;
}

const BOTTOM_CARD_STAGES = new Set<GameStage>([
  'INTRO',
  'QUESTIONNAIRE',
  'RELATIONSHIP_QUESTION',
  'RESPECTFUL_ENDING',
  'DIALOGUE',
  'FINAL_ENDING',
]);

function clampRayToRoom(
  lookX: number,
  lookY: number,
  lookZ: number,
  rayX: number,
  rayY: number,
  rayZ: number,
  clamp: IndoorClampBounds | null
): { cx: number; cy: number; cz: number; scale: number } {
  let scale = 1.0;
  if (clamp) {
    if (rayX > 0.0001 && lookX + rayX > clamp.maxX) {
      scale = Math.min(scale, (clamp.maxX - lookX) / rayX);
    } else if (rayX < -0.0001 && lookX + rayX < clamp.minX) {
      scale = Math.min(scale, (clamp.minX - lookX) / rayX);
    }

    if (rayZ > 0.0001 && lookZ + rayZ > clamp.maxZ) {
      scale = Math.min(scale, (clamp.maxZ - lookZ) / rayZ);
    } else if (rayZ < -0.0001 && lookZ + rayZ < clamp.minZ) {
      scale = Math.min(scale, (clamp.minZ - lookZ) / rayZ);
    }

    if (clamp.maxY !== undefined && rayY > 0.0001 && lookY + rayY > clamp.maxY) {
      scale = Math.min(scale, (clamp.maxY - lookY) / rayY);
    }

    scale = THREE.MathUtils.clamp(scale, 0, 1.0);
  }

  let cx = lookX + rayX * scale;
  let cy = lookY + rayY * scale;
  let cz = lookZ + rayZ * scale;

  if (clamp) {
    cx = THREE.MathUtils.clamp(cx, clamp.minX, clamp.maxX);
    cz = THREE.MathUtils.clamp(cz, clamp.minZ, clamp.maxZ);
    if (clamp.maxY !== undefined) {
      cy = Math.min(cy, clamp.maxY);
    }
  }

  return { cx, cy, cz, scale };
}

function resolveAdaptiveShot(
  shot: CinematicShot,
  aspect: number,
  viewportHeight: number,
  stage: GameStage,
  clamp: IndoorClampBounds | null
): {
  posX: number;
  posY: number;
  posZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
} {
  const baseFov = shot.fov ?? 48;
  const safeAspect = Math.max(0.36, aspect);
  const narrowRatio = safeAspect < 1.38 ? THREE.MathUtils.clamp(1.38 / safeAspect, 1.0, 3.2) : 1.0;
  const portraitFactor = THREE.MathUtils.clamp((1.08 - safeAspect) / 0.62, 0, 1);
  const compactLandscape = safeAspect >= 1.08 && viewportHeight < 460;

  const hasBottomCard = BOTTOM_CARD_STAGES.has(stage);
  const lookYOffset = hasBottomCard
    ? -0.22 * portraitFactor - (compactLandscape ? 0.08 : 0)
    : -0.07 * portraitFactor;

  const lookX = shot.lookAt[0];
  const lookY = shot.lookAt[1] + lookYOffset;
  const lookZ = shot.lookAt[2];

  const baseDirX = shot.position[0] - shot.lookAt[0];
  const baseDirY = shot.position[1] - shot.lookAt[1];
  const baseDirZ = shot.position[2] - shot.lookAt[2];

  // در صفحه‌های عمودی و باریک موبایل، دوربین هم در امتداد خط دید کمی عقب‌تر می‌ایستد و هم زاویه دید بازتر می‌شود
  const distScale = narrowRatio > 1.0 ? Math.pow(narrowRatio, 0.44) : 1.0;
  const vertScale = 1 + (distScale - 1) * 0.48;

  const desiredRayX = baseDirX * distScale;
  const desiredRayY = baseDirY * vertScale - lookYOffset * 0.35;
  const desiredRayZ = baseDirZ * distScale;

  const clamped = clampRayToRoom(
    lookX,
    lookY,
    lookZ,
    desiredRayX,
    desiredRayY,
    desiredRayZ,
    clamp
  );

  // اگر دیوار اتاق اجازه‌ی عقب‌تر رفتن کامل را نداد، بقیه‌ی عرض قاب با بازتر شدن ملایم FOV جبران می‌شود
  const clampCompensation =
    clamped.scale < 0.98 ? Math.pow(1 / Math.max(0.45, clamped.scale), 0.38) : 1.0;

  const effectiveFov = THREE.MathUtils.clamp(
    baseFov * Math.pow(narrowRatio, 0.36) * clampCompensation,
    baseFov,
    72
  );

  return {
    posX: clamped.cx,
    posY: clamped.cy,
    posZ: clamped.cz,
    lookX,
    lookY,
    lookZ,
    fov: effectiveFov,
  };
}

export const CameraRig: React.FC<CameraRigProps> = ({
  followDistance = 3.5,
  followHeight = 1.48,
  indoorClamp = null,
}) => {
  const { camera, size } = useThree();
  const stage = useGameStore((s) => s.stage);
  const cinematicShot = useGameStore((s) => s.cinematicShot);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const isPaused = useGameStore((s) => s.isPaused);

  // نگه‌داری محدوده اتاق در ref تا رندرهای ۶۰ فریم‌برثانیه باعث ریست شدن انیمیشن GSAP دوربین نشوند
  const indoorClampRef = useRef<IndoorClampBounds | null>(indoorClamp);
  indoorClampRef.current = indoorClamp;

  const aspect = size.width / Math.max(1, size.height);
  const aspectBucket = Math.round(aspect * 16);
  const compactHeightBucket = size.height < 460 ? 1 : 0;

  const animState = useRef({
    posX: 0,
    posY: 1.8,
    posZ: 4.2,
    lookX: 0,
    lookY: 1.35,
    lookZ: 0,
    fov: 50,
  });

  const currentPos = useRef(new THREE.Vector3(0, 1.8, 4.2));
  const currentLook = useRef(new THREE.Vector3(0, 1.35, 0));
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    tweenRef.current?.kill();

    if (cinematicShot) {
      const resolved = resolveAdaptiveShot(
        cinematicShot,
        size.width / Math.max(1, size.height),
        size.height,
        stage,
        indoorClampRef.current
      );

      animState.current.posX = currentPos.current.x;
      animState.current.posY = currentPos.current.y;
      animState.current.posZ = currentPos.current.z;
      animState.current.lookX = currentLook.current.x;
      animState.current.lookY = currentLook.current.y;
      animState.current.lookZ = currentLook.current.z;
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        animState.current.fov = (camera as THREE.PerspectiveCamera).fov;
      }

      const dur = reducedMotion
        ? Math.min(0.45, cinematicShot.duration ?? 1.4)
        : (cinematicShot.duration ?? 1.5);

      tweenRef.current = gsap.to(animState.current, {
        posX: resolved.posX,
        posY: resolved.posY,
        posZ: resolved.posZ,
        lookX: resolved.lookX,
        lookY: resolved.lookY,
        lookZ: resolved.lookZ,
        fov: resolved.fov,
        duration: dur,
        ease: cinematicShot.ease ?? 'power2.inOut',
      });
    }

    return () => {
      tweenRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematicShot, camera, reducedMotion, stage, aspectBucket, compactHeightBucket]);

  useFrame((state, delta) => {
    if (isPaused) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const clamp = indoorClampRef.current;

    if (cinematicShot) {
      const swayAmp = reducedMotion ? 0 : 0.014;
      const sx = Math.sin(t * 0.55) * swayAmp;
      const sy = Math.cos(t * 0.42) * swayAmp * 0.7;

      let cx = animState.current.posX + sx;
      let cy = animState.current.posY + sy;
      let cz = animState.current.posZ;

      if (clamp) {
        cx = THREE.MathUtils.clamp(cx, clamp.minX, clamp.maxX);
        cz = THREE.MathUtils.clamp(cz, clamp.minZ, clamp.maxZ);
        if (clamp.maxY !== undefined) {
          cy = Math.min(cy, clamp.maxY);
        }
      }

      currentPos.current.set(cx, cy, cz);
      currentLook.current.set(
        animState.current.lookX,
        animState.current.lookY,
        animState.current.lookZ
      );

      camera.position.copy(currentPos.current);
      camera.lookAt(currentLook.current);

      const persp = camera as THREE.PerspectiveCamera;
      if (persp.isPerspectiveCamera && Math.abs(persp.fov - animState.current.fov) > 0.05) {
        persp.fov = animState.current.fov;
        persp.updateProjectionMatrix();
      }
      return;
    }

    // دوربین تعقیب سوم‌شخص با تطبیق خودکار فاصله و زاویه دید برای موبایل عمودی و افقی
    const liveAspect = state.size.width / Math.max(1, state.size.height);
    const narrowRatio =
      liveAspect < 1.38 ? THREE.MathUtils.clamp(1.38 / Math.max(0.36, liveAspect), 1.0, 3.2) : 1.0;
    const portraitFactor = THREE.MathUtils.clamp((1.08 - liveAspect) / 0.62, 0, 1);

    const yaw = transientInput.cameraYaw;
    const pitch = THREE.MathUtils.clamp(transientInput.cameraPitch, 0.04, 0.68);
    const p = transientInput.playerPosition;

    const lookX = p.x;
    const lookY = p.y + 1.28 - 0.16 * portraitFactor;
    const lookZ = p.z;

    const adaptiveDist = followDistance * (narrowRatio > 1.0 ? Math.pow(narrowRatio, 0.34) : 1.0);
    const horizDist = adaptiveDist * Math.cos(pitch);
    const vertOffset = (followHeight - 1.28) + adaptiveDist * Math.sin(pitch);

    const rayX = Math.sin(yaw) * horizDist;
    const rayY = vertOffset;
    const rayZ = Math.cos(yaw) * horizDist;

    const clamped = clampRayToRoom(lookX, lookY, lookZ, rayX, rayY, rayZ, clamp);

    desiredPos.current.set(clamped.cx, clamped.cy, clamped.cz);
    desiredLook.current.set(lookX, lookY, lookZ);

    const posAlpha = 1 - Math.exp(-9.5 * dt);
    const lookAlpha = 1 - Math.exp(-12 * dt);
    currentPos.current.lerp(desiredPos.current, posAlpha);
    // A scene transition can leave the previous camera outside the new room.
    if (clamp) {
      currentPos.current.x = THREE.MathUtils.clamp(currentPos.current.x, clamp.minX, clamp.maxX);
      currentPos.current.z = THREE.MathUtils.clamp(currentPos.current.z, clamp.minZ, clamp.maxZ);
      if (clamp.maxY !== undefined) currentPos.current.y = Math.min(currentPos.current.y, clamp.maxY);
    }
    currentLook.current.lerp(desiredLook.current, lookAlpha);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current);

    const clampFovBoost =
      clamped.scale < 0.92 ? Math.pow(1 / Math.max(0.42, clamped.scale), 0.28) : 1.0;
    const targetGameplayFov = THREE.MathUtils.clamp(
      52 * (narrowRatio > 1.0 ? Math.pow(narrowRatio, 0.28) : 1.0) * clampFovBoost,
      52,
      68
    );

    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera && Math.abs(persp.fov - targetGameplayFov) > 0.08) {
      persp.fov = THREE.MathUtils.lerp(persp.fov, targetGameplayFov, posAlpha);
      persp.updateProjectionMatrix();
    }
  });

  return null;
};
