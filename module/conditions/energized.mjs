import { SYSTEM_ID } from '../helpers/constants.mjs';

export async function handleEnergizedApplication(effect) {
  const actor = effect.parent;
  
  // Update the effect to include the Energized bonuses
  await effect.update({
    label: "Energized",
    changes: [
      {
        key: "system.attributes.move.running.value",
        value: 3,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        priority: 20
      },
      {
        key: "system.dodge.bonus",
        value: 1,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        priority: 20
      }
    ],
    flags: {
      [SYSTEM_ID]: {
        isEnergized: true
      }
    }
  });
}

// Register the hook to handle Energized effect application
Hooks.on('createActiveEffect', async (effect, options, userId) => {
  if (effect.label === "Energized" && game.user.id === userId) {
    await handleEnergizedApplication(effect);
  }
});