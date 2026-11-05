import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onload = null;
      this.onerror = null;
    }
    async readAsArrayBuffer(blob) {
      try {
        this.result = await blob.arrayBuffer();
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      } catch (err) {
        if (this.onerror) this.onerror(err);
      }
    }
    async readAsDataURL(blob) {
      try {
        const buf = Buffer.from(await blob.arrayBuffer());
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      } catch (err) {
        if (this.onerror) this.onerror(err);
      }
    }
  };
}

const OUT_DIR = path.resolve('/home/user/public/models');
fs.mkdirSync(OUT_DIR, { recursive: true });

function stdMat(color, roughness = 0.58, metalness = 0.04, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    ...extra,
  });
}

/**
 * Sculpted stylized indie-game human head with soft cheeks, gentle chin taper, and clean forehead
 */
function createSculptedHeadGeometry(radius = 0.125, jawTaper = 0.84) {
  const geo = new THREE.SphereGeometry(radius, 30, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    y *= 1.13;
    x *= 0.93;
    if (z > 0) {
      z *= 0.89;
    }

    if (y < 0) {
      const t = Math.min(1, -y / (radius * 1.13));
      const cheekSoftness = Math.sin(t * Math.PI) * 0.03;
      const xScale = 1 - t * (1 - jawTaper * 0.68) + cheekSoftness;
      x *= xScale;
      if (z > 0) {
        z *= 1 - t * 0.11;
      } else {
        z *= 1 - t * 0.28;
      }
    } else {
      const t = y / (radius * 1.13);
      z *= 1 - t * 0.04;
    }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds sleek, refined 3D Eyeglasses parented directly to the Head node.
 * Thin, elegant frames so expressive eyes, irises, and eyebrows shine right through!
 */
function build3DGlasses({
  style = 'round',
  frameColor = '#c8835f',
  metalAccent = '#f2cfa6',
  eyeSpacing = 0.044,
  eyeY = 0.122,
  glassesZ = 0.128,
}) {
  const glassesGroup = new THREE.Group();
  glassesGroup.name = 'Glasses3D';

  const frameMat = stdMat(frameColor, 0.24, 0.62);
  const accentMat = stdMat(metalAccent, 0.2, 0.82);
  const lensMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2f4ff'),
    emissive: new THREE.Color('#8ec8f2'),
    emissiveIntensity: 0.06,
    roughness: 0.06,
    metalness: 0.18,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });

  const rimRadius = style === 'round' ? 0.033 : 0.034;
  const tubeRadius = style === 'round' ? 0.0035 : 0.0038;

  [-1, 1].forEach((side) => {
    const sideLabel = side < 0 ? 'L' : 'R';
    const rimHolder = new THREE.Group();
    rimHolder.name = `GlassesRimGroup${sideLabel}`;
    rimHolder.position.set(side * eyeSpacing, eyeY, glassesZ);

    let rimGeo;
    if (style === 'round') {
      rimGeo = new THREE.TorusGeometry(rimRadius, tubeRadius, 12, 28);
      rimGeo.scale(1.06, 0.94, 1.0);
    } else {
      const shape = new THREE.Shape();
      const w = 0.035;
      const h = 0.025;
      const r = 0.008;
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.quadraticCurveTo(w, -h, w, -h + r);
      shape.lineTo(w, h - r);
      shape.quadraticCurveTo(w, h, w - r, h);
      shape.lineTo(-w + r, h);
      shape.quadraticCurveTo(-w, h, -w, h - r);
      shape.lineTo(-w, -h + r);
      shape.quadraticCurveTo(-w, -h, -w + r, -h);

      const hole = new THREE.Path();
      const iw = w - 0.0048;
      const ih = h - 0.0048;
      const ir = 0.0052;
      hole.moveTo(-iw + ir, -ih);
      hole.lineTo(iw - ir, -ih);
      hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
      hole.lineTo(iw, ih - ir);
      hole.quadraticCurveTo(iw, ih, iw - ir, ih);
      hole.lineTo(-iw + ir, ih);
      hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
      hole.lineTo(-iw, -ih + ir);
      hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
      shape.holes.push(hole);

      rimGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.0048,
        bevelEnabled: true,
        bevelThickness: 0.0012,
        bevelSize: 0.001,
        bevelSegments: 2,
      });
      rimGeo.translate(0, 0, -0.0024);
    }

    const rimMesh = new THREE.Mesh(rimGeo, frameMat);
    rimMesh.name = `GlassesRim${sideLabel}`;
    rimHolder.add(rimMesh);

    const lensGeo = new THREE.CylinderGeometry(rimRadius * 0.89, rimRadius * 0.89, 0.002, 20);
    lensGeo.rotateX(Math.PI / 2);
    if (style === 'round') {
      lensGeo.scale(1.04, 0.92, 1.0);
    } else {
      lensGeo.scale(1.0, 0.74, 1.0);
    }
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.name = `GlassesLens${sideLabel}`;
    rimHolder.add(lensMesh);

    const hingeGeo = new THREE.BoxGeometry(0.007, 0.005, 0.008);
    const hingeMesh = new THREE.Mesh(hingeGeo, accentMat);
    hingeMesh.position.set(side * (rimRadius + 0.003), 0.005, -0.002);
    rimHolder.add(hingeMesh);

    const padGeo = new THREE.SphereGeometry(0.0032, 8, 8);
    padGeo.scale(0.65, 1.25, 0.85);
    const padMesh = new THREE.Mesh(padGeo, accentMat);
    padMesh.position.set(-side * (rimRadius * 0.72), -0.008, -0.006);
    rimHolder.add(padMesh);

    const outerX = side * (eyeSpacing + rimRadius + 0.003);
    const earX = side * 0.115;
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(outerX, eyeY + 0.005, glassesZ - 0.002),
      new THREE.Vector3(earX * 0.98, eyeY + 0.006, 0.065),
      new THREE.Vector3(earX * 1.01, eyeY + 0.005, 0.0),
      new THREE.Vector3(earX * 0.99, eyeY - 0.008, -0.03),
      new THREE.Vector3(earX * 0.95, eyeY - 0.024, -0.042),
    ]);
    const templeGeo = new THREE.TubeGeometry(templeCurve, 14, 0.0032, 8, false);
    const templeMesh = new THREE.Mesh(templeGeo, frameMat);
    templeMesh.name = `GlassesTemple${sideLabel}`;
    glassesGroup.add(templeMesh);

    glassesGroup.add(rimHolder);
  });

  const bridgeSpan = eyeSpacing - rimRadius * 0.88;
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-bridgeSpan, eyeY + 0.005, glassesZ),
    new THREE.Vector3(0, eyeY + 0.012, glassesZ + 0.005),
    new THREE.Vector3(bridgeSpan, eyeY + 0.005, glassesZ),
  ]);
  const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 10, 0.0032, 8, false);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, accentMat);
  bridgeMesh.name = 'GlassesBridge';
  glassesGroup.add(bridgeMesh);

  return glassesGroup;
}

