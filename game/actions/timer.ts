import { GameState } from "../game-types";

export const ActionTimer = (state: GameState) => ({
  ...state,
  countdown: {
    ...state.countdown,
    gameTime: state.countdown.gameTime + 1,
    seconds: state.countdown.seconds > 0 ? state.countdown.seconds - 1 : 0,
  },
});
