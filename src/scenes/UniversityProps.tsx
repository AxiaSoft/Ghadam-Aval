import React from 'react';
import * as THREE from 'three';

/**
 * قطعات کوچک و کمخرج برای دانشگاه. بهجای باغ و تپه و طاق رنگی،
 * همان راهرو، پرینتر، نیمکت، تخته و لابی را با جزئیات قابل دیدن میسازد.
 */

type CorridorTone = 'floor' | 'wall' | 'door' | 'board' | 'metal' | 'wood' | 'paper' | 'light';

const TONE_HEX: Record<CorridorTone, [string, string]> = {
  floor: ['#4b505a', '#d7d0c3'],
  wall: ['#3c424e', '#ece3d5'],
  door: ['#414751', '#9b6f4f'],
  board: ['#3f4652', '#3f5a4b'],
  metal: ['#565d68', '#b9bec4'],
  wood: ['#4a4038', '#a67b55'],
  paper: ['#8b8f96', '#f7f2e7'],
  light: ['#6d7684', '#fff3d2'],
};

const TONE_COLORS = Object.fromEntries(
  Object.entries(TONE_HEX).map(([key, pair]) => [
    key,
    [new THREE.Color(pair[0]), new THREE.Color(pair[1])],
  ])
) as unknown as Record<CorridorTone, [THREE.Color, THREE.Color]>;

function toneColor(tone: CorridorTone, warmth = 1): string {
  const [cold, warm] = TONE_COLORS[tone];
  return cold.clone().lerp(warm, warmth).getStyle();
}

/** فقط برای صحنهٔ تبدیل سرد به گرم؛ رنگ مصالح راهرو را نرم عوض میکند. */
export function applyCorridorWarmth(root: THREE.Object3D | null, warmth: number): void {
  if (!root) return;
  const w = THREE.MathUtils.clamp(warmth, 0, 1);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const tone = mesh.userData.corridorTone as CorridorTone | undefined;
    if (!tone) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (!material?.color) return;
    const [cold, warm] = TONE_COLORS[tone];
    material.color.copy(cold).lerp(warm, w);
    if (tone === 'light' && material.emissive) {
      material.emissive.copy(warm).multiplyScalar(0.25 + w * 0.45);
    }
  });
}

interface WarmthProps {
  initialWarmth?: number;
}

function toneMeshProps(tone: CorridorTone, warmth = 1) {
  return {
    userData: { corridorTone: tone },
    color: toneColor(tone, warmth),
  };
}

