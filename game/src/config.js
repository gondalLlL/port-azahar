export const SAVE_KEY = 'port_azahar_save_v1';
export const STEP = 1 / 60;

export const WORLD_SIZE = 4800; // 4800x4800 px city grid (~36 blocks)
export const BLOCK_SIZE = 120;
export const ROAD_WIDTH = 48;

export const PLAYER_SPEED = 140; // px/sec on foot
export const SPRINT_MULT = 1.7;

export const CAR_PHYSICS = {
  accel: 300,
  maxSpeed: 420,
  reverseSpeed: 160,
  friction: 0.96,
  steerRate: 2.4,
  handbrakeFriction: 0.88
};

export const DISTRICTS = [
  { name: 'Docks', x: 200, y: 200, w: 1200, h: 1200, color: '#1e293b' },
  { name: 'Neon Mile', x: 1600, y: 200, w: 1400, h: 1400, color: '#31103f' },
  { name: 'Old Town', x: 3200, y: 200, w: 1400, h: 1400, color: '#2c221e' },
  { name: 'Marina', x: 200, y: 1600, w: 1400, h: 1400, color: '#0f2942' },
  { name: 'Hills', x: 1800, y: 3200, w: 2800, h: 1400, color: '#1a3322' }
];

export const MISSIONS = [
  {
    id: 1,
    title: "First Run",
    giver: "Marisol Kane",
    desc: "Pick up the package at the docks and deliver it across town before timer runs out.",
    target: { x: 800, y: 800, radius: 60 },
    reward: 1500
  },
  {
    id: 2,
    title: "Borrowed Wheels",
    giver: "Marisol Kane",
    desc: "Steal the marked azure sports car in Neon Mile and bring it to the chop shop garage.",
    target: { x: 2200, y: 800, radius: 70 },
    reward: 3000
  },
  {
    id: 3,
    title: "Heat",
    giver: "Marisol Kane",
    desc: "Provoke the police to 3-star wanted level and lose them, then reach the safehouse.",
    target: { x: 3800, y: 800, radius: 60 },
    reward: 5000
  },
  {
    id: 4,
    title: "Three Drops",
    giver: "Marisol Kane",
    desc: "Collect 3 cash drops around Marina and Old Town while police pressure mounts.",
    target: { x: 1000, y: 2400, radius: 60 },
    reward: 8000
  },
  {
    id: 5,
    title: "Last Boat",
    giver: "Marisol Kane",
    desc: "Escape to the Marina slipway and board the getaway boat to finish the story.",
    target: { x: 800, y: 2200, radius: 80 },
    reward: 15000
  }
];
