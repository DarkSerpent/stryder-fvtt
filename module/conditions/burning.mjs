import { SYSTEM_ID } from '../helpers/constants.mjs';

export async function handleBurningApplication(effect) {
  const actor = effect.parent;
  
  // Check if actor is already Soaked
  const isSoaked = actor.effects.find(e => e.label === "Soaked");
  if (isSoaked) {
    ui.notifications.error(`${actor.name} is Soaked and cannot become Burning!`);
    await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
    return;
  }

  // Update the effect to mark it as Burning
  await effect.update({
    label: "Burning",
    changes: [],
    flags: {
      [SYSTEM_ID]: {
        isBurning: true
      }
    }
  });
}

export async function handleBurningDamage(combatant) {
  const actor = combatant.actor;
  if (!actor) return;

  // Check if burning damage has already been applied this turn
  const hasTakenBurningDamage = combatant.getFlag(SYSTEM_ID, "hasTakenBurningDamage");
  if (hasTakenBurningDamage) return;

  // Find burning effect
  const burningEffect = actor.effects.find(e => e.label === "Burning");
  if (!burningEffect || actor.system.health.value <= 0) return;

  // Apply 3 damage
  const damage = Math.min(3, actor.system.health.value);

  if (damage <= 0) return;

  // Set flag to indicate burning damage has been applied this turn
  await combatant.setFlag(SYSTEM_ID, "hasTakenBurningDamage", true);

  // Apply damage
  await actor.update({
    "system.health.value": Math.max(0, actor.system.health.value - damage)
  });

  // Check for unconsciousness
  if (actor.system.health.value <= 0 && !actor.effects.find(e => e.label === "Unconscious")) {
    await actor.createEmbeddedDocuments('ActiveEffect', [{
      label: "Unconscious",
      icon: "systems/stryder/assets/status/unconscious.svg",
      disabled: false
    }]);
  }

  // Send damage message only if damage was dealt
  if (damage > 0) {
    const messageContent = `
    <div class="chat-message-card">
      <div class="chat-message-header">
        <h3 class="chat-message-title">${actor.name} took ${damage} damage from <strong>Burning</strong></h3>
      </div>
      
      <div class="chat-message-details">
        <div class="chat-message-detail-row">
          <span class="chat-message-detail-label">Damage Type:</span>
          <span class="chat-damage-type-box">Persistent</span>
        </div>
      </div>
      
      <div class="chat-message-footer">
        <div class="bleeding-undo-container">
          <i class="fas fa-undo-alt bleeding-undo" data-actor-id="${actor.id}" data-damage="${damage}" title="Undo Damage"></i>
          <span>Click to undo</span>
        </div>
      </div>
    </div>
    `;

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({actor}),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }
}

export async function handleBurningMaxHealthReduction(combatant) {
  const actor = combatant.actor;
  if (!actor) return;

  // Find burning effect
  const burningEffect = actor.effects.find(e => e.label === "Burning");
  if (!burningEffect) return;

  // Get current burning health reduction
  const currentReduction = actor.getFlag(SYSTEM_ID, "burningHealthReduction") || 0;
  
  // Increase reduction by 1
  const newReduction = currentReduction + 1;
  await actor.setFlag(SYSTEM_ID, "burningHealthReduction", newReduction);

  // Send notification
  const messageContent = `
  <div class="chat-message-card">
    <div class="chat-message-header">
      <h3 class="chat-message-title">${actor.name}'s maximum Health reduced by 1 from <strong>Burning</strong></h3>
    </div>
    
    <div class="chat-message-details">
      <div class="chat-message-detail-row">
        <span class="chat-message-detail-label">Total Health Lost:</span>
        <span class="chat-health-box">${newReduction}</span>
      </div>
    </div>
  </div>
  `;

  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor}),
    content: messageContent,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
}

// Hook to check for Soaked condition application
Hooks.on('createActiveEffect', async (effect, options, userId) => {
  if (effect.label === "Soaked" && game.user.id === userId) {
    const actor = effect.parent;
    const burningEffect = actor.effects.find(e => e.label === "Burning");
    if (burningEffect) {
      await actor.deleteEmbeddedDocuments('ActiveEffect', [burningEffect.id]);
      ui.notifications.info(`${actor.name} is now Soaked - Burning condition removed!`);
    }
  }
});

// Add these hooks to trigger burning effects
Hooks.on('updateCombat', async (combat, updateData, options, userId) => {
  // Only process on turn change for the current user
  if (updateData.turn !== undefined && game.user.id === userId) {
    const combatant = combat.combatants.get(combat.current.combatantId);
    if (combatant) {
      await handleBurningDamage(combatant);
    }
  }
});