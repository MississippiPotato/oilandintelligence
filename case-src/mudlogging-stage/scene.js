import {
  REVISION, Scene, Color, PerspectiveCamera, WebGLRenderer, HemisphereLight, DirectionalLight, PointLight,
  Group, Mesh, MeshStandardMaterial, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry,
  IcosahedronGeometry, TorusGeometry, TubeGeometry, ExtrudeGeometry, Shape, Path, CatmullRomCurve3,
  BufferGeometry, Line, LineBasicMaterial, LineDashedMaterial, Vector2, Vector3, Spherical, Raycaster,
  DoubleSide, PCFSoftShadowMap, SRGBColorSpace, ACESFilmicToneMapping
} from '../../portal/assets/vendor/three-r180/three.module.js';
import { sampleRoute } from './transport.js';

export const revision = REVISION;
export const authorship = 'Original procedural teaching geometry; no external models, textures, or copied scene code.';

const COLORS = { cream: '#F7F4EF', ink: '#343941', red: '#B8242A', blue: '#55768B', gold: '#A4712D', green: '#467969', violet: '#806482' };
const presets = {
  overview: { target: [-.45, -.7, .1], eye: [9.8, 6.1, 12.2] },
  return: { target: [-2.8, -2.1, .12], eye: [3.7, 1.2, 7.0] },
  surface: { target: [1.0, .6, .25], eye: [6.3, 4.3, 7.5] },
  interpret: { target: [3.65, .65, .15], eye: [7.4, 3.0, 5.4] }
};
const objectCenters = { m1: [-.1, .5, .6], m2: [1.5, .65, -.7], m3: [2.15, .65, 1.22], m4: [-1.05, .9, -1.15], m5: [4.05, .75, .25] };
const V = a => new Vector3(...a);
const ease = t => 1 - Math.pow(1 - t, 3);