export const CorridorShell: React.FC<WarmthProps> = ({ initialWarmth = 1 }) => {
  const w = initialWarmth;
  const doors = ['۲۰۱', '۲۰۲', '۲۰۳', '۲۰۴', '۲۰۵', '۲۰۶'];

  return (
    <group>
      {/* کف کاشی و بندکشهای باریک */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ corridorTone: 'floor' }}>
        <planeGeometry args={[7.2, 20]} />
        <meshStandardMaterial color={toneColor('floor', w)} roughness={0.88} />
      </mesh>
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={`grout-${x}`} position={[x, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.018, 20]} />
          <meshStandardMaterial color={toneColor('metal', w)} roughness={0.95} />
        </mesh>
      ))}

      {/* دیوارها، سقف و قرنیز */}
      <mesh position={[-3.5, 1.75, -2]} userData={{ corridorTone: 'wall' }}>
        <boxGeometry args={[0.2, 3.5, 16]} />
        <meshStandardMaterial color={toneColor('wall', w)} roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 1.75, -2]} userData={{ corridorTone: 'wall' }}>
        <boxGeometry args={[0.2, 3.5, 16]} />
        <meshStandardMaterial color={toneColor('wall', w)} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.75, -10]} userData={{ corridorTone: 'wall' }}>
        <boxGeometry args={[7.2, 3.5, 0.2]} />
        <meshStandardMaterial color={toneColor('wall', w)} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.52, -2]} rotation={[Math.PI / 2, 0, 0]} userData={{ corridorTone: 'wall' }}>
        <planeGeometry args={[7.2, 16]} />
        <meshStandardMaterial color={toneColor('wall', w)} roughness={0.92} />
      </mesh>
      {[-3.38, 3.38].map((x) => (
        <mesh key={`skirt-${x}`} position={[x, 0.1, -2]} userData={{ corridorTone: 'metal' }}>
          <boxGeometry args={[0.06, 0.2, 16]} />
          <meshStandardMaterial color={toneColor('metal', w)} roughness={0.8} />
        </mesh>
      ))}

      {/* درهای شمارهدار */}
      {doors.map((_, idx) => {
        const z = -1 - idx * 1.55;
        const side = idx % 2 === 0 ? -1 : 1;
        return (
          <group key={`door-${idx}`} position={[side * 3.36, 1.15, z]}>
            <mesh userData={{ corridorTone: 'door' }}>
              <boxGeometry args={[0.08, 2.2, 1.2]} />
              <meshStandardMaterial color={toneColor('door', w)} roughness={0.72} />
            </mesh>
            <mesh position={[side * -0.05, 0.25, 0.34]} userData={{ corridorTone: 'paper' }}>
              <boxGeometry args={[0.012, 0.3, 0.42]} />
              <meshStandardMaterial color={toneColor('paper', w)} roughness={0.85} />
            </mesh>
            <mesh position={[side * -0.07, -0.12, 0.48]} userData={{ corridorTone: 'metal' }}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshStandardMaterial color={toneColor('metal', w)} metalness={0.5} roughness={0.35} />
            </mesh>
          </group>
        );
      })}

      {/* تابلو اعلانات با سوزنها و برگهها */}
      <group position={[-3.34, 1.75, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh userData={{ corridorTone: 'board' }}>
          <boxGeometry args={[0.08, 1.5, 2.2]} />
          <meshStandardMaterial color={toneColor('board', w)} roughness={0.78} />
        </mesh>
        {[-0.65, -0.15, 0.4, 0.82].map((x, i) => (
          <mesh key={`pin-${i}`} position={[0.05, 0.38, x]} userData={{ corridorTone: 'paper' }}>
            <boxGeometry args={[0.012, 0.28, 0.36]} />
            <meshStandardMaterial color={toneColor('paper', w)} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0.07, -0.5, 0.72]} userData={{ corridorTone: 'metal' }}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={toneColor('metal', w)} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* رادیاتور قدیمی، کپسول و ردیف کمد */}
      <group position={[3.28, 0.72, 2.1]}>
        {[-0.32, -0.16, 0, 0.16, 0.32].map((x) => (
          <mesh key={`rad-${x}`} position={[x, 0, 0]} userData={{ corridorTone: 'metal' }}>
            <boxGeometry args={[0.1, 0.9, 0.16]} />
            <meshStandardMaterial color={toneColor('metal', w)} roughness={0.7} />
          </mesh>
        ))}
      </group>
      <mesh position={[3.18, 0.62, -0.4]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 12]} />
        <meshStandardMaterial color="#a5463d" roughness={0.6} />
      </mesh>
      <group position={[3.25, 1.1, -4.2]}>
        {[-0.55, 0, 0.55].map((z) => (
          <mesh key={`locker-${z}`} position={[0, 0, z]} userData={{ corridorTone: 'metal' }}>
            <boxGeometry args={[0.22, 1.8, 0.5]} />
            <meshStandardMaterial color={toneColor('metal', w)} roughness={0.72} />
          </mesh>
        ))}
      </group>

      {/* چراغهای سقفی مهتابی */}
      {[-5.5, -2.5, 0.5].map((z) => (
        <group key={`lamp-${z}`} position={[0, 3.42, z]}>
          <mesh userData={{ corridorTone: 'light' }}>
            <boxGeometry args={[1.5, 0.06, 0.22]} />
            <meshStandardMaterial
              color={toneColor('light', w)}
              emissive={toneColor('light', w)}
              emissiveIntensity={0.25 + w * 0.45}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface PositionedProps extends WarmthProps {
  position?: [number, number, number];
  rotationY?: number;
}

export const PrinterCorner: React.FC<PositionedProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  initialWarmth = 1,
}) => {
  const w = initialWarmth;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.38, 0]} userData={{ corridorTone: 'wood' }}>
        <boxGeometry args={[1.5, 0.76, 0.8]} />
        <meshStandardMaterial color={toneColor('wood', w)} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.82, -0.05]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[0.9, 0.28, 0.55]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0.18]} userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.72, 0.02, 0.42]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.9} />
      </mesh>
      {/* خط سفید آخر برگه */}
      <mesh position={[0, 0.995, 0.36]} userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.58, 0.008, 0.025]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      <mesh position={[0.38, 0.62, 0.42]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.8} />
      </mesh>
    </group>
  );
};

