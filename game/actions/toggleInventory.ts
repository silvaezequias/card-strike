import { GameState } from "../game-types";

export const ActionToggleInventory = (state: GameState): GameState => ({
  ...state,
  hud: {
    inventory: {
      ...state.hud.inventory,
      isOpen: state.hud.inventory.isLocked
        ? state.hud.inventory.isOpen
        : !state.hud.inventory.isOpen,
    },
  },
});
