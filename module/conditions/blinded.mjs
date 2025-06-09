import { SYSTEM_ID } from '../helpers/constants.mjs';
import { blindedState } from '../stryder.mjs';

export async function handleBlindedApplication(effect) {
  const actor = effect.parent;
  
  // Update the effect to include the Blinded penalties
  await effect.update({
    label: "Blinded",
    changes: [
      {
        key: "system.dodge.bonus",
        value: -3,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        priority: 20
      },
      {
        key: "system.evade.bonus",
        value: -3,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        priority: 20
      }
    ],
    flags: {
      [SYSTEM_ID]: {
        isBlinded: true
      }
    }
  });
}

export async function handleBlindedRollIntercept(item, actor) {
  if (!actor || blindedState.waitingForBlindResponse) return null;
  
  const isBlinded = actor.effects.find(e => 
    e.label === "Blinded" && e.flags[SYSTEM_ID]?.isBlinded
  );
  
  if (!isBlinded) return null;
  
  blindedState.waitingForBlindResponse = true;
  blindedState.nextRollShouldBeModified = false;
  
  let initialMessageContent;

  if (item.type === "hex") {
    initialMessageContent = `
      <div class="chat-message-card">
        <div class="chat-message-header">
          <h3 class="chat-message-title">You are currently <strong>Blinded</strong></h3>
        </div>
        <div class="chat-message-content">
          <p>Was the Hex ${actor.name} used untargeted?</p>
        </div>
        <div class="effect-buttons">
          <button class="effect-button yes" data-action="yes">
            <i class="fas fa-check"></i> Yes
          </button>
          <button class="effect-button no" data-action="no">
            <i class="fas fa-times"></i> No
          </button>
        </div>
      </div>
    `;
  } else {
    initialMessageContent = `
      <div class="chat-message-card">
        <div class="chat-message-header">
          <h3 class="chat-message-title">You are currently <strong>Blinded</strong></h3>
        </div>
        <div class="chat-message-content">
          <p>Did ${actor.name} overcome Blindness by successfully rolling Detection against the target's Nimbleness?</p>
        </div>
        <div class="effect-buttons">
          <button class="effect-button yes" data-action="yes">
            <i class="fas fa-check"></i> Yes
          </button>
          <button class="effect-button no" data-action="no">
            <i class="fas fa-times"></i> No
          </button>
        </div>
      </div>
    `;
  }

  // Create the chat message
  const message = await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor}),
    content: initialMessageContent,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      [SYSTEM_ID]: {
        blindedCheck: true,
        actorId: actor.id,
        itemId: item.id,
        isHex: item.type === "hex"
      }
    }
  });

  // Store the message ID so we can delete it later
  return message.id;
}

// Handle the response to the blinded check
Hooks.on('renderChatMessage', (message, html, data) => {
  const blindedCheck = message.getFlag(SYSTEM_ID, 'blindedCheck');
  if (!blindedCheck) return;

  html.find('.effect-button').click(async (event) => {
    const action = event.currentTarget.dataset.action;
    const actorId = message.getFlag(SYSTEM_ID, 'actorId');
    const itemId = message.getFlag(SYSTEM_ID, 'itemId');
    const isHex = message.getFlag(SYSTEM_ID, 'isHex');
    
    const actor = game.actors.get(actorId);
    const item = actor.items.get(itemId);
    
    if (!actor || !item) {
      blindedState.waitingForBlindResponse = false;
      return message.delete();
    }

	if (action === "no") {
	  if (isHex) {
		// For hex items, we need to ask the second question
		const followUpContent = `
		  <div class="chat-message-card">
			<div class="chat-message-header">
			  <h3 class="chat-message-title">You are currently <strong>Blinded</strong></h3>
			</div>
			<div class="chat-message-content">
			  <p>Did ${actor.name} overcome Blindness by successfully rolling Detection against the target's Nimbleness?</p>
			</div>
			<div class="effect-buttons">
			  <button class="effect-button yes" data-action="yes">
				<i class="fas fa-check"></i> Yes
			  </button>
			  <button class="effect-button no" data-action="no-final">
				<i class="fas fa-times"></i> No
			  </button>
			</div>
		  </div>
		`;
		
		await ChatMessage.create({
		  user: game.user.id,
		  speaker: ChatMessage.getSpeaker({actor}),
		  content: followUpContent,
		  type: CONST.CHAT_MESSAGE_TYPES.OTHER,
		  flags: {
			[SYSTEM_ID]: {
			  blindedCheck: true,
			  actorId: actor.id,
			  itemId: item.id,
			  isHex: false
			}
		  }
		});
		
		return message.delete();
	  } else {
		// For non-hex items or second question for hex items
		blindedState.nextRollShouldBeModified = true;
	  }
	} else if (action === "no-final") {
	  // Explicitly handle the final no case for hex items
	  blindedState.nextRollShouldBeModified = true;
	}
    
    // Proceed with the original roll using roll() for both hex and non-hex items
    await item.roll();
    
    blindedState.waitingForBlindResponse = false;
    return message.delete();
  });
});

// Hook to modify the next roll if needed
Hooks.on('preCreateChatMessage', (message, options, userId) => {
  if (blindedState.nextRollShouldBeModified && message.rolls?.length) {
    const roll = message.rolls[0];
    if (roll) {
      // Add -3 modifier to the roll
      roll._formula = `${roll._formula} - 3`;
      roll.terms = Roll.parse(roll._formula);
      blindedState.nextRollShouldBeModified = false;
      blindedState.waitingForBlindResponse = false;
    }
  }
});

// Register the hook to handle Blinded effect application
Hooks.on('createActiveEffect', async (effect, options, userId) => {
  if (effect.label === "Blinded" && game.user.id === userId) {
    await handleBlindedApplication(effect);
  }
});