/**
 * Builds an expressive, high-craft stylized human character (Female or Male)
 * with hair 100% clear of the eyes/forehead and a full 3D Facial Emotion Rig!
 */
function buildMainCharacter(gender = 'female') {
  const isFemale = gender === 'female';
  const root = new THREE.Group();
  root.name = isFemale ? 'FemaleProtagonist' : 'MaleCreator';

  const skinMat = stdMat(isFemale ? '#f6d0bc' : '#eec3ae', 0.54, 0.02);
  const blushMat = stdMat(isFemale ? '#ee958e' : '#e4988b', 0.62, 0.0, {
    emissive: new THREE.Color(isFemale ? '#d85c58' : '#c45e54'),
    emissiveIntensity: 0.12,
  });
  const hairMat = stdMat(isFemale ? '#47281e' : '#251c17', 0.44, 0.08);
  const hairHighlightMat = stdMat(isFemale ? '#5c3528' : '#332721', 0.42, 0.1);
  // Male wears a tailored black button-up shirt (#1a1c21) & gray trousers (#7d838c)
  const topMat = stdMat(isFemale ? '#c45b50' : '#1a1c21', 0.62, 0.05);
  const innerTopMat = stdMat('#f8f3ea', 0.68, 0.02);
  const accentClothMat = stdMat(isFemale ? '#e8d8c3' : '#262a33', 0.56, 0.07);
  const bottomMat = stdMat(isFemale ? '#262f42' : '#7d838c', 0.72, 0.03);
  const legTightMat = stdMat(isFemale ? '#2e2936' : '#7d838c', 0.72, 0.03);
  const shoeMat = stdMat(isFemale ? '#4c3027' : '#22252b', 0.52, 0.06);
  const shoeSoleMat = stdMat(isFemale ? '#1f1e22' : '#e6e3dc', 0.82, 0.02);

  const scleraMat = stdMat('#ffffff', 0.18, 0.0);
  const irisOuterMat = stdMat(isFemale ? '#54331b' : '#2d1c11', 0.2, 0.05);
  const irisInnerMat = stdMat(isFemale ? '#9c6639' : '#593b25', 0.16, 0.08, {
    emissive: new THREE.Color(isFemale ? '#4a2b12' : '#26170c'),
    emissiveIntensity: 0.15,
  });
  const pupilMat = stdMat('#0c0c12', 0.1, 0.05);
  const catchlightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const lipMat = stdMat(isFemale ? '#d16b66' : '#bf7b71', 0.48, 0.02);
  const mouthInnerMat = stdMat('#9e3f42', 0.65, 0.0);

  const scaleH = isFemale ? 1.0 : 1.07;

  // HIPS
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.9 * scaleH, 0);
  root.add(hips);

  const pelvisGeo = new THREE.CylinderGeometry(
    isFemale ? 0.125 : 0.132,
    isFemale ? 0.138 : 0.128,
    0.16,
    18
  );
  pelvisGeo.scale(1.0, 1.0, 0.74);
  hips.add(new THREE.Mesh(pelvisGeo, bottomMat));

  if (isFemale) {
    const skirtGeo = new THREE.CylinderGeometry(0.126, 0.212, 0.29, 24, 1, false);
    skirtGeo.scale(1.0, 1.0, 0.82);
    const skirtMesh = new THREE.Mesh(skirtGeo, bottomMat);
    skirtMesh.name = 'Skirt';
    skirtMesh.position.set(0, -0.095, 0);
    hips.add(skirtMesh);

    // Subtle warm belt trim at waist
    const beltGeo = new THREE.CylinderGeometry(0.126, 0.128, 0.028, 20);
    beltGeo.scale(1.01, 1.0, 0.76);
    const belt = new THREE.Mesh(beltGeo, stdMat('#7c4c33', 0.55, 0.15));
    belt.position.set(0, 0.04, 0);
    hips.add(belt);
  } else {
    // Neat dark belt with subtle buckle between black shirt and gray trousers
    const beltGeo = new THREE.CylinderGeometry(0.134, 0.135, 0.03, 20);
    beltGeo.scale(1.01, 1.0, 0.75);
    const belt = new THREE.Mesh(beltGeo, stdMat('#15171c', 0.48, 0.18));
    belt.position.set(0, 0.055, 0);
    hips.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.032, 0.012),
      stdMat('#b8c0cc', 0.28, 0.75)
    );
    buckle.position.set(0, 0.055, 0.101);
    hips.add(buckle);
  }

  // SPINE & CHEST
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.07, 0);
  hips.add(spine);

  const waistGeo = new THREE.CylinderGeometry(
    isFemale ? 0.112 : 0.134,
    isFemale ? 0.12 : 0.13,
    0.18,
    18
  );
  waistGeo.scale(1.0, 1.0, 0.73);
  const waistMesh = new THREE.Mesh(waistGeo, topMat);
  waistMesh.position.y = 0.08;
  spine.add(waistMesh);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.15, 0);
  spine.add(chest);

  const torsoGeo = new THREE.CylinderGeometry(
    isFemale ? 0.138 : 0.164,
    isFemale ? 0.114 : 0.136,
    0.27 * scaleH,
    20
  );
  torsoGeo.scale(1.0, 1.0, 0.74);
  const torsoMesh = new THREE.Mesh(torsoGeo, topMat);
  torsoMesh.position.y = 0.125 * scaleH;
  chest.add(torsoMesh);

  const shoulderCapGeo = new THREE.SphereGeometry(isFemale ? 0.14 : 0.166, 18, 12);
  shoulderCapGeo.scale(1.06, 0.38, 0.72);
  const shoulderCap = new THREE.Mesh(shoulderCapGeo, topMat);
  shoulderCap.position.y = 0.242 * scaleH;
  chest.add(shoulderCap);

  const collarGeo = new THREE.CylinderGeometry(0.068, 0.084, 0.065, 16);
  collarGeo.scale(1.0, 1.0, 0.82);
  const collarMesh = new THREE.Mesh(collarGeo, isFemale ? innerTopMat : accentClothMat);
  collarMesh.position.set(0, 0.258 * scaleH, 0.012);
  chest.add(collarMesh);

  if (!isFemale) {
    // Male tailored black button-up shirt (پیراهن مشکی): pointed collar flaps, front placket & buttons
    [-1, 1].forEach((s) => {
      const collarFlap = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, 0.052, 0.018),
        accentClothMat
      );
      collarFlap.position.set(s * 0.038, 0.242 * scaleH, 0.078);
      collarFlap.rotation.z = s * 0.42;
      collarFlap.rotation.x = -0.22;
      collarFlap.rotation.y = s * 0.28;
      chest.add(collarFlap);
    });

    // Subtle open collarbone V-neck skin detail at top of button-up shirt
    const neckV = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.048, 3), skinMat);
    neckV.rotation.z = Math.PI;
    neckV.scale.set(1.0, 1.0, 0.35);
    neckV.position.set(0, 0.244 * scaleH, 0.086);
    chest.add(neckV);

    // Center vertical shirt button placket
    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.235 * scaleH, 0.014),
      accentClothMat
    );
    placket.position.set(0, 0.118 * scaleH, 0.103);
    chest.add(placket);

    // Subtle charcoal-pearl shirt buttons down the placket
    const buttonMat = stdMat('#4c5260', 0.32, 0.38);
    [0.2, 0.145, 0.09, 0.035].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 10), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, by * scaleH, 0.111);
      chest.add(btn);
    });

    // Tailored breast pocket on black shirt
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.05, 0.012), accentClothMat);
    pocket.position.set(-0.072, 0.162 * scaleH, 0.098);
    chest.add(pocket);
  } else {
    // Female delicate gold pendant + knit V-neck trim + crossbody bag
    const pendant = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 10, 10),
      stdMat('#f2c879', 0.25, 0.8)
    );
    pendant.position.set(0, 0.215, 0.098);
    chest.add(pendant);

    const bagMat = stdMat('#8c583a', 0.56, 0.12);
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, 0.252, 0.04),
      new THREE.Vector3(0.01, 0.13, 0.105),
      new THREE.Vector3(0.145, -0.05, 0.05),
      new THREE.Vector3(0.13, -0.05, -0.06),
      new THREE.Vector3(-0.01, 0.13, -0.105),
      new THREE.Vector3(-0.11, 0.252, -0.03),
    ]);
    chest.add(new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 20, 0.008, 6, true), bagMat));

    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.095, 0.125), bagMat);
    pouch.position.set(0.155, -0.09, 0.01);
    pouch.rotation.z = -0.12;
    chest.add(pouch);
  }

  // NECK & HEAD
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.265 * scaleH, 0);
  chest.add(neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.092, 14), skinMat);
  neckMesh.position.y = 0.038;
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.072, 0);
  neck.add(head);

  const headRadius = isFemale ? 0.124 : 0.128;
  const headGeo = createSculptedHeadGeometry(headRadius, isFemale ? 0.83 : 0.9);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.name = 'HeadMesh';
  headMesh.position.set(0, 0.115, 0);
  head.add(headMesh);

  const faceFrontZ = headRadius * 0.89;

  // Delicate sculpted nose
  const noseGeo = new THREE.ConeGeometry(0.013, 0.032, 12);
  noseGeo.rotateX(Math.PI * 0.44);
  const noseMesh = new THREE.Mesh(noseGeo, skinMat);
  noseMesh.position.set(0, 0.104, faceFrontZ + 0.011);
  head.add(noseMesh);

  // Dynamic Cheek Blush (ONLY on Female character — Male cheeks are clean without blush) + Ears
  [-1, 1].forEach((side) => {
    const sideLabel = side < 0 ? 'L' : 'R';
    if (isFemale) {
      const cheekGroup = new THREE.Group();
      cheekGroup.name = `Cheek${sideLabel}`;
      cheekGroup.position.set(side * 0.059, 0.094, faceFrontZ - 0.006);
      cheekGroup.rotation.y = side * 0.4;
      const cheekGeo = new THREE.SphereGeometry(0.023, 12, 10);
      cheekGeo.scale(1.25, 0.66, 0.32);
      cheekGroup.add(new THREE.Mesh(cheekGeo, blushMat));
      head.add(cheekGroup);
    }

    const earGeo = new THREE.SphereGeometry(0.024, 10, 10);
    earGeo.scale(0.42, 0.95, 0.68);
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(side * (headRadius * 0.91), 0.114, -0.004);
    head.add(ear);
  });

  // SOULFUL EYES, DOUBLE CATCHLIGHTS, UPPER & LOWER EYELIDS, EXPRESSIVE EYEBROWS
  const eyeSpacing = 0.043;
  const eyeY = 0.122;
  const eyeZ = faceFrontZ - 0.002;

  [-1, 1].forEach((side) => {
    const sideLabel = side < 0 ? 'L' : 'R';

    const eyeGroup = new THREE.Group();
    eyeGroup.name = `Eye${sideLabel}`;
    eyeGroup.position.set(side * eyeSpacing, eyeY, eyeZ);
    head.add(eyeGroup);

    const scleraGeo = new THREE.SphereGeometry(0.021, 16, 14);
    scleraGeo.scale(1.08, 0.98, 0.66);
    eyeGroup.add(new THREE.Mesh(scleraGeo, scleraMat));

    const outerIrisGeo = new THREE.SphereGeometry(0.0135, 14, 12);
    outerIrisGeo.scale(1.0, 1.05, 0.48);
    const outerIris = new THREE.Mesh(outerIrisGeo, irisOuterMat);
    outerIris.position.z = 0.0095;
    eyeGroup.add(outerIris);

    const innerIrisGeo = new THREE.SphereGeometry(0.0108, 12, 10);
    innerIrisGeo.scale(1.0, 1.04, 0.46);
    const innerIris = new THREE.Mesh(innerIrisGeo, irisInnerMat);
    innerIris.position.set(0, -0.001, 0.0112);
    eyeGroup.add(innerIris);

    const pupilGeo = new THREE.SphereGeometry(0.0066, 10, 8);
    pupilGeo.scale(1.0, 1.0, 0.42);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.z = 0.0138;
    eyeGroup.add(pupil);

    // Primary sparkle catchlight
    const catch1 = new THREE.Mesh(new THREE.SphereGeometry(0.0033, 8, 8), catchlightMat);
    catch1.position.set(0.0042, 0.0048, 0.0165);
    eyeGroup.add(catch1);

    // Secondary soft lower catchlight for soulful emotion
    const catch2 = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 6, 6), catchlightMat);
    catch2.position.set(-0.0035, -0.0038, 0.0162);
    eyeGroup.add(catch2);

    // Upper Eyelid + Eyelashes
    const eyelidGroup = new THREE.Group();
    eyelidGroup.name = `Eyelid${sideLabel}`;
    eyelidGroup.position.set(side * eyeSpacing, eyeY + 0.002, eyeZ + 0.001);
    const lidGeo = new THREE.SphereGeometry(0.0225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.54);
    lidGeo.scale(1.09, 0.99, 0.74);
    const lidMesh = new THREE.Mesh(lidGeo, skinMat);
    lidMesh.rotation.x = -1.28;
    lidMesh.name = `EyelidMesh${sideLabel}`;
    eyelidGroup.add(lidMesh);

    const lashGeo = new THREE.TorusGeometry(0.0205, isFemale ? 0.0026 : 0.0018, 6, 16, Math.PI * 0.88);
    const lash = new THREE.Mesh(lashGeo, hairMat);
    lash.position.set(0, 0.003, 0.012);
    lash.rotation.z = Math.PI * 0.06;
    eyelidGroup.add(lash);
    head.add(eyelidGroup);

    // Lower Eyelid smile crescent (rises during smiles & laughter!)
    const lowerLid = new THREE.Group();
    lowerLid.name = `LowerLid${sideLabel}`;
    lowerLid.position.set(side * eyeSpacing, eyeY - 0.021, eyeZ + 0.012);
    const lowerLidGeo = new THREE.CapsuleGeometry(0.0045, 0.024, 4, 8);
    lowerLidGeo.rotateZ(Math.PI / 2);
    lowerLidGeo.scale(1.0, 0.65, 0.5);
    lowerLid.add(new THREE.Mesh(lowerLidGeo, skinMat));
    head.add(lowerLid);

    // Expressive Sculpted Eyebrow (100% visible on clean open forehead!)
    const browGroup = new THREE.Group();
    browGroup.name = `Brow${sideLabel}`;
    browGroup.position.set(side * eyeSpacing, eyeY + 0.036, faceFrontZ + 0.006);
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.014, -0.001, -0.001),
      new THREE.Vector3(0, 0.0028, 0.002),
      new THREE.Vector3(side * 0.015, -0.0018, -0.003),
    ]);
    const browGeo = new THREE.TubeGeometry(browCurve, 10, isFemale ? 0.0032 : 0.0044, 6, false);
    browGroup.add(new THREE.Mesh(browGeo, hairMat));
    head.add(browGroup);
  });

  // MULTI-EMOTION 3D MOUTH RIG
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'Mouth';
  mouthGroup.position.set(0, 0.068, faceFrontZ + 0.003);

  // 1. Neutral calm lip
  const neutralCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.016, 0.001, -0.001),
    new THREE.Vector3(0, -0.0005, 0.002),
    new THREE.Vector3(0.016, 0.001, -0.001),
  ]);
  const mouthNeutral = new THREE.Mesh(
    new THREE.TubeGeometry(neutralCurve, 10, 0.0028, 6, false),
    lipMat
  );
  mouthNeutral.name = 'MouthNeutral';
  mouthGroup.add(mouthNeutral);

  // 2. Warm genuine smile arc
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.022, 0.0065, -0.003),
    new THREE.Vector3(0, -0.0022, 0.003),
    new THREE.Vector3(0.022, 0.0065, -0.003),
  ]);
  const mouthSmile = new THREE.Mesh(
    new THREE.TubeGeometry(smileCurve, 12, 0.003, 6, false),
    lipMat
  );
  mouthSmile.name = 'MouthSmile';
  mouthSmile.visible = false;
  mouthGroup.add(mouthSmile);

  // 3. Shy / nervous gentle asymmetric lip
  const shyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.014, 0.0005, -0.001),
    new THREE.Vector3(0.002, -0.0012, 0.002),
    new THREE.Vector3(0.016, 0.0042, -0.002),
  ]);
  const mouthShy = new THREE.Mesh(
    new THREE.TubeGeometry(shyCurve, 10, 0.0027, 6, false),
    lipMat
  );
  mouthShy.name = 'MouthShy';
  mouthShy.visible = false;
  mouthGroup.add(mouthShy);

  // 4. Open vowel / joyful laugh mouth interior
  const openGeo = new THREE.SphereGeometry(0.014, 12, 10);
  openGeo.scale(1.15, 0.72, 0.32);
  const mouthOpen = new THREE.Mesh(openGeo, mouthInnerMat);
  mouthOpen.name = 'MouthOpen';
  mouthOpen.position.set(0, -0.001, -0.001);
  mouthOpen.scale.set(0.01, 0.01, 0.01);
  mouthOpen.visible = false;
  mouthGroup.add(mouthOpen);

  head.add(mouthGroup);

  // ==========================================================
  // SCULPTED STYLIZED HAIR — 100% CLEAR OF FOREHEAD & EYES!
  // ==========================================================
  const hairGroup = new THREE.Group();
  hairGroup.name = 'HairGroup';
  head.add(hairGroup);

  if (isFemale) {
    // Back & top crown cap rotated BACKWARD (-0.62 rad) so front rim stays high at y ~ 0.198!
    const crownGeo = new THREE.SphereGeometry(
      headRadius * 1.09,
      24,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.56
    );
    crownGeo.scale(1.03, 1.08, 1.04);
    const crown = new THREE.Mesh(crownGeo, hairMat);
    crown.position.set(0, 0.126, -0.01);
    crown.rotation.x = -0.62;
    hairGroup.add(crown);

    // High parted side-swept top wave (strictly y >= 0.182, well above eyebrows at y = 0.158!)
    const rightSweep = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.032, 0.236, 0.048),
      new THREE.Vector3(0.028, 0.228, 0.088),
      new THREE.Vector3(0.082, 0.204, 0.082),
      new THREE.Vector3(0.118, 0.172, 0.038),
    ]);
    const rightSweepGeo = new THREE.TubeGeometry(rightSweep, 16, 0.023, 10, false);
    rightSweepGeo.scale(1.0, 0.78, 0.72);
    hairGroup.add(new THREE.Mesh(rightSweepGeo, hairHighlightMat));

    const leftSweep = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.028, 0.236, 0.045),
      new THREE.Vector3(-0.078, 0.214, 0.076),
      new THREE.Vector3(-0.116, 0.176, 0.038),
    ]);
    const leftSweepGeo = new THREE.TubeGeometry(leftSweep, 14, 0.021, 10, false);
    leftSweepGeo.scale(1.0, 0.76, 0.72);
    hairGroup.add(new THREE.Mesh(leftSweepGeo, hairMat));

    // Framing side locks tucked cleanly along sides of cheeks (x = ±0.118, behind glasses front!)
    [-1, 1].forEach((side) => {
      const lockCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.118, 0.174, 0.028),
        new THREE.Vector3(side * 0.125, 0.105, 0.008),
        new THREE.Vector3(side * 0.116, 0.028, 0.016),
      ]);
      hairGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lockCurve, 12, 0.021, 8, false), hairMat));
    });

    // Dynamic layered back hair waves
    const hairDynamic = new THREE.Group();
    hairDynamic.name = 'HairDynamic';
    hairDynamic.position.set(0, 0.115, -0.092);

    const backMainGeo = new THREE.CapsuleGeometry(0.114, 0.17, 10, 18);
    backMainGeo.scale(1.06, 1.0, 0.62);
    const backMain = new THREE.Mesh(backMainGeo, hairMat);
    backMain.position.set(0, -0.058, -0.008);
    backMain.rotation.x = 0.08;
    hairDynamic.add(backMain);

    // Sculpted wavy hair tips
    [-0.065, 0, 0.065].forEach((hx, hi) => {
      const waveCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(hx, 0.01, -0.02),
        new THREE.Vector3(hx * 1.15, -0.09, -0.042),
        new THREE.Vector3(hx * 1.08, -0.185, -0.025),
      ]);
      hairDynamic.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(waveCurve, 10, 0.026, 8, false),
          hi === 1 ? hairHighlightMat : hairMat
        )
      );
    });

    hairGroup.add(hairDynamic);
  } else {
    // Male sculpted hair: clean open forehead + lifted textured quiff above y = 0.19!
    const crownGeo = new THREE.SphereGeometry(
      headRadius * 1.07,
      24,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.56
    );
    crownGeo.scale(1.01, 1.06, 1.03);
    const crown = new THREE.Mesh(crownGeo, hairMat);
    crown.position.set(0, 0.128, -0.012);
    crown.rotation.x = -0.62;
    hairGroup.add(crown);

    // Lifted wavy front quiff sweeping up & right (strictly y >= 0.192!)
    const quiffMain = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.075, 0.205, 0.068),
      new THREE.Vector3(-0.015, 0.238, 0.092),
      new THREE.Vector3(0.048, 0.232, 0.086),
      new THREE.Vector3(0.096, 0.198, 0.056),
    ]);
    const quiffGeo = new THREE.TubeGeometry(quiffMain, 16, 0.026, 10, false);
    quiffGeo.scale(1.0, 0.85, 0.78);
    hairGroup.add(new THREE.Mesh(quiffGeo, hairHighlightMat));

    // Sideburn / temple tapers (strictly on sides x = ±0.118, z <= 0.025)
    [-1, 1].forEach((side) => {
      const sideTaper = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.112, 0.195, 0.035),
        new THREE.Vector3(side * 0.121, 0.152, 0.012),
        new THREE.Vector3(side * 0.118, 0.122, -0.002),
      ]);
      hairGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(sideTaper, 8, 0.017, 8, false), hairMat)
      );
    });

    const napeGeo = new THREE.SphereGeometry(headRadius * 0.96, 16, 12);
    napeGeo.scale(0.95, 0.86, 0.68);
    const nape = new THREE.Mesh(napeGeo, hairMat);
    nape.position.set(0, 0.106, -0.056);
    hairGroup.add(nape);
  }

  // 3D EYEGLASSES ATTACHED TO HEAD
  const glasses3D = build3DGlasses({
    style: isFemale ? 'round' : 'rect',
    frameColor: isFemale ? '#d48c6a' : '#202630',
    metalAccent: isFemale ? '#f5cfa8' : '#b8c4d4',
    eyeSpacing,
    eyeY: eyeY - 0.001,
    glassesZ: faceFrontZ + 0.021,
  });
  // عینک فقط برای یکی از دو شخصیت اصلی ساخته میشود.
  if (isFemale) head.add(glasses3D);

  // SEAMLESS ARMS WITH JOINT SPHERES & SCULPTED HANDS
  const shoulderX = isFemale ? 0.156 : 0.184;
  const upperArmLen = 0.24 * scaleH;
  const foreArmLen = 0.22 * scaleH;

  [-1, 1].forEach((side) => {
    const sideLabel = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.name = `Shoulder${sideLabel}`;
    shoulder.position.set(side * shoulderX, 0.232 * scaleH, 0);
    chest.add(shoulder);

    const arm = new THREE.Group();
    arm.name = `Arm${sideLabel}`;
    shoulder.add(arm);

    // Seamless shoulder joint cap
    arm.add(new THREE.Mesh(new THREE.SphereGeometry(isFemale ? 0.04 : 0.046, 10, 10), topMat));

    const uArmMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.037 : 0.043, upperArmLen - 0.04, 6, 12),
      topMat
    );
    uArmMesh.position.y = -upperArmLen * 0.5;
    arm.add(uArmMesh);

    const foreArm = new THREE.Group();
    foreArm.name = `ForeArm${sideLabel}`;
    foreArm.position.set(0, -upperArmLen, 0);
    arm.add(foreArm);

    // Seamless elbow joint sphere
    foreArm.add(new THREE.Mesh(new THREE.SphereGeometry(isFemale ? 0.035 : 0.04, 10, 10), topMat));

    const fArmMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.032 : 0.037, foreArmLen - 0.04, 6, 12),
      topMat
    );
    fArmMesh.position.y = -foreArmLen * 0.5;
    foreArm.add(fArmMesh);

    // Shirt / sweater wrist cuff detail
    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(isFemale ? 0.034 : 0.038, isFemale ? 0.032 : 0.036, 0.028, 12),
      isFemale ? innerTopMat : accentClothMat
    );
    cuff.position.y = -foreArmLen + 0.016;
    foreArm.add(cuff);

    const hand = new THREE.Group();
    hand.name = `Hand${sideLabel}`;
    hand.position.set(0, -foreArmLen, 0);
    foreArm.add(hand);

    const palmGeo = new THREE.SphereGeometry(isFemale ? 0.032 : 0.036, 12, 10);
    palmGeo.scale(0.8, 1.22, 0.56);
    const palmMesh = new THREE.Mesh(palmGeo, skinMat);
    palmMesh.position.y = -0.026;
    hand.add(palmMesh);

    // Sculpted thumb silhouette for expressive hand gestures
    const thumbGeo = new THREE.CapsuleGeometry(0.008, 0.02, 4, 6);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-side * 0.02, -0.02, 0.014);
    thumb.rotation.z = side * 0.45;
    thumb.rotation.x = 0.35;
    hand.add(thumb);

    if (!isFemale && side > 0) {
      const penGeo = new THREE.CylinderGeometry(0.004, 0.003, 0.13, 8);
      penGeo.rotateZ(Math.PI * 0.35);
      const penMesh = new THREE.Mesh(penGeo, stdMat('#1e3a5f', 0.3, 0.5));
      penMesh.name = 'HeldPen';
      penMesh.position.set(-0.015, -0.038, 0.025);
      hand.add(penMesh);
    }
  });

  // SEAMLESS LEGS & STYLISH FOOTWEAR
  const hipX = isFemale ? 0.078 : 0.086;
  const thighLen = 0.41 * scaleH;
  const shinLen = 0.41 * scaleH;

  [-1, 1].forEach((side) => {
    const sideLabel = side < 0 ? 'L' : 'R';
    const upLeg = new THREE.Group();
    upLeg.name = `UpLeg${sideLabel}`;
    upLeg.position.set(side * hipX, -0.04, 0);
    hips.add(upLeg);

    const thighMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.053 : 0.059, thighLen - 0.06, 6, 12),
      legTightMat
    );
    thighMesh.position.y = -thighLen * 0.5;
    upLeg.add(thighMesh);

    const leg = new THREE.Group();
    leg.name = `Leg${sideLabel}`;
    leg.position.set(0, -thighLen, 0);
    upLeg.add(leg);

    leg.add(
      new THREE.Mesh(new THREE.SphereGeometry(isFemale ? 0.044 : 0.05, 10, 10), legTightMat)
    );

    const shinMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? 0.042 : 0.048, shinLen - 0.06, 6, 12),
      legTightMat
    );
    shinMesh.position.y = -shinLen * 0.5;
    leg.add(shinMesh);

    const foot = new THREE.Group();
    foot.name = `Foot${sideLabel}`;
    foot.position.set(0, -shinLen, 0);
    leg.add(foot);

    const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.058, 0.168), shoeMat);
    shoeMesh.position.set(0, -0.012, 0.032);
    foot.add(shoeMesh);

    const soleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.174), shoeSoleMat);
    soleMesh.position.set(0, -0.038, 0.032);
    foot.add(soleMesh);
  });

  return root;
}

