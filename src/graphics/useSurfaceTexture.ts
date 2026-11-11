import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

type Surface = 'wood' | 'stone' | 'tiles';

/** Small deterministic, locally generated textures; no downloads or large image assets. */
export function useSurfaceTexture(surface: Surface, repeatX: number, repeatY: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#f3f3f3'; c.fillRect(0, 0, 256, 256);
    let seed = surface === 'wood' ? 873 : 1921;
    for (let i = 0; i < (surface === 'wood' ? 360 : 1600); i++) {
      seed = seed * 16807 % 2147483647; const x = seed % 256;
      seed = seed * 16807 % 2147483647; const y = seed % 256;
      c.fillStyle = i % 3 === 0 ? 'rgba(60,50,40,.07)' : 'rgba(255,255,255,.1)';
      c.fillRect(x, y, surface === 'wood' ? 1 : 2, surface === 'wood' ? 14 + i % 45 : 2);
    }
    c.strokeStyle = 'rgba(55,50,45,.28)'; c.lineWidth = surface === 'wood' ? 1 : 2;
    const spacing = surface === 'wood' ? 32 : 64;
    for (let y = 0; y < 256; y += spacing) {
      c.beginPath(); c.moveTo(0,y); c.lineTo(256,y); c.stroke();
      if (surface !== 'stone') for (let x = ((y / spacing) % 2) * 64; x < 256; x += 128) {
        c.beginPath(); c.moveTo(x,y); c.lineTo(x,y + spacing); c.stroke();
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    return t;
  }, [surface, repeatX, repeatY]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
