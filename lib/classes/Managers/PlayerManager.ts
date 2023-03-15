import type Player from '../Core/Player';

let player: Player | undefined;

export function getMain() {
  return player;
}

export function setMain(instance: Player): void {
  player = instance;
}
