import { SYSTEM_ID } from '../helpers/constants.mjs';

export async function handleBleedingWoundApplication(effect) {
  const actor = effect.parent;
  
  // Check for Aegis/Ward protection
  if (actor.system.aegis?.value > 0 ) {
    ui.notifications.error(`${actor.name} cannot receive Bleeding Wounds because they have positive Aegis!`);
    await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
    return;
  }

  // Show stage selection dialog
  const stages = [1, 2, 3, 4, 5];
  const content = `
    <div class="bleeding-wound-dialog">
      <p>Select Bleeding Wound Stage:</p>
      <div class="stage-buttons">
        ${stages.map(stage => `
          <button class="stage-button" data-stage="${stage}">
            <strong>Stage ${stage}</strong> (${stage} Damage)
          </button>
        `).join('')}
      </div>
    </div>
  `;

  new Dialog({
    title: "Bleeding Wound Application",
    content,
    buttons: {},
    default: "cancel",
    close: () => actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
  }).render(true);

  // Handle stage selection
	$(document).on('click', '.stage-button', async (event) => {
	  const stage = parseInt(event.currentTarget.dataset.stage);
	  console.log(`Applying Bleeding Wound Stage ${stage} to ${actor.name}`);
	  await effect.update({
		label: `Bleeding Wound (Stage ${stage})`,
		changes: [],
		flags: {
		  [SYSTEM_ID]: {
			bleedingStage: stage
		  }
		}
	  });
	  console.log(`Effect flags:`, effect.flags);
	  $('.dialog').remove();
	});
}

export async function handleBleedingWoundDamage(combatant) {
  const actor = combatant.actor;
  if (!actor) return;

  // Check if bleeding damage has already been applied this turn
  const hasTakenBleedingDamage = combatant.getFlag(SYSTEM_ID, "hasTakenBleedingDamage");
  if (hasTakenBleedingDamage) return;

  // Find all bleeding wound effects and process the highest stage
  const bleedingEffects = actor.effects.filter(e => e.label.startsWith("Bleeding Wound"));
  if (!bleedingEffects.length || actor.system.health.value <= 0) return;

  // Get the highest stage effect
  const highestStageEffect = bleedingEffects.reduce((prev, current) => {
    const prevStage = prev.flags[SYSTEM_ID]?.bleedingStage || 1;
    const currentStage = current.flags[SYSTEM_ID]?.bleedingStage || 1;
    return currentStage > prevStage ? current : prev;
  });

  const stage = highestStageEffect.flags[SYSTEM_ID]?.bleedingStage || 1;
  const damage = Math.min(stage, actor.system.health.value);

  console.log(`Processing Bleeding Wound: Stage ${stage}, Damage ${damage}`);

  if (damage <= 0) return;

  // Set flag to indicate bleeding damage has been applied this turn
  await combatant.setFlag(SYSTEM_ID, "hasTakenBleedingDamage", true);

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
        <h3 class="chat-message-title">${actor.name} took ${damage} damage from <strong>Bleeding Wound</strong></h3>
      </div>
      
      <div class="chat-message-details">
        <div class="chat-message-detail-row">
          <span class="chat-message-detail-label">Damage Type:</span>
          <span class="chat-damage-type-box">Persistent</span>
        </div>
        <div class="chat-message-detail-row">
          <span class="chat-message-detail-label">Stage:</span>
          <span class="chat-stage-box">${stage}</span>
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

// Handle undo button
Hooks.on('renderChatMessage', (message, html, data) => {
  html.find('.bleeding-undo').click(async (event) => {
    const actorId = event.currentTarget.dataset.actorId;
    const damage = parseInt(event.currentTarget.dataset.damage);
    const actor = game.actors.get(actorId);
    
    if (actor) {
      await actor.update({
        "system.health.value": actor.system.health.value + damage
      });
      
      // Cross out the entire message content
      const messageCard = html.find('.chat-message-card');
      messageCard.css('text-decoration', 'line-through');
      messageCard.css('opacity', '0.7');
      
      // Remove the undo button
      event.currentTarget.closest('.bleeding-undo-container').remove();
    }
  });
});