/**
 * Upgraded Background Student NPC:
 * Clean open face (hair tilted back, subtle eyes & warm smile) + forearm articulation
 * so seated pairs chatting with each other in the Lobby look lively and natural!
 */
function buildStudentNPC() {
  const root = new THREE.Group();
  root.name = 'StudentNPC';

  const skinMat = stdMat('#d6ccc6', 0.78, 0.0);
  const hairMat = stdMat('#50535b', 0.82, 0.0);
  const sweaterMat = stdMat('#78808a', 0.85, 0.0);
  const pantsMat = stdMat('#4a5058', 0.86, 0.0);
  const featureMat = stdMat('#3c3e45', 0.6, 0.0);

  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.88, 0);
  root.add(hips);
  hips.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 10), pantsMat));

  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.06, 0);
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.05, 0);
  spine.add(chest);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.4, 12), sweaterMat);
  torso.scale.set(1, 1, 0.74);
  torso.position.y = 0.2;
  chest.add(torso);

  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.41, 0);
  chest.add(neck);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.05, 0);
  neck.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), skinMat);
  headMesh.scale.set(0.92, 1.08, 0.94);
  headMesh.position.y = 0.11;
  head.add(headMesh);

  // Subtle clean eyes & gentle mouth on background students
  [-1, 1].forEach((s) => {
    const dotEye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), featureMat);
    dotEye.position.set(s * 0.038, 0.118, 0.102);
    head.add(dotEye);
  });
  const npcMouth = new THREE.Group();
  npcMouth.name = 'Mouth';
  npcMouth.position.set(0, 0.076, 0.102);
  npcMouth.add(new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.004, 0.004), featureMat));
  head.add(npcMouth);

  // Hair cap rotated gently backward (-0.38 rad) & scaled above headMesh so top hair is full while face is 100% open!
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.123, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairCap.scale.set(0.98, 1.13, 1.02);
  hairCap.position.set(0, 0.122, -0.008);
  hairCap.rotation.x = -0.38;
  head.add(hairCap);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.name = `Shoulder${label}`;
    shoulder.position.set(side * 0.16, 0.36, 0);
    chest.add(shoulder);

    const arm = new THREE.Group();
    arm.name = `Arm${label}`;
    shoulder.add(arm);
    const uArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.17, 4, 8), sweaterMat);
    uArm.position.y = -0.1;
    arm.add(uArm);

    const foreArm = new THREE.Group();
    foreArm.name = `ForeArm${label}`;
    foreArm.position.set(0, -0.21, 0);
    arm.add(foreArm);
    const fArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), skinMat);
    fArm.position.y = -0.1;
    foreArm.add(fArm);

    const upLeg = new THREE.Group();
    upLeg.name = `UpLeg${label}`;
    upLeg.position.set(side * 0.08, -0.04, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.32, 4, 8), pantsMat);
    thigh.position.y = -0.2;
    upLeg.add(thigh);

    const leg = new THREE.Group();
    leg.name = `Leg${label}`;
    leg.position.set(0, -0.4, 0);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.34, 4, 8), pantsMat);
    shin.position.y = -0.21;
    leg.add(shin);
    upLeg.add(leg);
    hips.add(upLeg);
  });

  return root;
}