export const WindowBench: React.FC<PositionedProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  initialWarmth = 1,
}) => {
  const w = initialWarmth;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* قاب پنجره و شیشه */}
      <mesh position={[0, 1.9, -0.9]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[2.4, 1.7, 0.08]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.9, -0.84]}>
        <planeGeometry args={[2.16, 1.48]} />
        <meshBasicMaterial color="#cfe4f2" transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, 1.9, -0.82]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[0.06, 1.7, 0.1]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.9, -0.82]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[2.4, 0.06, 0.1]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.7} />
      </mesh>

      {/* نیمکت چوبی */}
      <mesh position={[0, 0.44, 0]} userData={{ corridorTone: 'wood' }}>
        <boxGeometry args={[2.1, 0.1, 0.55]} />
        <meshStandardMaterial color={toneColor('wood', w)} roughness={0.8} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={`leg-${x}`} position={[x, 0.22, 0]} userData={{ corridorTone: 'metal' }}>
          <boxGeometry args={[0.08, 0.44, 0.5]} />
          <meshStandardMaterial color={toneColor('metal', w)} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, -0.28]} rotation={[0.12, 0, 0]} userData={{ corridorTone: 'wood' }}>
        <boxGeometry args={[2.1, 0.42, 0.06]} />
        <meshStandardMaterial color={toneColor('wood', w)} roughness={0.8} />
      </mesh>

      {/* برگه، خودکار، لیوان، دستمال و کیف */}
      <mesh position={[-0.35, 0.5, 0.08]} rotation={[-Math.PI / 2, 0, 0.1]} userData={{ corridorTone: 'paper' }}>
        <planeGeometry args={[0.5, 0.36]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.92} />
      </mesh>
      <mesh position={[-0.35, 0.505, 0.2]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[0.4, 0.014]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.51, 0.12]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.014, 0.014, 0.28, 8]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.56, 0.06]} userData={{ corridorTone: 'paper' }}>
        <cylinderGeometry args={[0.09, 0.07, 0.18, 14]} />
        <meshStandardMaterial color="#e9d9bd" roughness={0.85} />
      </mesh>
      <mesh position={[0.85, 0.5, 0.1]} userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.22, 0.03, 0.16]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.95} />
      </mesh>
      <mesh position={[1.05, 0.56, -0.05]} userData={{ corridorTone: 'wood' }}>
        <boxGeometry args={[0.42, 0.22, 0.28]} />
        <meshStandardMaterial color="#5b5145" roughness={0.85} />
      </mesh>
      <mesh position={[1.05, 0.68, -0.05]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'wood' }}>
        <torusGeometry args={[0.11, 0.018, 8, 16]} />
        <meshStandardMaterial color="#3a3128" roughness={0.8} />
      </mesh>
    </group>
  );
};

export const PresentationBoard: React.FC<PositionedProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  initialWarmth = 1,
}) => {
  const w = initialWarmth;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[3.4, 1.5, 0.06]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.28} />
      </mesh>
      {[0.42, 0.08, -0.26, -0.6].map((y, idx) => (
        <mesh key={`line-${idx}`} position={[idx === 2 ? -0.25 : 0, y, 0.04]}>
          <boxGeometry args={[idx === 2 ? 2.5 : 2.9, 0.035, 0.01]} />
          <meshStandardMaterial color={idx === 2 ? '#b0574a' : '#4c6b8a'} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.68, 0.05]}>
        <boxGeometry args={[1.2, 0.045, 0.012]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.9} />
      </mesh>
      <mesh position={[-1.45, -0.95, 0.12]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 20]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.5} />
      </mesh>
      <mesh position={[1.45, -0.9, 0.12]} userData={{ corridorTone: 'paper' }}>
        <cylinderGeometry args={[0.1, 0.08, 0.2, 14]} />
        <meshStandardMaterial color="#e9d9bd" roughness={0.85} />
      </mesh>
      <mesh position={[1.2, -0.78, 0.18]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.5} />
      </mesh>
    </group>
  );
};

export const LobbyDetails: React.FC<PositionedProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  initialWarmth = 1,
}) => {
  const w = initialWarmth;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.7, 0.02, 0.5]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.012, 0.16]}>
        <boxGeometry args={[0.56, 0.006, 0.016]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.12, 0.05]} userData={{ corridorTone: 'paper' }}>
        <cylinderGeometry args={[0.1, 0.08, 0.22, 14]} />
        <meshStandardMaterial color="#e9d9bd" roughness={0.85} />
      </mesh>
      <mesh position={[-0.55, 0.08, 0.08]} userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.24, 0.04, 0.18]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.95} />
      </mesh>
      <mesh position={[-0.2, 0.02, -0.2]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.014, 0.014, 0.26, 8]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.8, -1.2]} rotation={[Math.PI / 2, 0, 0]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.8, -1.16]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[0.02, 0.22, 0.02]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 1.8, -1.16]} rotation={[0, 0, Math.PI / 2]} userData={{ corridorTone: 'metal' }}>
        <boxGeometry args={[0.02, 0.16, 0.02]} />
        <meshStandardMaterial color="#2f3a48" roughness={0.5} />
      </mesh>
    </group>
  );
};

export const CampusSign: React.FC<PositionedProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  initialWarmth = 1,
}) => {
  const w = initialWarmth;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.15, 0]} userData={{ corridorTone: 'metal' }}>
        <cylinderGeometry args={[0.035, 0.045, 2.3, 10]} />
        <meshStandardMaterial color={toneColor('metal', w)} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.25, 0]} userData={{ corridorTone: 'board' }}>
        <boxGeometry args={[1.5, 0.42, 0.08]} />
        <meshStandardMaterial color={toneColor('board', w)} roughness={0.78} />
      </mesh>
      <mesh position={[-0.38, 2.25, 0.05]} userData={{ corridorTone: 'paper' }}>
        <boxGeometry args={[0.6, 0.05, 0.01]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.9} />
      </mesh>
      <mesh position={[0.42, 2.25, 0.05]} userData={{ corridorTone: 'paper' }}>
        <coneGeometry args={[0.1, 0.2, 3]} />
        <meshStandardMaterial color={toneColor('paper', w)} roughness={0.9} />
      </mesh>
    </group>
  );
};

export function getToneMeshProps(tone: CorridorTone, warmth = 1) {
  return toneMeshProps(tone, warmth);
}
