import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useSurfaceTexture } from '../graphics/useSurfaceTexture';
import { useGameStore } from '../state/gameStore';
import { PottedShrub } from './Vegetation';

/** Lightweight, local procedural paving texture; no network assets. */
function usePavingTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#a8a299'; ctx.fillRect(0, 0, 256, 256);
    // Deterministic mottling avoids a different surface on every render.
    let seed = 143;
    for (let i = 0; i < 1800; i++) {
      seed = (seed * 16807) % 2147483647; const x = seed % 256;
      seed = (seed * 16807) % 2147483647; const y = seed % 256;
      ctx.fillStyle = i % 2 ? 'rgba(58,52,48,0.08)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = 'rgba(60,55,50,0.38)'; ctx.lineWidth = 2;
    for (let y = 0; y <= 256; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
      for (let x = (y / 64 % 2) * 64; x <= 256; x += 128) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
      }
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.repeat.set(5, 5);
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** A local canvas keeps Persian signs readable without a remote font service. */
function useNoticeTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#eee9da'; ctx.fillRect(0, 0, 512, 128);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#35444a'; ctx.font = 'bold 48px Vazirmatn, sans-serif';
    ctx.fillText('اشیای پیدا شده', 256, 64);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

export const CampusArrival: React.FC<{ showCard: boolean }> = ({ showCard }) => {
  const paving = usePavingTexture();
  const notice = useNoticeTexture();
  const leaves = useSurfaceTexture('foliage', 1, 1);
  const plaster = useSurfaceTexture('plaster', 3, 2);
  const lowDetail = useGameStore(s => s.graphicsProfile === 'LOW');
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial map={paving} roughness={0.95} /></mesh>
    {/* A low library wall and a sheltered noticeboard give the courtyard a readable edge. */}
    {[-4, 4].map(x => <mesh key={x} position={[x, 1.7, -6.8]}><boxGeometry args={[6, 3.4, .3]} /><meshStandardMaterial color="#d4cabc" map={plaster} roughness={0.9} /></mesh>)}
    <mesh position={[0, 3.05, -6.8]}><boxGeometry args={[2, .7, .3]} /><meshStandardMaterial color="#d4cabc" map={plaster} roughness={.9} /></mesh>
    {/* The exit is an actual doorway rather than a marker in a solid wall. */}
    {[-.95,.95].map(x => <mesh key={x} position={[x,1.35,-6.65]}><boxGeometry args={[.12,2.7,.2]} /><meshStandardMaterial color="#596a70" metalness={.45} roughness={.6}/></mesh>)}
    <mesh position={[0,2.65,-6.65]}><boxGeometry args={[2,.12,.2]} /><meshStandardMaterial color="#596a70" metalness={.45} roughness={.6}/></mesh>
    <mesh position={[0,1.3,-6.83]}><planeGeometry args={[1.8,2.5]}/><meshBasicMaterial color="#c4d5dd" /></mesh>
    <mesh position={[-3, 1.65, -6.6]}><boxGeometry args={[2.5, 1.5, .12]} /><meshStandardMaterial color="#465e69" roughness={0.4} /></mesh>
    <mesh position={[3, 1.65, -6.6]}><boxGeometry args={[2.5, 1.5, .12]} /><meshStandardMaterial color="#465e69" roughness={0.4} /></mesh>
    <group position={[-3, 0, -3]}>
      <mesh position={[0, 1.45, 0]}><boxGeometry args={[1.8, 1.1, .12]} /><meshStandardMaterial color="#675745" /></mesh>
      <mesh position={[0, 2.07, .075]}><planeGeometry args={[1.6, .34]} /><meshStandardMaterial map={notice} roughness={.9} /></mesh>
      {[-.45, 0, .45].map(x => <mesh key={x} position={[x, 1.45, .075]}><boxGeometry args={[.36, .7, .01]} /><meshStandardMaterial color="#eee9da" /></mesh>)}
      {[-.45, 0, .45].map(x => <mesh key={`pin-${x}`} position={[x,1.75,.09]}><sphereGeometry args={[.025,8,6]}/><meshStandardMaterial color="#9a4942" /></mesh>)}
      {showCard && <group position={[.45, 1.36, .09]}><mesh><boxGeometry args={[.2,.13,.018]} /><meshStandardMaterial color="#91b6c9" /></mesh><mesh position={[-.06,0,.011]}><boxGeometry args={[.045,.07,.003]}/><meshStandardMaterial color="#e5dbca" /></mesh><mesh position={[.03,.018,.011]}><boxGeometry args={[.08,.008,.003]}/><meshStandardMaterial color="#526b78" /></mesh></group>}
      {[-.7,.7].map(x => <mesh key={x} position={[x,.65,0]}><boxGeometry args={[.09,1.3,.09]} /><meshStandardMaterial color="#4c5353" metalness={.6} roughness={.5}/></mesh>)}
    </group>
    <group position={[2.7, 0, -1.8]}>
      <mesh position={[0,.48,0]}><boxGeometry args={[2,.12,.62]} /><meshStandardMaterial color="#8a6c50" roughness={.9}/></mesh>
      <mesh position={[0,.88,-.26]}><boxGeometry args={[2,.65,.12]} /><meshStandardMaterial color="#8a6c50" roughness={.9}/></mesh>
      {[-.8,.8].map(x => <mesh key={x} position={[x,.24,0]}><boxGeometry args={[.09,.48,.48]} /><meshStandardMaterial color="#4a5254" metalness={.5}/></mesh>)}
      {/* Bag rests on the bench, with a flap and handle rather than a floating sheet. */}
      <group position={[0,.59,0]}>
        <mesh><boxGeometry args={[.5,.16,.32]}/><meshStandardMaterial color="#485e72" roughness={.85}/></mesh>
        <mesh position={[0,.09,0]}><boxGeometry args={[.43,.02,.3]}/><meshStandardMaterial color="#354959" roughness={.85}/></mesh>
        <mesh position={[0,.13,-.01]} rotation={[Math.PI / 2,0,0]}><torusGeometry args={[.1,.015,6,16,Math.PI]}/><meshStandardMaterial color="#354959" /></mesh>
        <mesh position={[0,.09,.12]}><boxGeometry args={[.06,.025,.05]}/><meshStandardMaterial color="#a9aaa1" metalness={.5}/></mesh>
      </group>
    </group>
    {/* Small campus fixtures sit on the ground, away from the player's route. */}
    <group position={[-4.8,0,-4.9]}>
      <mesh position={[0,.42,0]}><cylinderGeometry args={[.25,.21,.84,12]}/><meshStandardMaterial color="#65716d" metalness={.4} roughness={.7}/></mesh>
      <mesh position={[0,.86,0]}><cylinderGeometry args={[.27,.27,.05,12]}/><meshStandardMaterial color="#3e4745" metalness={.4}/></mesh>
    </group>
    <group position={[4.7,0,-4.6]} rotation={[0,-.2,0]}>
      {[0,1.1].map(x => <mesh key={x} position={[x,.36,0]}><torusGeometry args={[.34,.025,8,24]}/><meshStandardMaterial color="#343b3d" roughness={.7}/></mesh>)}
      <mesh position={[.55,.54,0]} rotation={[0,0,-.4]}><boxGeometry args={[.78,.045,.045]}/><meshStandardMaterial color="#6d7777" metalness={.6}/></mesh>
      <mesh position={[.3,.62,0]} rotation={[0,0,.55]}><boxGeometry args={[.045,.7,.045]}/><meshStandardMaterial color="#6d7777" metalness={.6}/></mesh>
      <mesh position={[.86,.7,0]} rotation={[0,0,-.35]}><boxGeometry args={[.045,.72,.045]}/><meshStandardMaterial color="#6d7777" metalness={.6}/></mesh>
      <mesh position={[.22,.95,0]}><boxGeometry args={[.3,.05,.1]}/><meshStandardMaterial color="#303639" /></mesh>
      <mesh position={[.98,1.03,0]}><boxGeometry args={[.25,.04,.06]}/><meshStandardMaterial color="#303639" /></mesh>
    </group>
    {[[-5,2],[5,-4],[5,4]].map(([x,z],i) => <PottedShrub key={i} position={[x,0,z]} leafTexture={leaves} lowDetail={lowDetail} variation={i} />)}
  </group>;
};
