// One canvas = one shot: sky, two-tone light rig (camera-relative sun / moon frozen per shot), fog, clouds, the shot's
// set (sets.ts BUILD), its dynamic bits (POSE) and its cast + effect cards (STAGE). update() is a pure function of f.
import * as THREE from "three";
import { Batch, V, Kit } from "./build";
import { ctex, cloudHD } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, setLight, findSun, SUN } from "./cast";
import { FPS, SHOTS, ShotDef } from "./story";
import { camAt, fgAt } from "./cams";
import { pottedPalm, streetLamp, chair } from "./decor";
import { prop } from "./build";
import { BUILD, POSE, STAGE, SetBuild } from "./sets";

export const loadKit = () => Promise.resolve({} as Kit);

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** per-shot sun overrides (camera-relative degrees) */
/** outdoors the sun comes from behind the lens so house fronts and shopfronts are lit (backlit walls read flat violet) */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = Object.fromEntries([...[1, 3, 4, 5, 6, 8, 9, 10, 14, 15, 16, 17, 18, 20, 21, 22, 23, 27].map((i) => [i, { az: 150, el: 48 }]), ...[24, 25, 26].map((i) => [i, { az: 150, el: 30 }])]);
/** interiors: warm key from behind-right of the lens so walls are lit and the cast throws shadows onto wall and floor */
const INDOOR = new Set(["council"]);
const INT: LightPreset = { ...LIGHTS.day, az: 148, el: 38, lit: [1.6, 1.42, 1.16], shade: [0.56, 0.46, 0.42], lift: [0.09, 0.065, 0.05], actorShadow: true, sunCol: "#ffe2b8",
  charTint: [1.0, 0.95, 0.88] };
const CELL: LightPreset = { ...INT, lit: [1.25, 1.3, 1.42], shade: [0.2, 0.22, 0.3], lift: [0.04, 0.05, 0.08], sunCol: "#d8e4ff", charTint: [0.9, 0.94, 1.0] };
const lightOf = (s: ShotDef) => (s.light === "day" && INDOOR.has(s.set) ? INT : LIGHTS[s.light]);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private sunV: THREE.Vector3 | null = null;
  private clouds: THREE.Mesh[] = [];
  private set: SetBuild;
  private fg = new THREE.Group();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  readonly s: ShotDef;

  constructor(kit: Kit, readonly id: number) {
    const R = this.root, s = (this.s = SHOTS[id - 1]);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK); this.sunDisc.renderOrder = -0.5; R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    if (s.light !== "night") {
      const maps = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[s.light].cloud));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3, d = 700 + (i % 3) * 70;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: maps[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
        const w = 150 + (i % 4) * 35;
        m.position.set(Math.cos(a) * d, 130 + (i % 4) * 40, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
        m.layers.set(NOINK); this.clouds.push(m); R.add(m);
      }
    }
    const b = new Batch();
    this.set = { b, root: R, kit, dyn: {} };
    BUILD[s.set](this.set);
    b.build(R);
    // foreground framing element (cams.ts fgAt): a set-appropriate object placed beside the lens, defocused by the DOF
    const fb = new Batch();
    pottedPalm(fb, 0, 0, 1.15);
    fb.build(this.fg, false);
    this.fg.visible = false; R.add(this.fg);
  }

  /** camera-relative sun / moon, frozen per shot: mean view direction turned by az toward screen right, lifted by el */
  private shotSun(L: LightPreset) {
    if (this.sunV) return this.sunV;
    const s = this.s;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(this.id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[this.id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[this.id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    return (this.sunV = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize());
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = this.s, L = lightOf(s), K = LOOK[s.light];
    const c = camAt(this.id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    const fs = fgAt(this.id, f);
    this.fg.visible = fs !== 0;
    if (fs) { // on the floor ~1.3 m ahead, near the frame edge on side fs (fixed per setup, so it parallaxes with the move)
      const fx = c.look[0] - c.pos[0], fz = c.look[2] - c.pos[2], n = Math.hypot(fx, fz) || 1, ux = fx / n, uz = fz / n;
      const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * 9 / 16), dd = 1.6, lat = dd * Math.tan(hf * 0.97);
      this.fg.position.set(c.pos[0] + ux * dd - uz * lat * fs, 0, c.pos[2] + uz * dd + ux * lat * fs);
      this.fg.rotation.y = f * 0.0; this.fg.updateMatrixWorld(true);
    }
    cam.layers.enable(NOINK);
    // light rig
    const sunDir = this.shotSun(L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 110) * (s.light === "golden" ? 1.6 : 1);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // sky + fog + sun disc + clouds
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    const wide = [1.8, 1.8];
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear * wide[0]; this.fog.far = L.fogFar * wide[1];
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden";
    if (this.sunDisc.visible) { this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 1200); this.sunDisc.scale.setScalar(2 * 1200 * Math.tan(THREE.MathUtils.degToRad(1.7))); }
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    POSE[s.set]?.(this.set, t, this.id);
    // cast + effects
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), up = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 1);
    setLight(s.light);
    const info = { pos: cam.position, right, up, sun: sunDir };
    findSun(info, SUN);
    const st = { places: [], fx: [] } as Parameters<(typeof STAGE)[1]>[0]["out"];
    STAGE[this.id]({ cam: info, t: Math.floor(f / 2) * 2 / FPS, out: st }); // characters + effects on twos
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 2.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const fxm = this.fx(fi++);
      fxm.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      fxm.use(!!p.soft, p.glow ?? 1);
      const fogOn = p.w < 60;
      if (fxm.mat.fog !== fogOn) { fxm.mat.fog = fxm.soft.fog = fogOn; fxm.mat.needsUpdate = fxm.soft.needsUpdate = true; }
      fxm.mesh.visible = true;
      fxm.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) fxm.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.yaw !== undefined) fxm.mesh.rotation.set(0, p.yaw, p.rot ?? 0);
      else { fxm.mesh.quaternion.copy(cam.quaternion); fxm.mesh.rotateZ(p.rot ?? 0); }
      fxm.mesh.scale.set(p.w, p.h, 1);
      fused.push(fxm);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
