import { SYSTEM_ID } from '../helpers/constants.mjs';

export async function handlePoisonApplication(effect) {
  const actor = effect.parent;
  
  // Check for Aegis protection
  if (actor.system.aegis?.value > 0) {
    ui.notifications.error(`${actor.name} cannot receive Poison because they have positive Aegis!`);
    await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
    return;
  }

  // Show stage selection dialog
  const stages = [1, 2, 3, 4];
  const content = `
    <div class="poison-dialog">
      <p>Select Poison Stage:</p>
      <div class="stage-buttons">
        ${stages.map(stage => `
          <button class="stage-button" data-stage="${stage}">
            <strong>Stage ${stage}</strong>
          </button>
        `).join('')}
      </div>
      <div class="stage-descriptions">
        <p><strong>Stage 1:</strong> -1 penalty to all 2d6 rolls</p>
        <p><strong>Stage 2:</strong> Lose 2 Health at Turn Start</p>
        <p><strong>Stage 3:</strong> Lose 1 Max Stamina</p>
        <p><strong>Stage 4:</strong> Fall Unconscious after 3 Rounds</p>
      </div>
    </div>
  `;

  new Dialog({
    title: "Poison Application",
    content,
    buttons: {},
    default: "cancel",
    close: () => actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id])
  }).render(true);

  // Handle stage selection
  $(document).on('click', '.stage-button', async (event) => {
    const stage = parseInt(event.currentTarget.dataset.stage);
    await effect.update({
      label: `Poisoned (Stage ${stage})`,
      changes: [],
      flags: {
        [SYSTEM_ID]: {
          poisonStage: stage,
          poisonRoundsPassed: 0 // Track rounds for stage 4
        }
      }
    });
    $('.dialog').remove();
  });
}

export async function handlePoisonStage1Roll(roll, actor) {
  // Check if actor has poison stage 1 or higher
  const poisonEffect = actor.effects.find(e => 
    e.label.startsWith("Poisoned") && 
    (e.flags[SYSTEM_ID]?.poisonStage || 1) >= 1
  );
  
  if (!poisonEffect) return;

  // Check if the roll formula contains 2d6
  if (roll.formula.includes('2d6')) {
    // Clone the original terms to avoid modifying the original
    const newTerms = foundry.utils.deepClone(roll.terms);
    
    // Find and modify the 2d6 term
    for (let term of newTerms) {
      if (term instanceof DiceTerm && term.faces === 6 && term.number === 2) {
        // Create a new NumericTerm for the -1 penalty
        const penalty = new NumericTerm({number: -1});
        
        // Insert the penalty after the 2d6 term
        const index = newTerms.indexOf(term);
        newTerms.splice(index + 1, 0, penalty);
        
        // Rebuild the formula with the penalty
        roll._formula = newTerms.join(' ');
        break; // Only modify the first 2d6 we find
      }
    }
    
    // Rebuild the roll with modified terms
    roll.terms = newTerms;
  }
}

export async function handlePoisonStage2Damage(combatant) {
  const actor = combatant.actor;
  if (!actor) return;

  // Check if poison damage has already been applied this turn
  const hasTakenPoisonDamage = combatant.getFlag(SYSTEM_ID, "hasTakenPoisonDamage");
  if (hasTakenPoisonDamage) return;

  // Find poison effects stage 2 or higher
  const poisonEffects = actor.effects.filter(e => 
    e.label.startsWith("Poisoned") && 
    (e.flags[SYSTEM_ID]?.poisonStage || 1) >= 2
  );
  
  if (!poisonEffects.length || actor.system.health.value <= 0) return;

  const damage = Math.min(2, actor.system.health.value);
  if (damage <= 0) return;

  // Set flag FIRST to prevent multiple applications
  await combatant.setFlag(SYSTEM_ID, "hasTakenPoisonDamage", true);

  // Apply damage
  await actor.update({
    "system.health.value": Math.max(0, actor.system.health.value - damage)
  });

  // Send damage message
  if (damage > 0) {
    const messageContent = `
    <div class="chat-message-card">
      <div class="chat-message-header">
        <h3 class="chat-message-title">${actor.name} took ${damage} damage from <strong>Poison</strong></h3>
      </div>
      
      <div class="chat-message-details">
        <div class="chat-message-detail-row">
          <span class="chat-message-detail-label">Damage Type:</span>
          <span class="chat-damage-type-box">Persistent</span>
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

export async function handlePoisonStage4Unconscious(combatant) {
  const actor = combatant.actor;
  if (!actor) return;

  // Find poison effects stage 4
  const poisonEffect = actor.effects.find(e => 
    e.label.startsWith("Poisoned") && 
    (e.flags[SYSTEM_ID]?.poisonStage || 1) === 4
  );
  
  if (!poisonEffect) return;

  // Get current rounds passed and increment
  const currentRounds = poisonEffect.flags[SYSTEM_ID]?.poisonRoundsPassed || 0;
  const newRounds = currentRounds + 1;
  
  // Update the rounds counter
  await poisonEffect.setFlag(SYSTEM_ID, "poisonRoundsPassed", newRounds);

  // Check if 3 rounds have passed
  if (newRounds >= 3) {
    // Apply unconscious effect with proper configuration
    const unconsciousEffectData = {
      label: "Unconscious",
      icon: "systems/stryder/assets/status/unconscious.svg",
      disabled: false,
      duration: {
        rounds: 60, // 1 hour in rounds (8 seconds per round * 60 = 480 seconds = 8 minutes)
        seconds: 3600, // 1 hour in seconds
        startRound: game.combat?.round || 0
      },
      flags: {
        core: {
          statusId: "unconscious"
        },
        [SYSTEM_ID]: {
          isUnconscious: true
        }
      }
    };

    // Create the unconscious effect first
    await actor.createEmbeddedDocuments('ActiveEffect', [unconsciousEffectData]);

    // Send notification before removing the poison effect
    const messageContent = `
    <div class="chat-message-card">
      <div class="chat-message-header">
        <h3 class="chat-message-title">${actor.name} has fallen unconscious from <strong>Poison</strong></h3>
      </div>
      
      <div class="chat-message-details">
        <div class="chat-message-detail-row">
          <p>${actor.name} has fallen unconscious due to the poison circulating in their veins. If they are not properly treated in 1 hour, they will die permanently.</p>
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

    // Remove poison effect after sending message
    await actor.deleteEmbeddedDocuments('ActiveEffect', [poisonEffect.id]);
  }
}