export function create(host, options = {}) {
  const canvas = host.ownerDocument.createElement('canvas');
  canvas.dataset.ms3dCanvas = 'true'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '可旋转的录井三维剖面。拖动旋转；方向键旋转，正负键缩放，Home回全景。设备可点选，旁边提供等价文字入口。');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (cause) {
    const error = new Error('WebGL is unavailable', { cause }); error.code = 'WEBGL_UNAVAILABLE'; throw error;
  }
  if (String(REVISION) !== '180') { renderer.dispose(); throw new Error('Expected Three.js r180'); }
  renderer.setPixelRatio(Math.min(host.ownerDocument.defaultView.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor(COLORS.cream, 1);
  host.append(canvas);
  const scene = new Scene(); scene.background = new Color(COLORS.cream);
  const camera = new PerspectiveCamera(37, 1, .1, 120), target = new Vector3();
  const raycaster = new Raycaster(), pointer = new Vector2(), spherical = new Spherical();
  const objects = new Map(), selectable = [], materials = new Set(), geometries = new Set(), listeners = [];
  let disposed = false, active = true, reducedMotion = !!options.reducedMotion, current = null, cameraName = 'overview';
  let focusId = null, cameraTween = null, orbitChanged = false, frameCount = 0, lastFrameTime = null, resized = false;
  let currentSelection = 'm2', renderWidth = 0, renderHeight = 0, resourceDisposals = { geometries: 0, materials: 0, shadowMaps: 0, renderer: false, contextLost: false };
  let resizeObserver = null, resourcesFreed = false;
  const pointers = new Map();
  function freeResources() {
    if (resourcesFreed) return; resourcesFreed = true;
    for (const id of pointers.keys()) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    pointers.clear(); listeners.splice(0).forEach(remove => remove());
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    scene.traverse(item => { if (item.shadow && item.shadow.dispose) { if (item.shadow.map) resourceDisposals.shadowMaps++; item.shadow.dispose(); } });
    for (const geometry of geometries) { geometry.dispose(); resourceDisposals.geometries++; }
    for (const mat of materials) { mat.dispose(); resourceDisposals.materials++; }
    renderer.renderLists.dispose(); renderer.dispose(); resourceDisposals.renderer = true;
    renderer.forceContextLoss(); resourceDisposals.contextLost = true; canvas.remove(); scene.clear();
  }

  try {

  function material(color, extra = {}) {
    const mat = new MeshStandardMaterial({ color, roughness: .73, metalness: .08, ...extra }); materials.add(mat); return mat;
  }
  function mesh(geometry, mat, position, parent = scene, rotation = null) {
    geometries.add(geometry); const item = new Mesh(geometry, mat); if (position) item.position.set(...position);
    if (rotation) item.rotation.set(...rotation); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
  }
  function box(size, position, color, parent = scene, extra = {}) { return mesh(new BoxGeometry(...size), material(color, extra), position, parent); }
  function rod(a, b, radius, color, parent = scene, mat = null) {
    const start = V(a), end = V(b), delta = end.clone().sub(start), length = delta.length();
    const item = mesh(new CylinderGeometry(radius, radius, length, 8), mat || material(color), start.add(end).multiplyScalar(.5).toArray(), parent);
    item.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize()); return item;
  }
  function pipe(points, radius, color, parent = scene) {
    const curve = new CatmullRomCurve3(points.map(V), false, 'centripetal');
    mesh(new TubeGeometry(curve, Math.max(20, points.length * 8), radius, 7, false), material(color, { metalness: .16, roughness: .64 }), null, parent);
    return curve;
  }
  function dataLine(points, parent = scene) {
    const geometry = new BufferGeometry().setFromPoints(points.map(V)); geometries.add(geometry);
    const mat = new LineDashedMaterial({ color: COLORS.blue, dashSize: .09, gapSize: .07, transparent: true, opacity: .7 }); materials.add(mat);
    const line = new Line(geometry, mat); line.computeLineDistances(); parent.add(line); return line;
  }
  function caseGroup(id) {
    const group = new Group(); group.name = id; group.userData.caseId = id; group.userData.lift = 0; scene.add(group); objects.set(id, group); return group;
  }
  function feet(parent, x, z, width, depth, height) {
    for (const dx of [-width / 2, width / 2]) for (const dz of [-depth / 2, depth / 2]) rod([x + dx, .06, z + dz], [x + dx, height, z + dz], .025, '#8F9691', parent);
  }
  function stones(parent, center, count, spread, scale = .075, violet = false) {
    const colors = violet ? ['#B799C7', '#D0B0C2', '#9779B0'] : ['#B8A17E', '#8E8E81', '#D2B998', '#A59177'];
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963, radius = Math.sqrt((i + .4) / count) * spread;
      const stone = mesh(new IcosahedronGeometry(scale * (1 + (i % 3) * .18), 0), material(colors[i % colors.length], { flatShading: true, roughness: .95 }),
        [center[0] + Math.cos(angle) * radius, center[1] + (i % 2) * .025, center[2] + Math.sin(angle) * radius * .52], parent);
      stone.rotation.set(i * .31, i * .71, i * .43);
    }
  }

  scene.add(new HemisphereLight('#FFFDF7', '#A6ABA0', 2.1));
  const sun = new DirectionalLight('#FFF5DE', 3.1); sun.position.set(-3, 9, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7; sun.shadow.normalBias = .035; sun.shadow.bias = -.00015; scene.add(sun);
  const fill = new DirectionalLight('#DDE7ED', 1.15); fill.position.set(5, 2, -4); scene.add(fill);

  // The land has a real circular opening. The geological face behind the shaft is deliberately cut away.
  const land = new Shape(); land.moveTo(-5.6, -2.15); land.lineTo(5.6, -2.15); land.lineTo(5.6, 2.25); land.lineTo(-5.6, 2.25); land.closePath();
  const hole = new Path(); hole.absarc(-3, 0, .57, 0, Math.PI * 2, true); land.holes.push(hole);
  mesh(new ExtrudeGeometry(land, { depth: .16, bevelEnabled: false }), material('#D9D5C7'), [0, -.03, 0], scene, [-Math.PI / 2, 0, 0]);
  const xs = [-5.4, -4.05, -2.65, -1.25, .1, 1.4], offsets = [-.02, .09, .02, -.07, .025, .06];
  const layerColors = ['#D6C9AF', '#BCC6B4', '#C8AD87', '#9CAFA4'];
  for (let i = 0; i < 4; i++) {
    const top = -.12 - i * 1.18, bottom = top - 1.18, shape = new Shape();
    shape.moveTo(xs[0], top + offsets[0]); xs.slice(1).forEach((x, j) => shape.lineTo(x, top + offsets[j + 1]));
    for (let j = xs.length - 1; j >= 0; j--) shape.lineTo(xs[j], bottom + offsets[j]); shape.closePath();
    mesh(new ExtrudeGeometry(shape, { depth: 1.9, bevelEnabled: false }), material(layerColors[i], { roughness: 1 }), [0, 0, -2.0]);
    for (let j = 0; j < 9; j++) {
      const x = -5.15 + j * .75, yy = top - .48 + Math.sin(j * 1.3 + i) * .12;
      rod([x, yy, -.085], [x + .18, yy + (i % 2 ? .02 : -.035), -.085], .012, i % 2 ? '#7D9487' : '#A28F74');
    }
  }
  const casing = mesh(new CylinderGeometry(.48, .48, 4.65, 38, 1, true, Math.PI * .56, Math.PI * 1.4),
    material('#A3AEA9', { metalness: .35, roughness: .48, side: DoubleSide }), [-3, -2.39, 0]); casing.castShadow = false;
  mesh(new CylinderGeometry(.36, .36, 4.5, 36, 1, true, Math.PI * .56, Math.PI * 1.4),
    material('#C4A36D', { transparent: true, opacity: .24, depthWrite: false, side: DoubleSide }), [-3, -2.37, 0]);
  rod([-3, .35, 0], [-3, -4.55, 0], .095, '#758A86');
  const bit = new Group(); bit.position.set(-3, -4.61, 0); scene.add(bit);
  mesh(new CylinderGeometry(.14, .22, .18, 10), material('#7D847D', { metalness: .55 }), [0, 0, 0], bit);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const cone = mesh(new ConeGeometry(.15, .22, 7), material('#A79779', { metalness: .4 }), [Math.cos(a) * .12, -.1, Math.sin(a) * .12], bit); cone.rotation.z = Math.PI; }

  // Four-sided derrick lattice, written here from rods rather than imported scene assets.
  const rig = new Group(); scene.add(rig); const steel = material('#A0665D', { metalness: .4, roughness: .55 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod([-3 + sx * .55, .08, sz * .45], [-3 + sx * .16, 3.05, sz * .15], .038, null, rig, steel);
  for (const height of [.65, 1.25, 1.85, 2.45, 3.05]) {
    const fraction = height / 3.05, dx = .55 - .39 * fraction, dz = .45 - .3 * fraction;
    for (const sz of [-1, 1]) rod([-3 - dx, height, sz * dz], [-3 + dx, height, sz * dz], .024, null, rig, steel);
    for (const sx of [-1, 1]) rod([-3 + sx * dx, height, -dz], [-3 + sx * dx, height, dz], .024, null, rig, steel);
  }
  for (let i = 0; i < 4; i++) {
    const low = .08 + i * .6, high = low + .58, w1 = .55 - low / 3.05 * .39, w2 = .55 - high / 3.05 * .39;
    const z1 = .45 - low / 3.05 * .3, z2 = .45 - high / 3.05 * .3;
    rod([-3 - w1, low, z1], [-3 + w2, high, z2], .018, null, rig, steel);
    rod([-3 + w1, low, -z1], [-3 - w2, high, -z2], .018, null, rig, steel);
  }
  box([1.45, .16, 1.24], [-3, .02, 0], '#B3B5A9');
  mesh(new TorusGeometry(.17, .045, 8, 18), material('#7D8986', { metalness: .5 }), [-3, 3.13, 0], rig, [0, Math.PI / 2, 0]);
  rod([-3, 3.02, .04], [-3, .35, .04], .018, '#8A9490');
  box([.8, .36, .65], [-4.65, .23, .95], '#7E988B');
  mesh(new CylinderGeometry(.28, .28, .52, 18), material('#809C90'), [-4.7, .36, -.25]);
  const downward = pipe([[-4.65, .45, .95], [-4.0, .6, .95], [-3, .55, .15], [-3, -4.48, .15]], .062, COLORS.green);
  const returnCurve = pipe([[-3, -4.48, .22], [-2.7, -4.38, .22], [-2.7, .22, .22], [-1.1, .49, .25], [-.12, .49, .25]], .084, COLORS.gold);
  for (const yy of [-.55, -1.9, -3.3]) {
    mesh(new ConeGeometry(.105, .22, 7), material(COLORS.green), [-3, yy, .15], scene, [Math.PI, 0, 0]);
    mesh(new ConeGeometry(.12, .24, 7), material(COLORS.gold), [-2.7, yy, .22]);
  }

  const m1 = caseGroup('m1');
  feet(m1, -.05, .53, 1.15, .75, .48);
  const sieve = box([1.48, .14, .95], [-.05, .54, .53], '#87989A', m1); sieve.rotation.z = -.07;
  for (let i = 0; i < 9; i++) rod([-.67 + i * .15, .64 - i * .01, .12], [-.67 + i * .15, .64 - i * .01, .93], .012, '#536C73', m1);
  box([.67, .08, .46], [.03, .28, 1.18], '#C7BDA7', m1); stones(m1, [.03, .36, 1.18], 11, .24, .05);
  box([.46, .2, .43], [-.85, .18, .76], '#B5B1A0', m1);

  const m2 = caseGroup('m2');
  box([1.6, .12, 1.0], [1.42, .12, -.81], '#C3C9BC', m2);
  mesh(new CylinderGeometry(.23, .23, .8, 22), material('#B2C2C2', { metalness: .35 }), [.98, .63, -.82], m2);
  mesh(new SphereGeometry(.235, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), material('#BAC8C7', { metalness: .35 }), [.98, 1.03, -.82], m2);
  box([.72, .8, .58], [1.86, .59, -.82], '#B4C4C8', m2);
  box([.45, .24, .015], [1.86, .76, -.52], '#486B7C', m2);
  for (let i = 0; i < 3; i++) mesh(new SphereGeometry(.028, 8, 6), material(['#A4CCB9', '#D6B779', '#B18FAE'][i], { emissive: ['#467969', '#8C6D39', '#806482'][i], emissiveIntensity: .18 }), [1.7 + i * .15, .51, -.51], m2);
  pipe([[.98, .94, -.82], [1.1, 1.18, -.82], [1.55, 1.18, -.82], [1.57, .83, -.82]], .035, COLORS.blue, m2);
  pipe([[-.8, .5, .25], [-.65, .7, -.25], [.58, .7, -.82], [.75, .7, -.82]], .036, COLORS.blue);

  const m3 = caseGroup('m3');
  feet(m3, 2.14, 1.22, 1.15, .65, .52); box([1.46, .13, .92], [2.14, .54, 1.22], '#C7C3B7', m3);
  box([1.28, .08, .83], [2.14, 1.27, 1.22], '#6D6972', m3);
  box([1.28, .65, .065], [2.14, .94, .84], '#77717C', m3);
  box([.065, .65, .83], [1.53, .94, 1.22], '#77717C', m3); box([.065, .65, .83], [2.75, .94, 1.22], '#77717C', m3);
  box([.77, .055, .43], [2.14, .65, 1.28], '#C3B9CB', m3, { emissive: '#806482', emissiveIntensity: .22 });
  stones(m3, [2.14, .73, 1.28], 9, .27, .047, true);
  const uv = new PointLight('#B595D3', .45, 2.0); uv.position.set(2.14, 1.14, 1.22); m3.add(uv);

  const m4 = caseGroup('m4');
  feet(m4, -1.12, -1.22, .7, .45, .72); box([1.03, .15, .68], [-1.12, .72, -1.22], '#9DAFA7', m4);
  const console = box([.93, .58, .12], [-1.12, 1.04, -1.36], '#8EA39A', m4); console.rotation.x = -.18;
  box([.72, .36, .02], [-1.12, 1.07, -1.28], '#3F5B57', m4);
  for (let i = 0; i < 3; i++) box([.15, .035, .025], [-1.34 + i * .23, .84, -1.0], '#D9D8C9', m4);
  dataLine([[-3, .48, -.12], [-2.1, .65, -.95], [-1.52, .92, -1.2]]);

  const m5 = caseGroup('m5');
  feet(m5, 4.0, .25, 1.65, .84, .64); box([1.93, .12, 1.04], [4, .67, .25], '#D5C2A5', m5);
  box([.09, .29, .1], [4.1, .89, .08], '#879691', m5); box([.47, .055, .26], [4.1, .75, .08], '#A1ACA3', m5);
  box([1.03, .7, .095], [4.1, 1.22, -.03], '#8D9F9B', m5); box([.89, .55, .018], [4.1, 1.23, .027], '#E7ECE5', m5);
  for (let i = 0; i < 4; i++) box([.53 - (i % 2) * .12, .018, .012], [4.08, 1.4 - i * .105, .04], ['#9BABA4', '#B08A4A', '#A5B1A9', '#A99085'][i], m5);
  const paper = box([.58, .025, .4], [3.52, .755, .42], '#F9F6EE', m5); paper.rotation.y = .12;
  for (let i = 0; i < 3; i++) box([.33 - i * .025, .008, .018], [3.52, .773, .3 + i * .09], '#B7AE9C', m5);
  box([.55, .045, .18], [4.18, .75, .57], '#B8C0B5', m5);
  dataLine([[2.19, .8, -.82], [3.0, 1.0, -.75], [3.65, 1.0, -.25]]);
  dataLine([[2.75, .72, 1.15], [3.24, .78, .95], [3.7, .77, .42]]);
  dataLine([[-.6, 1.0, -1.3], [.2, 1.4, -1.8], [3.3, 1.4, -1.4], [3.8, 1.1, -.23]]);

  const materialMarker = mesh(new IcosahedronGeometry(.17, 1), material('#E4B75D', { emissive: '#9C6D24', emissiveIntensity: .25, roughness: .5 }), [-3, -4.45, .22]);
  const recordMarker = mesh(new BoxGeometry(.23, .23, .23), material(COLORS.red, { emissive: '#72252B', emissiveIntensity: .15 }), [2.14, .79, 1.28]);
  const retainedSample = mesh(new IcosahedronGeometry(.085, 0), material('#DAB477', { roughness: .85 }), [2.14, .8, 1.28]);
  materialMarker.castShadow = false; recordMarker.castShadow = false; retainedSample.castShadow = false;
  recordMarker.visible = false; retainedSample.visible = false;
  const sieveCurve = new CatmullRomCurve3([[-.12, .62, .25], [.06, .7, .72], [.03, .43, 1.18]].map(V));
  const observeCurve = new CatmullRomCurve3([[.03, .43, 1.18], [.65, .8, 1.25], [1.35, .79, 1.28], [2.14, .79, 1.28]].map(V));
  const recordCurve = new CatmullRomCurve3([[2.14, .79, 1.28], [2.8, .96, 1.0], [3.5, 1.1, .6], [4.1, 1.28, .13]].map(V));

  for (const [id, group] of objects) {
    group.userData.baseY = group.position.y;
    group.traverse(item => {
      if (!item.isMesh) return;
      item.userData.caseId = id; selectable.push(item);
      const values = Array.isArray(item.material) ? item.material : [item.material];
      for (const mat of values) if (mat.isMeshStandardMaterial && !mat.userData.originalColor) {
        mat.userData.originalColor = mat.color.clone(); mat.userData.originalEmissive = mat.emissive.clone(); mat.userData.originalIntensity = mat.emissiveIntensity;
      }
    });
  }

  function cameraDestination(name, id = null) {
    const preset = presets[name] || presets.overview, nextTarget = id ? V(objectCenters[id]) : V(preset.target);
    const offset = id ? new Vector3(3.0, 2.1, 4.3) : V(preset.eye).sub(V(preset.target));
    const factor = renderWidth && renderHeight ? Math.max(1, 1.58 / (renderWidth / renderHeight)) : 1;
    offset.multiplyScalar(Math.min(1.65, factor) * (name === 'overview' && !id ? .79 : 1));
    if (name === 'overview' && !id && renderWidth && renderHeight) {
      // Recenter the actual mesh bounds, then retreat only when needed to keep the crown, bit and cutaway inside the frame.
      // These are geometric framing points, not visible labels or boxes. No per-frame fitting is performed.
      const points = [];
      scene.updateMatrixWorld(true);
      scene.traverse(item => {
        if (!item.geometry || !item.visible) return;
        let ancestor = item.parent; while (ancestor) { if (!ancestor.visible) return; ancestor = ancestor.parent; }
        if (!item.geometry.boundingBox) item.geometry.computeBoundingBox();
        const bounds = item.geometry.boundingBox;
        if (!bounds || bounds.isEmpty()) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          points.push(new Vector3(x, y, z).applyMatrix4(item.matrixWorld));
        }
      });
      const aspect = renderWidth / renderHeight, probe = new PerspectiveCamera(37, aspect, .1, 120), halfHeight = Math.tan(37 * Math.PI / 360);
      function projectedBounds() {
        probe.position.copy(nextTarget).add(offset); probe.lookAt(nextTarget); probe.updateMatrixWorld(true);
        const bounds = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
        for (const point of points) {
          const p = point.clone().project(probe);
          bounds.left = Math.min(bounds.left, p.x); bounds.right = Math.max(bounds.right, p.x);
          bounds.bottom = Math.min(bounds.bottom, p.y); bounds.top = Math.max(bounds.top, p.y);
        }
        return bounds;
      }
      if (points.length) for (let pass = 0; pass < 3; pass++) {
        let bounds = projectedBounds();
        const distanceScale = halfHeight * offset.length(), right = new Vector3(1, 0, 0).applyQuaternion(probe.quaternion), up = new Vector3(0, 1, 0).applyQuaternion(probe.quaternion);
        nextTarget.addScaledVector(right, (bounds.left + bounds.right) / 2 * distanceScale * aspect)
          .addScaledVector(up, (bounds.bottom + bounds.top) / 2 * distanceScale);
        bounds = projectedBounds();
        const safeScale = Math.max(Math.abs(bounds.left) / .92, Math.abs(bounds.right) / .92, Math.abs(bounds.top) / .94, Math.abs(bounds.bottom) / .94);
        if (safeScale > 1) offset.multiplyScalar(safeScale * 1.01);
      }
    }
    return { target: nextTarget, eye: nextTarget.clone().add(offset) };
  }
  function moveCamera(name, id, immediate) {
    const next = cameraDestination(name, id);
    if (immediate || reducedMotion) { target.copy(next.target); camera.position.copy(next.eye); camera.lookAt(target); cameraTween = null; }
    else cameraTween = { fromEye: camera.position.clone(), fromTarget: target.clone(), toEye: next.eye, toTarget: next.target, elapsed: 0, duration: .78 };
    options.requestFrame && options.requestFrame();
  }
  function setCamera(name, settings = {}) {
    if (!presets[name] || disposed) return;
    cameraName = name; focusId = null; orbitChanged = false; moveCamera(name, null, !!settings.immediate);
  }
  function selectObject(id, settings = {}) {
    if (!objects.has(id) || disposed) return;
    currentSelection = id;
    renderer.shadowMap.needsUpdate = true;
    for (const [key, group] of objects) {
      const selected = key === id;
      if (settings.immediate || reducedMotion) { group.userData.lift = selected ? .105 : 0; group.position.y = group.userData.baseY + group.userData.lift; }
      group.traverse(item => {
        if (!item.isMesh) return;
        for (const mat of Array.isArray(item.material) ? item.material : [item.material]) {
          if (!mat.userData.originalColor) continue;
          mat.color.copy(mat.userData.originalColor).multiplyScalar(selected ? 1.075 : .94);
          mat.emissive.copy(mat.userData.originalEmissive); mat.emissiveIntensity = mat.userData.originalIntensity;
          if (selected) { mat.emissive.add(new Color('#302619')); mat.emissiveIntensity = Math.max(.2, mat.emissiveIntensity); }
        }
      });
    }
    if (settings.focus) {
      focusId = id; cameraName = id === 'm4' ? 'return' : id === 'm5' ? 'interpret' : 'surface'; orbitChanged = false;
      moveCamera(cameraName, id, !!settings.immediate);
    }
    options.requestFrame && options.requestFrame();
  }
  function resize() {
    if (disposed) return;
    const rect = host.getBoundingClientRect(), width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
    if (width === renderWidth && height === renderHeight && resized) return;
    renderWidth = width; renderHeight = height; resized = true; renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    if (!orbitChanged) moveCamera(cameraName, focusId, true);
    options.requestFrame && options.requestFrame();
  }
  function update(value) {
    if (disposed) return;
    current = value;
    const route = sampleRoute(value);
    materialMarker.visible = route.kind === 'material'; recordMarker.visible = route.kind === 'record'; retainedSample.visible = route.kind === 'record';
    if (route.segment === 'bottom') materialMarker.position.set(-3, -4.45, .22);
    else if (route.segment === 'return') materialMarker.position.copy(returnCurve.getPointAt(route.fraction));
    else if (route.segment === 'sieve') materialMarker.position.copy(sieveCurve.getPointAt(route.fraction));
    else if (route.segment === 'observe') materialMarker.position.copy(observeCurve.getPointAt(route.fraction));
    else recordMarker.position.copy(recordCurve.getPointAt(route.fraction));
    bit.rotation.y = value.cumulativeVolume_m3 * 3.6;
  }
  function frame(dt = 0) {
    if (disposed || !active) return false;
    let moving = false;
    if (cameraTween) {
      cameraTween.elapsed += dt;
      const f = Math.min(1, cameraTween.elapsed / cameraTween.duration), eased = ease(f);
      camera.position.lerpVectors(cameraTween.fromEye, cameraTween.toEye, eased); target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
      if (f >= 1) cameraTween = null; else moving = true;
    }
    for (const [id, group] of objects) {
      const goal = id === currentSelection ? .105 : 0, difference = goal - group.userData.lift;
      if (Math.abs(difference) > .0008 && !reducedMotion) { group.userData.lift += difference * (1 - Math.exp(-Math.max(dt, .016) * 12)); moving = true; renderer.shadowMap.needsUpdate = true; }
      else group.userData.lift = goal;
      group.position.y = group.userData.baseY + group.userData.lift;
    }
    camera.lookAt(target); renderer.render(scene, camera); frameCount++; lastFrameTime = Date.now();
    return moving;
  }

  function listen(name, callback, settings) { canvas.addEventListener(name, callback, settings); listeners.push(() => canvas.removeEventListener(name, callback, settings)); }
  let pinchDistance = 0, gestureMoved = false, startPoint = null;
  function notifyOrbit() { cameraTween = null; focusId = null; orbitChanged = true; options.onOrbit && options.onOrbit(); options.requestFrame && options.requestFrame(); }
  function orbit(dx, dy) {
    spherical.setFromVector3(camera.position.clone().sub(target)); spherical.theta -= dx * .006;
    spherical.phi = Math.max(.18, Math.min(1.55, spherical.phi + dy * .006)); spherical.makeSafe();
    camera.position.copy(new Vector3().setFromSpherical(spherical).add(target)); notifyOrbit();
  }
  function zoom(ratio) {
    const offset = camera.position.clone().sub(target), radius = Math.max(3.1, Math.min(34, offset.length() * ratio));
    camera.position.copy(offset.setLength(radius).add(target)); notifyOrbit();
  }
  listen('pointerdown', event => {
    if (!active || disposed || event.button > 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) { gestureMoved = false; startPoint = { x: event.clientX, y: event.clientY }; }
    if (pointers.size === 2) { const p = [...pointers.values()]; pinchDistance = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); gestureMoved = true; }
  });
  listen('pointermove', event => {
    if (!active || !pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId); pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const p = [...pointers.values()], distance = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinchDistance > 2 && distance > 2) zoom(pinchDistance / distance); pinchDistance = distance;
    } else if (pointers.size === 1) {
      if (startPoint && Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y) > 5) gestureMoved = true;
      if (gestureMoved) orbit(event.clientX - previous.x, event.clientY - previous.y);
    }
  });
  function pointerEnd(event, cancelled = false) {
    if (!pointers.has(event.pointerId)) return;
    const click = !cancelled && !gestureMoved && pointers.size === 1;
    pointers.delete(event.pointerId); if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pinchDistance = 0;
    if (click && active) {
      const rect = canvas.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(selectable, false)[0];
      if (hit && hit.object.userData.caseId && options.onSelect) options.onSelect(hit.object.userData.caseId);
    }
  }
  listen('pointerup', event => pointerEnd(event)); listen('pointercancel', event => pointerEnd(event, true));
  listen('wheel', event => { if (!active) return; event.preventDefault(); zoom(Math.exp(Math.max(-100, Math.min(100, event.deltaY)) * .0015)); }, { passive: false });
  listen('contextmenu', event => event.preventDefault());
  listen('keydown', event => {
    if (!active) return;
    const actions = { ArrowLeft: () => orbit(-24, 0), ArrowRight: () => orbit(24, 0), ArrowUp: () => orbit(0, -20), ArrowDown: () => orbit(0, 20),
      '+': () => zoom(.9), '=': () => zoom(.9), '-': () => zoom(1.1), Home: () => { setCamera('overview', { immediate: reducedMotion }); options.onOrbit && options.onOrbit(); } };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  });
  const onContextLost = event => { event.preventDefault(); if (!disposed && options.onContextLost) options.onContextLost(); };
  listen('webglcontextlost', onContextLost);
  const win = host.ownerDocument.defaultView;
  if (win.ResizeObserver) { resizeObserver = new win.ResizeObserver(resize); resizeObserver.observe(host); }
  else { win.addEventListener('resize', resize); listeners.push(() => win.removeEventListener('resize', resize)); }
  resize(); setCamera('overview', { immediate: true }); selectObject('m2', { focus: false, immediate: true });

  return {
    update, frame, setCamera, selectObject, resize,
    setActive(value) { active = !!value; if (!active) { for (const id of pointers.keys()) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); pointers.clear(); pinchDistance = 0; } },
    setReducedMotion(value) { reducedMotion = !!value; if (reducedMotion && cameraTween) { camera.position.copy(cameraTween.toEye); target.copy(cameraTween.toTarget); cameraTween = null; } },
    snapshot() {
      return { revision: REVISION, disposed, active, frameCount, lastFrameTime, camera: cameraName, selectedObject: currentSelection,
        cameraPosition: camera.position.toArray(), cameraTarget: target.toArray(), cameraMoving: !!cameraTween,
        width: renderWidth, height: renderHeight, pixelRatio: renderer.getPixelRatio(),
        samplePosition: (current && current.phaseIndex === 4 ? recordMarker : materialMarker).position.toArray(), sampleKind: current && current.phaseIndex === 4 ? 'record' : 'material',
        drawCalls: disposed ? 0 : renderer.info.render.calls, geometries: geometries.size, materials: materials.size,
        textures: disposed ? 0 : renderer.info.memory.textures, gpuGeometries: disposed ? 0 : renderer.info.memory.geometries, authoredTextures: 0,
        resourceDisposals: { ...resourceDisposals }, pointerListeners: disposed ? 0 : listeners.length, resizeObserver: !!resizeObserver };
    },
    dispose() {
      if (disposed) return;
      disposed = true; active = false; cameraTween = null;
      freeResources();
    }
  };
  } catch (error) {
    disposed = true; active = false; freeResources(); throw error;
  }
}
