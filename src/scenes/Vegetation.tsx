import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { TREE_BRANCHES } from './treeBranches';

type PlantProps = {
  position: [number, number, number];
  leafTexture: THREE.Texture | null;
  barkTexture?: THREE.Texture | null;
  lowDetail?: boolean;
  variation?: number;
  flowers?: boolean;
};
const CROWN: [number, number, number, number, number, number][] = [
  [0, 2.7, 0, .68, .62, .66], [-.52, 2.45, .06, .57, .48, .53],
  [.54, 2.48, -.08, .6, .5, .52], [0, 2.35, .42, .52, .46, .5],
  [-.25, 2.94, -.28, .48, .54, .48], [.3, 2.84, .31, .47, .47, .46],
  [-.48, 2.7, -.39, .4, .42, .4], [.52, 2.78, .3, .4, .39, .43],
  [.02, 2.3, -.47, .48, .42, .42],
];
const SHRUB: [number, number, number, number, number, number][] = [
  [0,.68,0,.31,.4,.3], [-.25,.6,0,.28,.31,.28], [.23,.62,.04,.28,.34,.26],
  [0,.57,.22,.25,.27,.25], [-.13,.8,-.16,.22,.28,.23], [.15,.84,-.12,.2,.26,.21],
  [.07,.55,-.23,.25,.25,.24],
];
const leafShape = new THREE.Shape();
leafShape.moveTo(0, -.1);
leafShape.quadraticCurveTo(-.095, -.02, 0, .13);
leafShape.quadraticCurveTo(.095, -.02, 0, -.1);

/** Individual leaf silhouettes break up the smooth crown without a texture download. */
function LeafDetails({ shapes, lowDetail, variation }: { shapes: typeof CROWN; lowDetail?: boolean; variation: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = lowDetail ? 20 : shapes === SHRUB ? 48 : 96;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const forward = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < count; i++) {
      const [x, y, z, sx, sy, sz] = shapes[i % shapes.length];
      const angle = i * 2.399 + variation * .3;
      const h = ((i * 37) % 83) / 41 - 1;
      const ring = Math.sqrt(Math.max(0, 1 - h * h));
      const dir = new THREE.Vector3(Math.cos(angle) * ring, h, Math.sin(angle) * ring);
      dummy.position.set(x + dir.x * sx * .94, y + dir.y * sy * .94, z + dir.z * sz * .94);
      dummy.quaternion.setFromUnitVectors(forward, dir.normalize());
      const size = (shapes === SHRUB ? .65 : 1) * (.7 + (i % 4) * .12);
      dummy.scale.setScalar(size); dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      ref.current.setColorAt(i, new THREE.Color(['#698e5c', '#567a50', '#77975f', '#496c4d'][(i + variation) % 4]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [shapes, count, variation]);
  return <instancedMesh ref={ref} args={[undefined, undefined, count]}>
    <shapeGeometry args={[leafShape]} />
    <meshStandardMaterial color="#ffffff" roughness={1} side={THREE.DoubleSide} />
  </instancedMesh>;
}

function Foliage({ shapes, texture, lowDetail, variation = 0 }: {
  shapes: typeof CROWN; texture: THREE.Texture | null; lowDetail?: boolean; variation?: number;
}) {
  const instances = useRef<THREE.InstancedMesh>(null);
  const count = lowDetail ? Math.min(4, shapes.length) : shapes.length;
  useLayoutEffect(() => {
    if (!instances.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const [x,y,z,sx,sy,sz] = shapes[i];
      dummy.position.set(x,y,z); dummy.scale.set(sx,sy,sz);
      dummy.rotation.set(i * .31, i * 1.1 + variation, i * .17);
      dummy.updateMatrix(); instances.current.setMatrixAt(i, dummy.matrix);
      instances.current.setColorAt(i, new THREE.Color(['#527653','#64845a','#405f49','#6d8a5e'][(i + variation) % 4]));
    }
    instances.current.instanceMatrix.needsUpdate = true;
    if (instances.current.instanceColor) instances.current.instanceColor.needsUpdate = true;
    instances.current.computeBoundingSphere();
  }, [shapes, count, variation]);
  return <>
    <instancedMesh ref={instances} args={[undefined, undefined, count]} castShadow={!lowDetail}>
      <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial map={texture} color="#ffffff" roughness={1} />
    </instancedMesh>
    <LeafDetails shapes={shapes} lowDetail={lowDetail} variation={variation} />
  </>;
}

export const CampusTree: React.FC<PlantProps> = ({ position, leafTexture, barkTexture, lowDetail, variation = 0, flowers = false }) => (
  <group position={position} rotation={[0, variation * .37, 0]}>
    <mesh position={[0,1.03,0]} castShadow={!lowDetail}><cylinderGeometry args={[.105,.18,2.06,10]} /><meshStandardMaterial map={barkTexture} color="#795d49" roughness={1} /></mesh>
    {TREE_BRANCHES.map(({ start, end }, i) => {
      const base = new THREE.Vector3(...start);
      const tip = new THREE.Vector3(...end);
      const direction = tip.clone().sub(base);
      const midpoint = base.clone().add(tip).multiplyScalar(.5);
      const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      return <mesh key={i} position={midpoint} quaternion={orientation} castShadow={!lowDetail}>
        <cylinderGeometry args={[.035,.085,direction.length(),7]} />
        <meshStandardMaterial map={barkTexture} color="#735842" roughness={1} />
      </mesh>;
    })}
    <Foliage shapes={CROWN} texture={leafTexture} lowDetail={lowDetail} variation={variation} />
    {flowers && [[.42,.3],[-.35,.4],[.24,-.45]].map(([x,z],i) => <group key={i} position={[x,0,z]}>
      <mesh position={[0,.11,0]}><cylinderGeometry args={[.008,.008,.22,5]} /><meshStandardMaterial color="#58734f" /></mesh>
      {[0,1,2,3].map(n => <mesh key={n} position={[Math.cos(n*Math.PI/2)*.035,.22,Math.sin(n*Math.PI/2)*.035]} rotation={[-Math.PI/2,0,n*Math.PI/2]}><circleGeometry args={[.033,7]} /><meshStandardMaterial color="#d4a4a0" side={THREE.DoubleSide} /></mesh>)}
    </group>)}
  </group>
);

export const PottedShrub: React.FC<PlantProps> = ({ position, leafTexture, lowDetail, variation = 0 }) => (
  <group position={position}>
    <mesh position={[0,.24,0]}><cylinderGeometry args={[.28,.2,.48,12]} /><meshStandardMaterial color="#9b7863" roughness={.95}/></mesh>
    <mesh position={[0,.49,0]}><cylinderGeometry args={[.29,.29,.05,12]} /><meshStandardMaterial color="#82614e" roughness={1}/></mesh>
    <Foliage shapes={SHRUB} texture={leafTexture} lowDetail={lowDetail} variation={variation} />
  </group>
);
