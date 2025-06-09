import { SYSTEM_ID } from '../helpers/constants.mjs';
import { getFantasmActionType } from '../documents/item.mjs';

export const confusedState = {
  waitingForConfusedResponse: false,
  nextRollShouldBeBlocked: false,
  pendingMessageData: null
};

export async function handleConfusedApplication(effect) {
  const actor = effect.parent;
  
  // Update the effect to include the Confused penalties
  await effect.update({
    label: "Confused",
    changes: [],
    flags: {
      [SYSTEM_ID]: {
        isConfused: true
      }
    }
  });
}

export async function handleConfusedRollIntercept(item, actor) {
  if (!actor || confusedState.waitingForConfusedResponse) return null;
  
  const isConfused = actor.effects.find(e => 
    e.label === "Confused" && e.flags[SYSTEM_ID]?.isConfused
  );
  
  if (!isConfused) return null;
  
  // Check if this is a focused action or should be intercepted
  let shouldIntercept = false;
  
  // Case 1: Focused action type
  if (item.system.action_type === "focused") {
    shouldIntercept = tru
e;
  }
  // Case 2: Armament item type
  else if (item.type === "armament") {
    shouldIntercept = true;
  }

  // Case 3: Fantasm item type with "Focused" in content
  else if (item.type === "fantasm") {
	  const fantasmActionType = getFantasmActionType(item);
	  shouldIntercept = fantasmActionType === "Focused";
  }
  
  if (!shouldIntercept) return null;
  
  confusedState.waitingForConfusedResponse = true;
  confusedState.nextRollShouldBeBlocked = false;
  
  // Store the full item data and actor for later use
  confusedState.pendingMessageData = {
    item: item.toObject(),
    actorId: actor.id,
    speaker: ChatMessage.getSpeaker({actor}),
    rollMode: game.settings.get('core', 'rollMode')
  };

  // Create the dialog content using the HTML template
  const content = await renderTemplate(`systems/stryder/templates/conditions/confused-dialog.hbs`, {
    actorName: actor.name
  });

  // Create the chat message
  const message = await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor}),
    content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      [SYSTEM_ID]: {
        confusedCheck: true,
        actorId: actor.id,
        itemId: item.id
      }
    }
  });

  return message.id;
}

export async function processConfusedRoll(actor, dc, messageId) {
  // Roll Magykal Resist Check
  const rollFormula = "2d6 + @abilities.Will.value + @checks.Magykal.mod";
  const rollData = actor.getRollData();
  const roll = new Roll(rollFormula, rollData);
  await roll.evaluate({async: true});

  const success = roll.total >= dc;
  
  // Remove Confused effect if successful
  if (success) {
    const confusedEffect = actor.effects.find(e => 
      e.label === "Confused" && e.flags[SYSTEM_ID]?.isConfused
    );
    if (confusedEffect) {
      await confusedEffect.delete();
    }
  }
  
  // Create result message
  let resultContent = `
  <div class="chat-message-card">
    <div class="chat-message-header">
      <h3 class="chat-message-title">${actor.name} is <strong>Confused</strong></h3>
    </div>
    <div class="chat-message-details">
      <div class="chat-message-detail-row">
        <span class="chat-message-detail-label">DC:</span>
        <span>${dc}</span>
      </div>
      <div class="chat-message-detail-row">
        <span class="chat-message-detail-label">Roll Result:</span>
        <span>${roll.total}</span>
      </div>
    </div>
    <div class="chat-message-content">
      ${success ? 
        `${actor.name} snapped out of Confusion and is no longer affected!` : 
        `${actor.name} was Confused, and could not snap out of it in time! Their Focused Action has been wasted.`}
    </div>
    ${await roll.render()}
  </div>
  `;

  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor}),
    content: resultContent,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });

  // If successful, create the original item's message
  if (success && confusedState.pendingMessageData) {
    const { item, speaker, rollMode } = confusedState.pendingMessageData;
    
    // Create a temporary item instance to generate the proper chat message
    const tempItem = new CONFIG.Item.documentClass(item, { parent: actor });
    await tempItem.roll();
  }

  // Clean up
  confusedState.waitingForConfusedResponse = false;
  confusedState.nextRollShouldBeBlocked = false;
  confusedState.pendingMessageData = null;

  // Delete the original dialog message
  const message = game.messages.get(messageId);
  if (message) await message.delete();
}

// Handle the response to the confused check
Hooks.on('renderChatMessage', (message, html, data) => {
  const confusedCheck = message.getFlag(SYSTEM_ID, 'confusedCheck');
  if (!confusedCheck) return;

  html.find('.confused-roll-button').click(async (event) => {
    const dcInput = html.find('.confused-dc-input')[0];
    const dc = parseInt(dcInput.value);
    
    if (isNaN(dc)) {
      ui.notifications.error("Please enter a valid number for the DC!");
      return;
    }

    const actorId = message.getFlag(SYSTEM_ID, 'actorId');
    const actor = game.actors.get(actorId);
    const messageId = message.id;

    if (actor) {
      await processConfusedRoll(actor, dc, messageId);
    }
  });
});

// Register the hook to handle Confused effect application
Hooks.on('createActiveEffect', async (effect, options, userId) => {
  if (effect.label === "Confused" && game.user.id === userId) {
    await handleConfusedApplication(effect);
  }
});