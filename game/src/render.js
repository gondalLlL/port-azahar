import { WORLD_SIZE, MISSIONS } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  return {
    draw(state, screen, bestScore) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (screen === SCREEN_TITLE) {
        // Draw title screen background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("PORT AZAHAR", canvas.width / 2, 220);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '24px system-ui, sans-serif';
        ctx.fillText("Open World Crime Saga", canvas.width / 2, 270);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px system-ui, sans-serif';
        ctx.fillText("Story: Dario Venn & Marisol Kane", canvas.width / 2, 330);
        ctx.fillText("Controls: WASD / Arrows to Move/Drive | Shift to Sprint | E/F to Enter/Exit Car", canvas.width / 2, 370);
        ctx.fillText("Left Click to Shoot Pistol | Space for Handbrake / Confirm", canvas.width / 2, 410);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText("Press SPACE or CLICK to Start", canvas.width / 2, 520);
        return;
      }

      // In-game rendering with camera centered on player
      const p = state.player;
      const camX = p.x - canvas.width / 2;
      const camY = p.y - canvas.height / 2;

      ctx.save();
      ctx.translate(-camX, -camY);

      // Background ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Roads grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 48;
      for (let i = 0; i <= WORLD_SIZE; i += 120) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, WORLD_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(WORLD_SIZE, i);
        ctx.stroke();
      }

      // Buildings with pseudo-height shadows
      for (const b of state.buildings) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(b.x + 15, b.y + 15, b.w, b.h);

        // Building base
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Roof / 3D top
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);

        // Lit windows
        if (b.windowsLit && state.dayTime > 0.7 || state.dayTime < 0.2) {
          ctx.fillStyle = '#fde047';
          for (let wx = b.x + 16; wx < b.x + b.w - 16; wx += 20) {
            ctx.fillRect(wx, b.y + 16, 8, 12);
            ctx.fillRect(wx, b.y + b.h - 28, 8, 12);
          }
        }
      }

      // Mission target marker
      const m = MISSIONS[state.missionIndex];
      if (m && state.missionActive) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(m.target.x, m.target.y, m.target.radius + Math.sin(performance.now() * 0.01) * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(`🎯 Target: ${m.title}`, m.target.x - 50, m.target.y - m.target.radius - 12);
      }

      // Traffic Cars
      for (const c of state.cars) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.fillStyle = c.color;
        ctx.fillRect(-20, -12, 40, 24);
        // Windshield
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(-4, -10, 12, 20);
        ctx.restore();
      }

      // Police Cars
      for (const cop of state.police) {
        ctx.save();
        ctx.translate(cop.x, cop.y);
        ctx.rotate(cop.angle);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-22, -13, 44, 26);
        ctx.fillStyle = Math.floor(performance.now() * 0.02) % 2 === 0 ? '#ef4444' : '#3b82f6';
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }

      // Pedestrians
      for (const ped of state.peds) {
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(ped.x, ped.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bullets
      ctx.fillStyle = '#fef08a';
      for (const b of state.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.inCar) {
        ctx.rotate(p.angle);
        ctx.fillStyle = p.car ? p.car.color : '#3b82f6';
        ctx.fillRect(-24, -14, 48, 28);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(-6, -11, 14, 22);
      } else {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        // Direction line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore(); // Restore camera translation

      // Day/Night tint overlay
      if (state.dayTime > 0.75 || state.dayTime < 0.25) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // HUD OVERLAYS
      // Health & Armor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, 20, 260, 90);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(20, 20, 260, 90);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, 30, (p.health / 100) * 240, 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`HEALTH: ${Math.max(0, Math.round(p.health))}`, 36, 43);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(30, 54, (p.armor / 100) * 240, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(`ARMOR: ${Math.round(p.armor)}`, 36, 67);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`$${p.cash.toLocaleString()}`, 30, 96);

      // Wanted Stars
      ctx.fillStyle = '#f59e0b';
      ctx.font = '20px system-ui, sans-serif';
      let starsStr = '';
      for (let i = 0; i < 5; i++) {
        starsStr += i < p.wanted ? '★ ' : '☆ ';
      }
      ctx.fillText(starsStr, canvas.width - 180, 45);

      // Mission & Objective Banner
      if (m && state.missionActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 250, 20, 500, 70);
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(canvas.width / 2 - 250, 20, 500, 70);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`MISSION ${m.id}/5: ${m.title.toUpperCase()}`, canvas.width / 2, 42);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(m.desc, canvas.width / 2, 64);

        const dist = Math.round(Math.hypot(p.x - m.target.x, p.y - m.target.y));
        const timeSec = Math.max(0, Math.round(state.missionTimer));
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Distance: ${dist}m | Time Left: ${timeSec}s`, canvas.width / 2, 82);
        ctx.textAlign = 'left';
      }

      // Dialogue Banner
      if (state.dialogue.timer > 0) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(canvas.width / 2 - 350, canvas.height - 100, 700, 60);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(canvas.width / 2 - 350, canvas.height - 100, 700, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.dialogue.text, canvas.width / 2, canvas.height - 64);
        ctx.textAlign = 'left';
      }

      // MINIMAP
      const mapSize = 160;
      const mapX = canvas.width - mapSize - 20;
      const mapY = canvas.height - mapSize - 20;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(mapX, mapY, mapSize, mapSize);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(mapX, mapY, mapSize, mapSize);

      ctx.save();
      ctx.beginPath();
      ctx.rect(mapX, mapY, mapSize, mapSize);
      ctx.clip();

      const scaleMap = mapSize / WORLD_SIZE;
      // Draw player on minimap
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(mapX + p.x * scaleMap, mapY + p.y * scaleMap, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw mission target on minimap
      if (m && state.missionActive) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(mapX + m.target.x * scaleMap, mapY + m.target.y * scaleMap, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Overlays for Pause / Busted / Wasted
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px system-ui, sans-serif';
        ctx.fillText("Press P or ESC to Resume", canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
      } else if (state.busted) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("BUSTED", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
      } else if (state.wasted) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("WASTED", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText("Press SPACE to Respawn", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
      }
    }
  };
}
