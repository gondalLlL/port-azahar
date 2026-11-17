import { STEP } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

export function stageShot(name, world) {
  world.reset();

  if (name === 'title') {
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'drive') {
    // Put player in a car mid-city
    const state = world.state;
    state.player.x = 2200;
    state.player.y = 2200;
    state.player.inCar = true;
    state.player.car = state.cars[0];
    state.cars[0].x = 2200;
    state.cars[0].y = 2200;
    state.cars[0].isPlayerCar = true;
    state.cars[0].speed = 180;
    for (let i = 0; i < 30; i++) {
      world.step(STEP, { x: 0, y: -1 }, false, false, 0, null);
    }
    return { screen: SCREEN_PLAY, best: state.player.cash };
  }

  if (name === 'chase') {
    // Put player in car with 3 stars wanted & police chasing
    const state = world.state;
    state.player.x = 2400;
    state.player.y = 2400;
    state.player.wanted = 3;
    state.player.inCar = true;
    state.player.car = state.cars[1];
    state.cars[1].x = 2400;
    state.cars[1].y = 2400;
    state.cars[1].isPlayerCar = true;
    state.cars[1].speed = 250;
    for (let i = 0; i < 40; i++) {
      world.step(STEP, { x: 1, y: 0 }, false, false, 0, null);
    }
    return { screen: SCREEN_PLAY, best: state.player.cash };
  }

  if (name === 'night') {
    // Neon Mile at night on foot near mission marker
    const state = world.state;
    state.player.x = 2200;
    state.player.y = 800;
    state.player.inCar = false;
    state.dayTime = 0.9; // Night
    state.missionIndex = 1;
    for (let i = 0; i < 15; i++) {
      world.step(STEP, { x: 0, y: 0 }, false, false, 0, null);
    }
    return { screen: SCREEN_PLAY, best: state.player.cash };
  }

  return { screen: SCREEN_TITLE, best: 0 };
}
