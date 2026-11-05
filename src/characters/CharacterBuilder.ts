import * as THREE from 'three';

/**
 * Named bone/node dictionary extracted from a loaded GLB character or fallback rig,
 * including full 3D Facial Emotion nodes and 3D Eyeglasses attached to Head.
 */
export interface CharacterRigNodes {
  root: THREE.Object3D;
  hips?: THREE.Object3D;
  spine?: THREE.Object3D;
  chest?: THREE.Object3D;
  neck?: THREE.Object3D;
  head?: THREE.Object3D;
  glasses?: THREE.Object3D;
  eyeL?: THREE.Object3D;
  eyeR?: THREE.Object3D;
  eyelidMeshL?: THREE.Object3D;
  eyelidMeshR?: THREE.Object3D;
  lowerLidL?: THREE.Object3D;
  lowerLidR?: THREE.Object3D;
  browL?: THREE.Object3D;
  browR?: THREE.Object3D;
  cheekL?: THREE.Object3D;
  cheekR?: THREE.Object3D;
  mouth?: THREE.Object3D;
  mouthNeutral?: THREE.Object3D;
  mouthSmile?: THREE.Object3D;
  mouthShy?: THREE.Object3D;
  mouthOpen?: THREE.Object3D;
  hairDynamic?: THREE.Object3D;
  shoulderL?: THREE.Object3D;
  armL?: THREE.Object3D;
  foreArmL?: THREE.Object3D;
  handL?: THREE.Object3D;
  shoulderR?: THREE.Object3D;
  armR?: THREE.Object3D;
  foreArmR?: THREE.Object3D;
  handR?: THREE.Object3D;
  heldPen?: THREE.Object3D;
  upLegL?: THREE.Object3D;
  legL?: THREE.Object3D;
  footL?: THREE.Object3D;
  upLegR?: THREE.Object3D;
  legR?: THREE.Object3D;
  footR?: THREE.Object3D;
  skirt?: THREE.Object3D;
}

export function instantiateCharacterRig(
  template: THREE.Object3D,
  options: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    tintSweater?: string;
    showPen?: boolean;
    hideGlasses?: boolean;
  } = {}
): CharacterRigNodes {
  const root = template.clone(true);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const isLens = mesh.name.startsWith('GlassesLens');
      mesh.castShadow = Boolean(options.castShadow) && !isLens;
      mesh.receiveShadow = Boolean(options.receiveShadow) && !isLens;

      if (options.tintSweater && (mesh.parent?.name === 'Chest' || mesh.parent?.name?.startsWith('Arm'))) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.color.set(options.tintSweater);
        mesh.material = mat;
      }
    }
  });

  const find = (name: string) => root.getObjectByName(name);

  const nodes: CharacterRigNodes = {
    root,
    hips: find('Hips'),
    spine: find('Spine'),
    chest: find('Chest'),
    neck: find('Neck'),
    head: find('Head'),
    glasses: find('Glasses3D'),
    eyeL: find('EyeL'),
    eyeR: find('EyeR'),
    eyelidMeshL: find('EyelidMeshL'),
    eyelidMeshR: find('EyelidMeshR'),
    lowerLidL: find('LowerLidL'),
    lowerLidR: find('LowerLidR'),
    browL: find('BrowL'),
    browR: find('BrowR'),
    cheekL: find('CheekL'),
    cheekR: find('CheekR'),
    mouth: find('Mouth'),
    mouthNeutral: find('MouthNeutral'),
    mouthSmile: find('MouthSmile'),
    mouthShy: find('MouthShy'),
    mouthOpen: find('MouthOpen'),
    hairDynamic: find('HairDynamic'),
    shoulderL: find('ShoulderL'),
    armL: find('ArmL'),
    foreArmL: find('ForeArmL'),
    handL: find('HandL'),
    shoulderR: find('ShoulderR'),
    armR: find('ArmR'),
    foreArmR: find('ForeArmR'),
    handR: find('HandR'),
    heldPen: find('HeldPen'),
    upLegL: find('UpLegL'),
    legL: find('LegL'),
    footL: find('FootL'),
    upLegR: find('UpLegR'),
    legR: find('LegR'),
    footR: find('FootR'),
    skirt: find('Skirt'),
  };

  if (nodes.heldPen) {
    nodes.heldPen.visible = Boolean(options.showPen);
  }

  // عینک فقط برای یک نفر میماند؛ مدل GLB پسر بدون عینک دیده میشود.
  if (nodes.glasses && options.hideGlasses) {
    nodes.glasses.visible = false;
  }

  return nodes;
}