function buildMissionProps() {
  const root = new THREE.Group();
  root.name = 'MissionProps';

  const starGroup = new THREE.Group();
  starGroup.name = 'GlassStar';
  const starShape = new THREE.Shape();
  const points = 5;
  const outerR = 0.28;
  const innerR = 0.12;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.032,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  starGeo.center();
  const glassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c2ebff'),
    emissive: new THREE.Color('#57b0f0'),
    emissiveIntensity: 0.45,
    roughness: 0.08,
    metalness: 0.25,
    transparent: true,
    opacity: 0.86,
  });
  const starMesh = new THREE.Mesh(starGeo, glassMat);
  starMesh.position.y = 0.34;
  starGroup.add(starMesh);

  const standBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 0.05, 16),
    stdMat('#cfa86e', 0.32, 0.72)
  );
  standBase.position.y = 0.025;
  starGroup.add(standBase);
  root.add(starGroup);

  const flowerGroup = new THREE.Group();
  flowerGroup.name = 'BotanicalFlower';
  flowerGroup.position.x = 1.0;

  const vaseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 0.22, 16),
    stdMat('#f2ece2', 0.38, 0.05)
  );
  vaseMesh.position.y = 0.11;
  flowerGroup.add(vaseMesh);

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.18, 0),
    new THREE.Vector3(0.018, 0.32, 0.01),
    new THREE.Vector3(-0.01, 0.46, 0.02),
  ]);
  flowerGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 10, 0.012, 6, false), stdMat('#4a8258', 0.65))
  );

  const blossom = new THREE.Group();
  blossom.position.set(-0.01, 0.47, 0.02);
  blossom.rotation.x = 0.35;
  const petalMat = stdMat('#f48ba4', 0.42, 0.02, {
    emissive: new THREE.Color('#7a283d'),
    emissiveIntensity: 0.22,
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petalGeo = new THREE.SphereGeometry(0.062, 10, 8);
    petalGeo.scale(0.64, 0.26, 1.38);
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(a) * 0.07, 0.01, Math.sin(a) * 0.07);
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = -0.25;
    blossom.add(petal);
  }
  const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), stdMat('#f7ca5e', 0.38, 0.1));
  stamen.position.y = 0.018;
  blossom.add(stamen);
  flowerGroup.add(blossom);
  root.add(flowerGroup);

  const bookGroup = new THREE.Group();
  bookGroup.name = 'StoryBook';
  bookGroup.position.x = 2.0;

  const coverMat = stdMat('#6e3b2d', 0.58, 0.1);
  const pageMat = stdMat('#fcf5e6', 0.7, 0.0);
  const ribbonMat = stdMat('#e0ab43', 0.42, 0.32);

  [-1, 1].forEach((side) => {
    const halfCover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.022, 0.3), coverMat);
    halfCover.position.set(side * 0.11, 0.07, 0);
    halfCover.rotation.z = -side * 0.18;
    bookGroup.add(halfCover);

    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.038, 0.28), pageMat);
    pages.position.set(side * 0.102, 0.095, 0);
    pages.rotation.z = -side * 0.16;
    bookGroup.add(pages);
  });

  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.34), ribbonMat);
  ribbon.position.set(0.01, 0.112, 0.03);
  bookGroup.add(ribbon);
  root.add(bookGroup);

  return root;
}

async function exportToGlb(object3d, filename) {
  const exporter = new GLTFExporter();
  const scene = new THREE.Scene();
  scene.add(object3d);
  scene.updateMatrixWorld(true);

  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(scene, (result) => resolve(result), (err) => reject(err), { binary: true });
  });

  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));
  const stats = fs.statSync(outPath);
  console.log(`Generated ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  await exportToGlb(buildMainCharacter('female'), 'female_character.glb');
  await exportToGlb(buildMainCharacter('male'), 'male_character.glb');
  await exportToGlb(buildStudentNPC(), 'student_npc.glb');
  await exportToGlb(buildMissionProps(), 'mission_props.glb');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
