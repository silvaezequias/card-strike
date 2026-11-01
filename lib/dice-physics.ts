import {
  Body,
  Box,
  ContactMaterial,
  Material,
  Plane,
  Quaternion,
  Vec3,
  World,
} from "cannon-es";

/* ═══════════════════════════════════════════════
   FÍSICA DO DADO
   A jogada inteira é simulada de uma vez e gravada
   quadro a quadro. Depois o dado é girado por dentro
   para a face sorteada ser a que parou virada para
   cima, então a física decide só o caminho.
   Unidades de entrada e saída: pixels do tabuleiro.
   ═══════════════════════════════════════════════ */

export const DIE_SIZE = 76;

type Point3 = { x: number; y: number; z: number };

export type DiceFrame = Point3 & { q: [number, number, number, number] };

export type DiceBounds = { x0: number; y0: number; x1: number; y1: number };

export type DiceThrow = {
  frames: DiceFrame[];
  /** Quadros em que o dado bate na mesa com força (para o som). */
  hits: number[];
};

export const DICE_FPS = 60;
const STEP = 1 / DICE_FPS;
const MAX_FRAMES = DICE_FPS * 4;
const QUIET_FRAMES = 12;
const SETTLE_FRAMES = 14;
const REST_SPEED = 0.12;
const HIT_SPEED = 3;
const HIT_GAP_FRAMES = 7; // um impacto gera vários contatos seguidos

// A simulação usa meia aresta como unidade, onde a biblioteca é mais estável.
const UNIT = DIE_SIZE / 2;
const GRAVITY = 70;
const SPIN = 22;

/** Normal da face de cada número, no dado. Faces opostas somam 7. */
export const FACE_NORMALS: Record<number, Vec3> = {
  1: new Vec3(0, 0, 1),
  6: new Vec3(0, 0, -1),
  3: new Vec3(1, 0, 0),
  4: new Vec3(-1, 0, 0),
  2: new Vec3(0, 1, 0),
  5: new Vec3(0, -1, 0),
};

const randomSpin = () => (Math.random() - 0.5) * 2 * SPIN;

const wall = (material: Material, position: Vec3, normal: Vec3) => {
  const body = new Body({ mass: 0, material, shape: new Plane() });
  body.position.copy(position);
  body.quaternion.setFromVectors(new Vec3(0, 0, 1), normal);
  return body;
};

/** Número que ficou virado para cima na orientação dada. */
const topFace = (quaternion: Quaternion) => {
  let top = 1;
  let highest = -Infinity;
  for (const [value, normal] of Object.entries(FACE_NORMALS)) {
    const height = quaternion.vmult(normal).z;
    if (height > highest) {
      highest = height;
      top = Number(value);
    }
  }
  return top;
};

export const simulateThrow = ({
  start,
  velocity,
  bounds,
  value,
}: {
  start: Point3;
  velocity: Point3;
  bounds: DiceBounds;
  value: number;
}): DiceThrow => {
  const table = new Material("table");
  const die = new Material("die");

  const world = new World({ gravity: new Vec3(0, 0, -GRAVITY) });
  world.addContactMaterial(new ContactMaterial(table, die, { friction: 0.32, restitution: 0.42 }));

  world.addBody(wall(table, new Vec3(0, 0, 0), new Vec3(0, 0, 1)));
  world.addBody(wall(table, new Vec3(bounds.x0 / UNIT, 0, 0), new Vec3(1, 0, 0)));
  world.addBody(wall(table, new Vec3(bounds.x1 / UNIT, 0, 0), new Vec3(-1, 0, 0)));
  world.addBody(wall(table, new Vec3(0, bounds.y0 / UNIT, 0), new Vec3(0, 1, 0)));
  world.addBody(wall(table, new Vec3(0, bounds.y1 / UNIT, 0), new Vec3(0, -1, 0)));

  const body = new Body({
    mass: 1,
    material: die,
    shape: new Box(new Vec3(1, 1, 1)),
    position: new Vec3(start.x / UNIT, start.y / UNIT, start.z / UNIT),
    velocity: new Vec3(velocity.x / UNIT, velocity.y / UNIT, velocity.z / UNIT),
    angularVelocity: new Vec3(randomSpin(), randomSpin(), randomSpin()),
    angularDamping: 0.12,
    linearDamping: 0.04,
  });
  body.quaternion.setFromEuler(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  world.addBody(body);

  const frames: { position: Vec3; quaternion: Quaternion }[] = [];
  const hits: number[] = [];
  body.addEventListener("collide", (event: { contact: { getImpactVelocityAlongNormal: () => number } }) => {
    const impact = Math.abs(event.contact.getImpactVelocityAlongNormal());
    const lastHit = hits[hits.length - 1] ?? -HIT_GAP_FRAMES;
    if (impact > HIT_SPEED && frames.length - lastHit >= HIT_GAP_FRAMES) hits.push(frames.length);
  });

  let quiet = 0;
  while (frames.length < MAX_FRAMES && quiet < QUIET_FRAMES) {
    world.step(STEP);
    frames.push({ position: body.position.clone(), quaternion: body.quaternion.clone() });
    const resting = body.velocity.length() + body.angularVelocity.length() < REST_SPEED;
    quiet = resting ? quiet + 1 : 0;
  }

  // Encostado na borda ele pode parar torto: assenta reto na mesa.
  const landed = topFace(body.quaternion);
  const lifted = body.quaternion.vmult(FACE_NORMALS[landed]);
  const flat = new Quaternion().setFromVectors(lifted, new Vec3(0, 0, 1)).mult(body.quaternion);
  const rest = body.position.clone();
  for (let i = 1; i <= SETTLE_FRAMES; i++) {
    const t = i / SETTLE_FRAMES;
    frames.push({
      position: new Vec3(rest.x, rest.y, rest.z + (1 - rest.z) * t),
      quaternion: body.quaternion.slerp(flat, t),
    });
  }

  // Gira o dado por dentro: o número sorteado assume o lugar da face de cima.
  const correction = new Quaternion().setFromVectors(FACE_NORMALS[value], FACE_NORMALS[landed]);

  return {
    hits,
    frames: frames.map(({ position, quaternion }) => {
      const q = quaternion.mult(correction);
      return {
        x: position.x * UNIT,
        y: position.y * UNIT,
        z: position.z * UNIT,
        q: [q.x, q.y, q.z, q.w],
      };
    }),
  };
};

/** Transforma a orientação do dado em matrix3d do CSS. */
export const quaternionToMatrix = ([x, y, z, w]: DiceFrame["q"]) =>
  [
    1 - 2 * (y * y + z * z),
    2 * (x * y + z * w),
    2 * (x * z - y * w),
    0,
    2 * (x * y - z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z + x * w),
    0,
    2 * (x * z + y * w),
    2 * (y * z - x * w),
    1 - 2 * (x * x + y * y),
    0,
    0,
    0,
    0,
    1,
  ].join(",");