export function buildFallbackCharacterTemplate(kind: 'female' | 'male' | 'student'): THREE.Group {
  const root = new THREE.Group();
  const isStudent = kind === 'student';
  const isFemale = kind === 'female';

  const skin = new THREE.MeshStandardMaterial({
    color: isStudent ? '#d8cfc8' : isFemale ? '#e8c7b2' : '#e2bda8',
    roughness: 0.6,
  });
  const outfit = new THREE.MeshStandardMaterial({
    color: isStudent ? '#7c828a' : isFemale ? '#8b8e93' : '#3c4a57',
    roughness: 0.65,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: isStudent ? '#4a5058' : isFemale ? '#343941' : '#2d3238',
    roughness: 0.74,
  });

  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.y = 0.9;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = 'Spine';
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.y = 0.16;
  spine.add(chest);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.25, 6, 12), outfit);
  torso.position.y = 0.12;
  chest.add(torso);

  // بند کیف و کیف کوچک؛ بهجای ژستهای نمایشی، یک جزئیات روزمره
  const strapMat = new THREE.MeshStandardMaterial({
    color: isFemale ? '#4a3f35' : isStudent ? '#3f444a' : '#2e363f',
    roughness: 0.86,
  });
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.02), strapMat);
  strap.position.set(0.07, 0.12, 0.13);
  strap.rotation.z = -0.34;
  chest.add(strap);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), strapMat);
  bag.position.set(-0.16, -0.05, 0.08);
  hips.add(bag);

  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.y = 0.28;
  chest.add(neck);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.y = 0.08;
  neck.add(head);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 14), skin);
  headMesh.position.y = 0.11;
  head.add(headMesh);

  const hairFallbackMat = new THREE.MeshStandardMaterial({
    color: isStudent ? '#454a50' : '#2b2521',
    roughness: 0.55,
  });
  const fallbackHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.126, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairFallbackMat
  );
  fallbackHair.position.set(0, 0.118, -0.008);
  fallbackHair.rotation.x = -0.45;
  head.add(fallbackHair);

  if (!isStudent && isFemale) {
    const glasses = new THREE.Group();
    glasses.name = 'Glasses3D';
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#6b5a4a',
      metalness: 0.65,
      roughness: 0.28,
    });
    [-1, 1].forEach((s) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0035, 8, 20), frameMat);
      rim.position.set(s * 0.044, 0.12, 0.125);
      glasses.add(rim);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.11), frameMat);
      temple.position.set(s * 0.08, 0.12, 0.06);
      glasses.add(temple);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), frameMat);
    bridge.position.set(0, 0.124, 0.126);
    glasses.add(bridge);
    head.add(glasses);
  }

  [-1, 1].forEach((s) => {
    const label = s < 0 ? 'L' : 'R';
    const arm = new THREE.Group();
    arm.name = `Arm${label}`;
    arm.position.set(s * 0.16, 0.24, 0);
    const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.34, 4, 8), outfit);
    armMesh.position.y = -0.18;
    arm.add(armMesh);
    chest.add(arm);

    const upLeg = new THREE.Group();
    upLeg.name = `UpLeg${label}`;
    upLeg.position.set(s * 0.08, -0.04, 0);
    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.32, 4, 8), dark);
    legMesh.position.y = -0.2;
    upLeg.add(legMesh);

    const leg = new THREE.Group();
    leg.name = `Leg${label}`;
    leg.position.y = -0.4;
    const shinMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.32, 4, 8), dark);
    shinMesh.position.y = -0.2;
    leg.add(shinMesh);
    upLeg.add(leg);
    hips.add(upLeg);
  });

  return root;
}
