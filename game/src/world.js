import { WORLD_SIZE, BLOCK_SIZE, ROAD_WIDTH, DISTRICTS, MISSIONS, SAVE_KEY, CAR_PHYSICS, PLAYER_SPEED, SPRINT_MULT } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_MISSION = 1;
export const EVENT_WANTED = 2;
export const EVENT_DEATH = 4;

export function createWorld(rng) {
  // Generate city buildings and layout
  const buildings = [];
  const peds = [];
  const cars = [];
  const police = [];
  const bullets = [];
  const particles = [];
  const drops = [];

  const gridCount = Math.floor(WORLD_SIZE / BLOCK_SIZE);
  for (let gx = 0; gx < gridCount; gx++) {
    for (let gy = 0; gy < gridCount; gy++) {
      const bx = gx * BLOCK_SIZE + ROAD_WIDTH;
      const by = gy * BLOCK_SIZE + ROAD_WIDTH;
      const bw = BLOCK_SIZE - ROAD_WIDTH;
      const bh = BLOCK_SIZE - ROAD_WIDTH;
      if (bw <= 0 || bh <= 0) continue;
      
      // Don't build everywhere, leave some parks/water
      const distVal = rng.next();
      if (distVal > 0.15) {
        let district = 'Neon Mile';
        let cx = bx + bw/2;
        let cy = by + bh/2;
        for (const d of DISTRICTS) {
          if (cx >= d.x && cx <= d.x + d.w && cy >= d.y && cy <= d.y + d.h) {
            district = d.name;
          }
        }
        
        buildings.push({
          x: bx + 6,
          y: by + 6,
          w: bw - 12,
          h: bh - 12,
          height: rng.range(30, 160),
          color: district === 'Docks' ? '#334155' : district === 'Neon Mile' ? '#4c1d95' : district === 'Old Town' ? '#451a03' : '#1e3a8a',
          district,
          windowsLit: rng.next() > 0.3
        });
      }
    }
  }

  // Spawn initial traffic cars and parked cars
  for (let i = 0; i < 35; i++) {
    cars.push({
      x: rng.range(400, WORLD_SIZE - 400),
      y: rng.range(400, WORLD_SIZE - 400),
      vx: rng.range(-60, 60),
      vy: rng.range(-60, 60),
      angle: rng.range(0, Math.PI * 2),
      speed: rng.range(80, 200),
      color: rng.choice(['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#e11d48']),
      isPlayerCar: false,
      health: 100
    });
  }

  // Spawn pedestrians
  for (let i = 0; i < 50; i++) {
    peds.push({
      x: rng.range(200, WORLD_SIZE - 200),
      y: rng.range(200, WORLD_SIZE - 200),
      vx: rng.range(-20, 20),
      vy: rng.range(-20, 20),
      fleeing: false,
      health: 30
    });
  }

  let audioCtx = null;
  let muted = false;

  function initAudio() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (muted || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'gunshot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'siren') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.2);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'pickup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'crash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio context error ignore
    }
  }

  const state = {
    player: {
      x: 2400,
      y: 2400,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0,
      health: 100,
      armor: 50,
      cash: 2500,
      wanted: 0,
      bustedMeter: 0,
      inCar: false,
      car: null,
      weapon: 'pistol',
      ammo: 50
    },
    missionIndex: 0,
    missionTimer: 180,
    missionActive: true,
    dialogue: { text: "Welcome to Port Azahar. Meet Marisol Kane at the Docks.", timer: 6 },
    dayTime: 0.3, // 0 to 1 (night at 0.8-0.2)
    busted: false,
    wasted: false,
    savedMessageTimer: 0,
    buildings,
    peds,
    cars,
    police,
    bullets,
    particles,
    drops
  };

  function checkCollision(x, y, radius) {
    for (const b of buildings) {
      if (x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h) {
        return true;
      }
    }
    return false;
  }

  return {
    state,
    reset() {
      state.player.x = 2400;
      state.player.y = 2400;
      state.player.health = 100;
      state.player.armor = 50;
      state.player.cash = 2500;
      state.player.wanted = 0;
      state.player.bustedMeter = 0;
      state.player.inCar = false;
      state.player.car = null;
      state.missionIndex = 0;
      state.missionTimer = 180;
      state.missionActive = true;
      state.busted = false;
      state.wasted = false;
      state.dialogue = { text: "Marisol: 'Get to work, Dario. First run is waiting.'", timer: 8 };
    },
    save() {
      try {
        const data = {
          player: state.player,
          missionIndex: state.missionIndex,
          cash: state.player.cash
        };
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        state.savedMessageTimer = 3;
      } catch {
        // Storage fail ignored
      }
    },
    load() {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.player) Object.assign(state.player, data.player);
          if (typeof data.missionIndex === 'number') state.missionIndex = data.missionIndex;
        }
      } catch {
        // Load fail ignored
      }
    },
    step(dt, inputAxis, sprinting, handbrake, actions, mouse) {
      if (state.busted || state.wasted) return EVENT_NONE;

      initAudio();
      state.dayTime = (state.dayTime + dt * 0.005) % 1;
      if (state.savedMessageTimer > 0) state.savedMessageTimer -= dt;
      if (state.dialogue.timer > 0) state.dialogue.timer -= dt;

      const p = state.player;

      // Mission progress check
      const m = MISSIONS[state.missionIndex];
      if (m && state.missionActive) {
        state.missionTimer -= dt;
        const dx = p.x - m.target.x;
        const dy = p.y - m.target.y;
        if (Math.hypot(dx, dy) < m.target.radius) {
          p.cash += m.reward;
          playSound('pickup');
          state.dialogue = { text: `Mission "${m.title}" Completed! +$${m.reward}`, timer: 6 };
          state.missionIndex++;
          if (state.missionIndex >= MISSIONS.length) {
            state.dialogue = { text: "Story Complete! You own Port Azahar now.", timer: 15 };
            state.missionIndex = MISSIONS.length - 1;
          } else {
            state.missionTimer = 240;
          }
          this.save();
        } else if (state.missionTimer <= 0) {
          state.dialogue = { text: `Mission Failed. Time ran out.`, timer: 6 };
          state.missionTimer = 180;
        }
      }

      // Enter/Exit Car (E or F key action)
      if (actions & 4) { // INTERACT
        if (p.inCar) {
          // Exit car
          p.x = p.car.x + 40;
          p.y = p.car.y;
          p.inCar = false;
          p.car = null;
        } else {
          // Find closest car
          let closest = null;
          let minDist = 60;
          for (const c of cars) {
            const dist = Math.hypot(c.x - p.x, c.y - p.y);
            if (dist < minDist) {
              minDist = dist;
              closest = c;
            }
          }
          if (closest) {
            p.inCar = true;
            p.car = closest;
            closest.isPlayerCar = true;
            if (p.wanted === 0) p.wanted = 1; // Carjacking raises wanted
            playSound('pickup');
          }
        }
      }

      // Combat: Shoot pistol (Left click or action)
      if (actions & 16) { // SHOOT
        if (p.ammo > 0) {
          p.ammo--;
          playSound('gunshot');
          bullets.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(p.angle) * 700,
            vy: Math.sin(p.angle) * 700,
            life: 1.0,
            isPlayer: true
          });
          if (p.wanted < 2) p.wanted = 2;
        }
      }

      // Player Movement
      if (p.inCar) {
        const car = p.car;
        // Steering
        if (inputAxis.x !== 0) {
          car.angle += inputAxis.x * CAR_PHYSICS.steerRate * dt * (car.speed / CAR_PHYSICS.maxSpeed);
        }
        // Acceleration / Braking
        if (inputAxis.y < 0) {
          car.speed = Math.min(CAR_PHYSICS.maxSpeed, car.speed + CAR_PHYSICS.accel * dt);
        } else if (inputAxis.y > 0) {
          car.speed = Math.max(-CAR_PHYSICS.reverseSpeed, car.speed - CAR_PHYSICS.accel * dt);
        } else {
          car.speed *= CAR_PHYSICS.friction;
        }

        if (handbrake) {
          car.speed *= CAR_PHYSICS.handbrakeFriction;
          particles.push({ x: car.x, y: car.y, life: 0.5, color: '#666' });
        }

        car.vx = Math.cos(car.angle) * car.speed;
        car.vy = Math.sin(car.angle) * car.speed;
        
        let nextX = car.x + car.vx * dt;
        let nextY = car.y + car.vy * dt;

        if (!checkCollision(nextX, nextY, 24)) {
          car.x = nextX;
          car.y = nextY;
        } else {
          car.speed *= -0.3;
          playSound('crash');
          if (Math.abs(car.speed) > 150) p.health -= 5;
        }

        p.x = car.x;
        p.y = car.y;
        p.angle = car.angle;
      } else {
        // On foot movement
        const spd = PLAYER_SPEED * (sprinting ? SPRINT_MULT : 1);
        let vx = inputAxis.x * spd;
        let vy = inputAxis.y * spd;
        if (inputAxis.x !== 0 && inputAxis.y !== 0) {
          vx *= 0.7071;
          vy *= 0.7071;
        }
        
        const nextX = p.x + vx * dt;
        const nextY = p.y + vy * dt;

        if (!checkCollision(nextX, p.y, 16)) p.x = nextX;
        if (!checkCollision(p.x, nextY, 16)) p.y = nextY;

        if (inputAxis.x !== 0 || inputAxis.y !== 0) {
          p.angle = Math.atan2(inputAxis.y, inputAxis.x);
        } else if (mouse) {
          p.angle = Math.atan2(mouse.y - WORLD_SIZE/2, mouse.x - WORLD_SIZE/2);
        }
      }

      // Traffic AI update
      for (const c of cars) {
        if (c.isPlayerCar) continue;
        c.x += Math.cos(c.angle) * c.speed * dt;
        c.y += Math.sin(c.angle) * c.speed * dt;
        if (c.x < 100 || c.x > WORLD_SIZE - 100 || c.y < 100 || c.y > WORLD_SIZE - 100 || rng.next() < 0.02) {
          c.angle += rng.range(-Math.PI/2, Math.PI/2);
          c.speed = rng.range(60, 180);
        }
      }

      // Pedestrian AI update
      for (const ped of peds) {
        const distToPlayer = Math.hypot(p.x - ped.x, p.y - ped.y);
        if (p.wanted > 0 || distToPlayer < 80) {
          ped.fleeing = true;
          const ang = Math.atan2(ped.y - p.y, ped.x - p.x);
          ped.vx = Math.cos(ang) * 90;
          ped.vy = Math.sin(ang) * 90;
        } else {
          if (rng.next() < 0.02) {
            ped.vx = rng.range(-25, 25);
            ped.vy = rng.range(-25, 25);
          }
        }
        ped.x += ped.vx * dt;
        ped.y += ped.vy * dt;
      }

      // Police & Wanted mechanics
      if (p.wanted > 0) {
        if (rng.next() < 0.02 * p.wanted && police.length < p.wanted * 3) {
          police.push({
            x: p.x + rng.range(-600, 600),
            y: p.y + rng.range(-600, 600),
            speed: 240,
            angle: 0
          });
          playSound('siren');
        }

        for (const cop of police) {
          const dx = p.x - cop.x;
          const dy = p.y - cop.y;
          const dist = Math.hypot(dx, dy);
          cop.angle = Math.atan2(dy, dx);
          cop.x += Math.cos(cop.angle) * cop.speed * dt;
          cop.y += Math.sin(cop.angle) * cop.speed * dt;

          if (dist < 35) {
            p.health -= dt * 25;
            p.bustedMeter += dt * 0.4;
            if (p.bustedMeter >= 1.0) {
              state.busted = true;
              state.dialogue = { text: "BUSTED! You were arrested by the police.", timer: 10 };
            }
          }
        }
      } else {
        p.bustedMeter = Math.max(0, p.bustedMeter - dt * 0.5);
      }

      // Bullets update
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || checkCollision(b.x, b.y, 4)) {
          bullets.splice(i, 1);
        }
      }

      // Check player death
      if (p.health <= 0) {
        state.wasted = true;
        state.dialogue = { text: "WASTED. Hospital bill paid.", timer: 10 };
        return EVENT_DEATH;
      }

      return p.wanted > 0 ? EVENT_WANTED : EVENT_NONE;
    }
  };
}
