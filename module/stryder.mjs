// Import document classes.
import { StryderActor } from './documents/actor.mjs';
import { StryderItem } from './documents/item.mjs';
// Import sheet classes.
import { StryderActorSheet } from './sheets/actor-sheet.mjs';
import { StryderItemSheet } from './sheets/item-sheet.mjs';
// Import combat classes.
import { StryderCombat, ALLIED, ENEMY } from './combat/combat.mjs';
import { StryderCombatant } from './combat/combatant.mjs';
import { StryderCombatTracker } from './combat/combat-tracker.mjs';
import { SYSTEM_ID } from './helpers/constants.mjs';
// Import status automation.
import { handleBleedingWoundApplication, handleBleedingWoundDamage } from './conditions/bleeding-wounds.mjs';
import { handleBurningApplication, handleBurningDamage, handleBurningMaxHealthReduction } from './conditions/burning.mjs';
import { handlePoisonApplication, handlePoisonStage1Roll, handlePoisonStage2Damage, handlePoisonStage4Unconscious } from './conditions/poison.mjs';
import { handleEnergizedApplication } from './conditions/energized.mjs';
import { handleBlindedApplication } from './conditions/blinded.mjs';
import { handleSenselessApplication } from './conditions/senseless.mjs';
import { handleConfusedApplication, handleConfusedRollIntercept, confusedState } from './conditions/confused.mjs';
import { handleExhaustionApplication, removeExhaustionEffects } from './conditions/exhaustion.mjs';
import { handleFrozenApplication, removeFrozenEffects, handleFrozenAttackPenalty, handleFrozenRoundTracking } from './conditions/frozen.mjs';
import { handleMuteApplication, removeMuteEffects, isActorMuted, handleMuteHexBlocking } from './conditions/mute.mjs';
import { handlePanickedApplication, isActorPanicked, getPanickedRollQuality } from './conditions/panicked.mjs';
import { handleGrappledApplication, isActorGrappled, handleGrappledEvasionBlock } from './conditions/grappled.mjs';
import { handleShockedApplication, isActorShocked, handleShockedAttackPenalty } from './conditions/shocked.mjs';
import { handleStunnedApplication, isActorStunned, handleStunnedStaminaSpend, removeStunnedEffect } from './conditions/stunned.mjs';
import { handleBanglelessApplication, isActorBangleless } from './conditions/bangleless.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { STRYDER } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

export const blindedState = {
  // Reserved for future Detection roll mechanic to overcome Blinded
  waitingForBlindResponse: false,
  // Flag to indicate if penalty should be applied to next roll
  shouldApplyPenalty: false,
  // Track which items are currently being processed to prevent duplicates
  processingItems: new Set(),
  // Track which items have already been rolled to prevent duplicate rolls
  rolledItems: new Set()
};

export const senselessState = {
  // Reserved for future Detection roll mechanic to overcome Senseless
  waitingForSenselessResponse: false,
  // Flag to indicate if penalty should be applied to next roll
  shouldApplyPenalty: false,
  // Track which items are currently being processed to prevent duplicates
  processingItems: new Set(),
  // Track which items have already been rolled to prevent duplicate rolls
  rolledItems: new Set()
};

Hooks.once('init', async function () {

  console.log("STRYDER | init: registering classes & preloading templates");
	await preloadHandlebarsTemplates();

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.stryder = {
    StryderActor,
    StryderItem,
    rollItemMacro,
  };

	Hooks.on('updateActor', async (actor, updateData, options, userId) => {
	  // Check if this is a character whose health.max was updated
	  if (actor.type === 'character' && 
		  (updateData.system?.health?.max !== undefined || 
		   updateData.system?.attributes?.mastery !== undefined)) {
		// Find all lordlings linked to this character
		const lordlings = game.actors.filter(a => 
		  a.type === 'lordling' && 
		  a.system?.linkedCharacterId === actor.id
		);
		
		// Prepare updates
		const updates = lordlings.map(lordling => {
		  const update = {
			_id: lordling.id,
			system: {}
		  };

		  // Update health if changed
		  if (updateData.system?.health?.max !== undefined) {
			update.system.health = {
			  max: updateData.system.health.max,
			  value: Math.min(lordling.system?.health?.value || 0, updateData.system.health.max)
			};
		  }

		  // Update mastery if changed
		  if (updateData.system?.attributes?.mastery !== undefined) {
			update.system.attributes = {
			  mastery: updateData.system.attributes.mastery
			};
		  }

		  return update;
		});

		if (updates.length > 0) {
		  await Actor.updateDocuments(updates);
		}
	  }
	});

	// Register with Automated Animations
		if (game.modules.get('automated-animations')?.active) {
		Hooks.on('createChatMessage', (msg) => {
		  // Let AA handle the message if it's one of our system messages
		  if (msg.flags.stryder?.itemId) {
			return;
		  }
		});
	}

	libWrapper.register(SYSTEM_ID, "Roll.prototype._evaluate", async function (wrapped, ...args) {
	  // Check for poison first
	  let actor = this.options?.speaker?.actor ? game.actors.get(this.options.speaker.actor) : null;
	  if (!actor && canvas.tokens.controlled.length === 1) {
		actor = canvas.tokens.controlled[0]?.actor;
	  }

	  if (actor) {
		// Poison handling
		const poisoned = actor.effects.find(e => {
		  const hasLabel = e.label && e.label.startsWith("Poisoned");
		  const hasName = e.name && e.name.includes("Poisoned");
		  const stage = e.flags[SYSTEM_ID]?.poisonStage || 1;
		  const isStage1Plus = stage >= 1;
		  const isPoisonEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.poisonStage;
		  return isPoisonEffect && isStage1Plus;
		});
		
		if (poisoned && this.formula.includes('2d6')) {
		  this._formula = `${this._formula} - 1`;
		  this.terms = Roll.parse(this._formula);
		}
		
		// Blinded handling - apply penalty based on blindedState
		const blinded = actor.effects.find(e => {
		  const hasLabel = e.label === "Blinded";
		  const hasName = e.name === "Blinded";
		  const isBlindedEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isBlinded;
		  return isBlindedEffect;
		});
		
		if (blinded && blindedState.shouldApplyPenalty) {
		  console.log("Applying Blinded penalty in roll evaluation:", this.formula);
		  this._formula = `${this._formula} - 3`;
		  this.terms = Roll.parse(this._formula);
		  blindedState.shouldApplyPenalty = false; // Reset after applying
		}

		// Senseless handling - apply penalty based on senselessState
		const senseless = actor.effects.find(e => {
		  const hasLabel = e.label === "Senseless";
		  const hasName = e.name === "Senseless";
		  const isSenselessEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isSenseless;
		  return isSenselessEffect;
		});
		
		if (senseless && senselessState.shouldApplyPenalty) {
		  console.log("Applying Senseless penalty in roll evaluation:", this.formula);
		  this._formula = `${this._formula} - 3`;
		  this.terms = Roll.parse(this._formula);
		  senselessState.shouldApplyPenalty = false; // Reset after applying
		}

		// Confused handling
		const confused = actor.effects.find(e => 
		e.label === "Confused" && e.flags[SYSTEM_ID]?.isConfused
		);

		if (confused && confusedState.nextRollShouldBeBlocked) {
		confusedState.nextRollShouldBeBlocked = false;
		return null; // Block the roll
		}

		// Frozen handling - apply penalty to attack rolls
		const frozen = actor.effects.find(e => {
		  const hasLabel = e.label === "Frozen";
		  const hasName = e.name === "Frozen";
		  const isFrozenEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isFrozen;
		  return isFrozenEffect;
		});
		
		if (frozen) {
		  handleFrozenAttackPenalty(this, actor);
		}

		// Shocked handling - apply penalty to attack rolls
		const shocked = actor.effects.find(e => {
		  const hasLabel = e.label === "Shocked";
		  const hasName = e.name === "Shocked";
		  const isShockedEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isShocked;
		  return isShockedEffect;
		});
		
		if (shocked && this.formula.includes('2d6')) {
		  this._formula = `${this._formula} - 2`;
		  this.terms = Roll.parse(this._formula);
		}
	  }

	  return wrapped.call(this, ...args);
	}, "MIXED");

	// Hook into ChatMessage.create to intercept focused actions for Confused characters
	libWrapper.register(SYSTEM_ID, "ChatMessage.create", async function (wrapped, data, options) {
	  // Check if this is a message with flavor that contains "Action:" and "Focused"
	  if (data.flavor && data.flavor.includes("Action:") && data.flavor.includes("Focused")) {
		const actor = data.speaker?.actor ? game.actors.get(data.speaker.actor) : null;
		
		if (actor) {
		  // Check if actor is Confused
		  const confusedAny = actor.effects.find(e => 
			e.label === "Confused" || e.name === "Confused"
		  );
		  
		  if (confusedAny && !confusedState.waitingForConfusedResponse) {
			// Store the message data for later use
			confusedState.pendingMessageData = {
			  originalData: data,
			  actorId: actor.id
			};
			
			// Create the confused dialog instead of the original message
			const dialogContent = await renderTemplate(`systems/stryder/templates/conditions/confused-dialog.hbs`, {
			  actorName: actor.name
			});

			const dialogMessage = await ChatMessage.create({
			  user: game.user.id,
			  speaker: ChatMessage.getSpeaker({actor}),
			  content: dialogContent,
			  type: CONST.CHAT_MESSAGE_TYPES.OTHER,
			  flags: {
				[SYSTEM_ID]: {
				  confusedResult: true,
				  actorId: actor.id
				}
			  }
			});
			
			confusedState.waitingForConfusedResponse = true;
			return dialogMessage; // Return the dialog instead of the original message
		  }
		}
	  }
	  
	  // If not a focused action or not confused, proceed normally
	  return wrapped.call(this, data, options);
	}, "MIXED");

	// Hook into message creation to handle Blinded penalties for Reflex rolls
	Hooks.on('preCreateChatMessage', async (message, options, userId) => {
	  
	  // Check if this is a roll message (could be 'base' or CONST.CHAT_MESSAGE_TYPES.ROLL) for Blinded
	  if (message.type !== CONST.CHAT_MESSAGE_TYPES.ROLL && message.type !== 'base') return;
	  
	  const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
	  if (!actor) return;
	  
	  // Check if actor is Blinded
	  const blinded = actor.effects.find(e => {
		const hasLabel = e.label === "Blinded";
		const hasName = e.name === "Blinded";
		const isBlindedEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isBlinded;
		return isBlindedEffect;
	  });
	  
	  if (!blinded) return;
	  
	  // Check if this is a Reflex roll by looking at the flavor
	  const isReflexRoll = message.flavor && message.flavor.includes('[ability] Reflex');
	  
	  // Check if this is an attack roll by looking for attack-related flags
	  const hasAttackFlags = message.flags?.['stryder.rollType'] === 'attack' || 
							 message.flags?.['stryder.itemId'];
	  
	  if (isReflexRoll || hasAttackFlags) {
		// Modify the roll result to subtract 3
		if (message.rolls && message.rolls.length > 0) {
		  const roll = message.rolls[0];
		  roll._total = roll._total - 3;
		  roll._formula = `${roll._formula} - 3`;
		}
	  }
	});

	// Blinded penalties are now handled in Roll.prototype._evaluate using libWrapper

	// Hook into item roll method to intercept armament and hex rolls for Blinded actors
	const originalItemRoll = StryderItem.prototype.roll;
	StryderItem.prototype.roll = async function(...args) {
	  const item = this;
	  const itemKey = `${item.actor.id}-${item.id}`;
	  
	  // Check if this item is already being processed
	  if (blindedState.processingItems.has(itemKey) || senselessState.processingItems.has(itemKey)) {
		return originalItemRoll.call(this, ...args);
	  }
	  
	  // Check if this is an armament, hex, or generic item
	  if (item.type !== "armament" && item.type !== "hex" && item.type !== "generic") {
		return originalItemRoll.call(this, ...args);
	  }
	  
	  const actor = item.actor;
	  if (!actor) {
		return originalItemRoll.call(this, ...args);
	  }
	  
	  // Check if actor is Muted (for hex items)
	  if (item.type === "hex") {
		const muted = actor.effects.find(e => {
		  const hasLabel = e.label === "Mute";
		  const hasName = e.name === "Mute";
		  const isMuteEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isMute;
		  return isMuteEffect;
		});
		
		if (muted) {
		  // Block the hex and send mute notification
		  await handleMuteHexBlocking({ flags: { [SYSTEM_ID]: { itemType: 'hex' } } }, actor);
		  return null; // Don't proceed with the original roll
		}
	  }
	  
	  // Check if actor is Blinded
	  const blinded = actor.effects.find(e => {
		const hasLabel = e.label === "Blinded";
		const hasName = e.name === "Blinded";
		const isBlindedEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isBlinded;
		return isBlindedEffect;
	  });
	  
	  // Check if actor is Senseless
	  const senseless = actor.effects.find(e => {
		const hasLabel = e.label === "Senseless";
		const hasName = e.name === "Senseless";
		const isSenselessEffect = hasLabel || hasName || e.flags[SYSTEM_ID]?.isSenseless;
		return isSenselessEffect;
	  });
	  
	  if (!blinded && !senseless) {
		return originalItemRoll.call(this, ...args);
	  }
	  
	  // Mark this item as being processed
	  if (blinded) {
		blindedState.processingItems.add(itemKey);
		// Create the blinded check dialog instead of rolling immediately
		await createBlindedCheckDialog(actor, item);
	  } else if (senseless) {
		senselessState.processingItems.add(itemKey);
		// Create the senseless check dialog instead of rolling immediately
		await createSenselessCheckDialog(actor, item);
	  }
	  return null; // Don't proceed with the original roll
	};

	// Function to create blinded check dialog
	async function createBlindedCheckDialog(actor, item) {
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
	  } else if (item.type === "generic") {
		initialMessageContent = `
		  <div class="chat-message-card">
			<div class="chat-message-header">
			  <h3 class="chat-message-title">You are currently <strong>Blinded</strong></h3>
			</div>
			<div class="chat-message-content">
			  <p>Did ${actor.name} overcome Blindness by successfully rolling Detection (Any Sense other than Sight) against the target's Nimbleness?</p>
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
			  <p>Did ${actor.name} overcome Blindness by successfully rolling Detection (Any Sense other than Sight) against the target's Nimbleness?</p>
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

	// Function to create senseless check dialog
	async function createSenselessCheckDialog(actor, item) {
	  let initialMessageContent;

	  if (item.type === "hex") {
		initialMessageContent = `
		  <div class="chat-message-card">
			<div class="chat-message-header">
			  <h3 class="chat-message-title">You are currently <strong>Senseless</strong></h3>
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
	  } else if (item.type === "generic") {
		initialMessageContent = `
		  <div class="chat-message-card">
			<div class="chat-message-header">
			  <h3 class="chat-message-title">You are currently <strong>Senseless</strong></h3>
			</div>
			<div class="chat-message-content">
			  <p>Did ${actor.name} overcome being Senseless by successfully rolling Detection (Arcane or Touch) against the target's Nimbleness?</p>
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
			  <h3 class="chat-message-title">You are currently <strong>Senseless</strong></h3>
			</div>
			<div class="chat-message-content">
			  <p>Did ${actor.name} overcome being Senseless by successfully rolling Detection (Arcane or Touch) against the target's Nimbleness?</p>
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
			senselessCheck: true,
			actorId: actor.id,
			itemId: item.id,
			isHex: item.type === "hex"
		  }
		}
	  });

	  // Store the message ID so we can delete it later
	  return message.id;
	}

	// Handle the response to the blinded and senseless checks
	Hooks.on('renderChatMessageHTML', (message, html, data) => {
	  const blindedCheck = message.getFlag(SYSTEM_ID, 'blindedCheck');
	  const senselessCheck = message.getFlag(SYSTEM_ID, 'senselessCheck');
	  const processed = message.getFlag(SYSTEM_ID, 'processed');
	  if ((!blindedCheck && !senselessCheck) || processed) return;

	  // Add click handlers to the buttons
	  const buttons = html.querySelectorAll('.effect-button');
	  buttons.forEach(button => {
		button.addEventListener('click', async (event) => {
		  // Prevent multiple clicks
		  if (button.disabled) return;
		  button.disabled = true;
		  
		  const action = event.currentTarget.dataset.action;
		  const actorId = message.getFlag(SYSTEM_ID, 'actorId');
		  const itemId = message.getFlag(SYSTEM_ID, 'itemId');
		  const isHex = message.getFlag(SYSTEM_ID, 'isHex');
		  
		  const actor = game.actors.get(actorId);
		  const item = actor.items.get(itemId);
		  
		  if (!actor || !item) {
			return;
		  }

		  // Mark this message as processed and update its content
		  message.setFlag(SYSTEM_ID, 'processed', true);
		  
		  // Determine which condition we're handling
		  const conditionType = blindedCheck ? 'Blinded' : 'Senseless';
		  const stateObject = blindedCheck ? blindedState : senselessState;
		  const flagName = blindedCheck ? 'blindedRolled' : 'senselessRolled';
		  
		  // Update the message content to show it's been answered
		  const answerText = action === "yes" ? "Yes - No penalty applied" : "No - Penalty will be applied";
		  const answeredContent = `
			<div class="chat-message-card">
			  <div class="chat-message-header">
				<h3 class="chat-message-title">${conditionType} Check - ${answerText}</h3>
			  </div>
			  <div class="chat-message-content">
				<p>Answer: ${answerText}</p>
			  </div>
			</div>
		  `;
		  
		  // Update the message content
		  await message.update({ content: answeredContent });
		  
		  if (action === "no") {
			if (isHex) {
			  // For hex items, we need to ask the second question
			  const followUpContent = `
				<div class="chat-message-card">
				  <div class="chat-message-header">
					<h3 class="chat-message-title">You are currently <strong>${conditionType}</strong></h3>
				  </div>
				  <div class="chat-message-content">
					<p>Did ${actor.name} overcome being ${conditionType} by successfully rolling Detection against the target's Nimbleness?</p>
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
					[blindedCheck ? 'blindedCheck' : 'senselessCheck']: true,
					actorId: actor.id,
					itemId: item.id,
					isHex: false
				  }
				}
			  });
			  
			  return;
			} else {
			  // For non-hex items, apply penalty and proceed
			  stateObject.shouldApplyPenalty = true;
			  console.log(`Set ${conditionType.toLowerCase()} shouldApplyPenalty = true (no)`);
			}
		  } else if (action === "no-final") {
			// Explicitly handle the final no case for hex items
			stateObject.shouldApplyPenalty = true;
			console.log(`Set ${conditionType.toLowerCase()} shouldApplyPenalty = true (no-final)`);
		  } else if (action === "yes") {
			// Player succeeded, no penalty
			stateObject.shouldApplyPenalty = false;
			console.log(`Set ${conditionType.toLowerCase()} shouldApplyPenalty = false (yes)`);
		  }
		  
		  // Clear the processing flag and proceed with the original roll
		  const itemKey = `${actor.id}-${item.id}`;
		  stateObject.processingItems.delete(itemKey);
		  
		  // Use a more robust approach - set a flag on the item itself
		  if (item.getFlag(SYSTEM_ID, flagName)) {
			return;
		  }
		  
		  // Mark as rolled and proceed
		  item.setFlag(SYSTEM_ID, flagName, true);
		  
		  await originalItemRoll.call(item);
		  
		  // Clear the flag after the roll completes
		  setTimeout(() => {
			item.unsetFlag(SYSTEM_ID, flagName);
		  }, 1000);
		});
	  });
	});

  CONFIG.time.roundTime = 8;
  
  // Register application
  CONFIG.Combat.documentClass = StryderCombat;
  CONFIG.Combatant.documentClass = StryderCombatant;
  CONFIG.Combat.initiative = { formula: '1', decimals: 0 };

  CONFIG.ui.combat = StryderCombatTracker;

  CONFIG.Actor.documentClass = StryderActor;
  CONFIG.Item.documentClass = StryderItem;
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.time.roundTime = 8;
  CONFIG.STRYDER = STRYDER;

  // Add custom constants for configuration.
  CONFIG.STRYDER = STRYDER;
  CONFIG.statusEffects = [];

	CONFIG.statusEffects = [
		{
		  id: "dead",
		  label: "Dead",
		  icon: "systems/stryder/assets/status/dead.svg"
		},
		{
		  id: "unconscious",
		  label: "Unconscious",
		  icon: "systems/stryder/assets/status/unconscious.svg"
		},
		{
		  id: "bleeding-wound",
		  label: "Bleeding Wound",
		  icon: "systems/stryder/assets/status/bleeding-wound.svg"
		},
		{
		  id: "burning",
		  label: "Burning",
		  icon: "systems/stryder/assets/status/burning.svg"
		},
		{
		  id: "poisoned",
		  label: "Poisoned",
		  icon: "systems/stryder/assets/status/poisoned.svg"
		},
		{
		  id: "energized",
		  label: "Energized",
		  icon: "systems/stryder/assets/status/energized.svg"
		},
		{
		  id: "hovering",
		  label: "Hovering",
		  icon: "systems/stryder/assets/status/hovering.svg"
		},
		{
		  id: "invisible",
		  label: "Invisible",
		  icon: "systems/stryder/assets/status/invisible.svg"
		},
		{
		  id: "hidden",
		  label: "Hidden",
		  icon: "systems/stryder/assets/status/hidden.svg"
		},
		{
		  id: "Last Breath",
		  label: "Last Breaths",
		  icon: "systems/stryder/assets/status/last-breath.svg"
		},
		{
		  id: "blinded",
		  label: "Blinded",
		  icon: "systems/stryder/assets/status/blinded.svg"
		},
		{
		  id: "confused",
		  label: "Confused",
		  icon: "systems/stryder/assets/status/confused.svg"
		},
		{
		  id: "dropped",
		  label: "Dropped",
		  icon: "systems/stryder/assets/status/dropped.svg"
		},
		{
		  id: "frozen",
		  label: "Frozen",
		  icon: "systems/stryder/assets/status/frozen.svg"
		},
		{
		  id: "grappled",
		  label: "Grappled",
		  icon: "systems/stryder/assets/status/grappled.svg"
		},
		{
		  id: "mute",
		  label: "Mute",
		  icon: "systems/stryder/assets/status/mute.svg"
		},
		{
		  id: "panicked",
		  label: "Panicked",
		  icon: "systems/stryder/assets/status/panicked.svg"
		},
		{
		  id: "senseless",
		  label: "Senseless",
		  icon: "systems/stryder/assets/status/senseless.svg"
		},
		{
		  id: "shocked",
		  label: "Shocked",
		  icon: "systems/stryder/assets/status/shocked.svg"
		},
		{
		  id: "soaked",
		  label: "Soaked",
		  icon: "systems/stryder/assets/status/soaked.svg"
		},
		{
		  id: "staggered",
		  label: "Staggered",
		  icon: "systems/stryder/assets/status/staggered.svg"
		},
		{
		  id: "stunned",
		  label: "Stunned",
		  icon: "systems/stryder/assets/status/stunned.svg"
		},
		{
		  id: "suffocating",
		  label: "Suffocating",
		  icon: "systems/stryder/assets/status/suffocating.svg"
		},
		{
		  id: "taunted",
		  label: "Taunted",
		  icon: "systems/stryder/assets/status/taunted.svg"
		},
		{
		  id: "trapped",
		  label: "Trapped",
		  icon: "systems/stryder/assets/status/trapped.svg"
		},
		{
		  id: "exhausted",
		  label: "Exhausted",
		  icon: "systems/stryder/assets/status/exhausted.svg"
		},
		{
		  id: "haggard",
		  label: "Haggard",
		  icon: "systems/stryder/assets/status/haggard.svg"
		},
		{
		  id: "bangleless",
		  label: "Bangleless",
		  icon: "systems/stryder/assets/status/bangleless.svg"
		}
	];

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '2d6 + @abilities.Reflex.value + @abilities.speed.value + @initiative.bonus',
    decimals: 0,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = StryderActor;
  CONFIG.Item.documentClass = StryderItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('stryder', StryderActorSheet, {
    makeDefault: true,
    label: 'STRYDER.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('stryder', StryderItemSheet, {
    makeDefault: true,
    label: 'STRYDER.SheetLabels.Item',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('capitalize', function(str) {
	if (typeof str !== 'string') return '';
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

Handlebars.registerHelper('concat', function(...args) {
  return args.slice(0, -1).join('');
});

Handlebars.registerHelper('range', function (from, to, inclusive, block) {
   var accum = '';
   for(var i = from; inclusive ? i <= to : i < to; i++)
	   accum += block.fn(i);
   return accum;
});

Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

Hooks.once('init', function() {
    Handlebars.registerHelper('calculateFormula', function(diceNum, diceSize, diceBonus) {
        return `${diceNum}d${diceSize} + ${diceBonus}`;
    });
});

async function handleUnboundLeapEffect(event) {
  event.preventDefault();
  console.log("Unbound Leap button clicked");
  
  const button = event.currentTarget;
  const controlledTokens = canvas.tokens.controlled;
  console.log("Controlled tokens:", controlledTokens);
  
  if (controlledTokens.length === 0) {
	console.log("No tokens selected");
	ui.notifications.warn("No character selected! Please select a token first.");
	return;
  }

  const token = controlledTokens[0];
  const actor = token.actor;
  console.log("Selected actor:", actor);
  
  if (!actor) {
	console.log("No actor found for token");
	ui.notifications.error("Selected token has no associated actor!");
	return;
  }

  // Create the active effect
  const effectData = {
	label: "Strength: Unbound Leap",
	icon: "icons/skills/movement/arrow-upward-yellow.webp",
	duration: {
	  rounds: 1,
	  seconds: 8,
	  startRound: game.combat?.round || 0
	},
	changes: [{
	  key: "system.booleans.usingUnboundLeap",
	  value: true,
	  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
	  priority: 20
	}],
	flags: {
	  core: {
		statusId: "unboundLeap"
	  }
	}
  };

  console.log("Attempting to create effect with data:", effectData);
  
  // Apply the effect
  actor.createEmbeddedDocuments("ActiveEffect", [effectData])
	.then((createdEffects) => {
	  console.log("Effect created successfully:", createdEffects);
	  ui.notifications.info(`Applied Unbound Leap effect to ${actor.name}!`);
	  button.disabled = true;
	  button.textContent = "Effect Applied";
	})
	.catch(err => {
	  console.error("Error applying Unbound Leap effect:", err);
	  ui.notifications.error("Failed to apply Unbound Leap effect!");
	});
}

/* -------------------------------------------- */
/*  Conditions Automation                       */
/* -------------------------------------------- */

Hooks.on('createActiveEffect', async (effect, options, userId) => {
  if (effect.label === "Bleeding Wound" && game.user.id === userId) {
    await handleBleedingWoundApplication(effect);
  }

  if (effect.label === "Burning" && game.user.id === userId) {
    await handleBurningApplication(effect);
  }

  if (effect.label === "Poisoned" && game.user.id === userId) {
    await handlePoisonApplication(effect);
  }

  if (effect.label === "Energized" && game.user.id === userId) {
    await handleEnergizedApplication(effect);
  }

  if (effect.label === "Blinded" && game.user.id === userId) {
    await handleBlindedApplication(effect);
  }

  if (effect.label === "Confused" && game.user.id === userId) {
    await handleConfusedApplication(effect);
  }

  if (effect.label === "Exhausted" && game.user.id === userId) {
    await handleExhaustionApplication(effect);
  }

  if (effect.label === "Frozen" && game.user.id === userId) {
    await handleFrozenApplication(effect);
  }

  if (effect.label === "Mute" && game.user.id === userId) {
    await handleMuteApplication(effect);
  }
});

async function handleBloodlossReset(combatants) {
  console.log("Resetting bloodloss for all combatants");
  
  for (const combatant of combatants) {
    const actor = combatant.actor;
    if (!actor) continue;
    
    const bloodlossReduction = actor.getFlag(SYSTEM_ID, "bloodlossHealthReduction") || 0;
    
    if (bloodlossReduction > 0) {
      // Calculate what the new max HP will be after reset
      const newMaxHP = actor.system.health.max + bloodlossReduction;
      
      await actor.update({
        [`flags.${SYSTEM_ID}.bloodlossHealthReduction`]: null
      });
      
      // Send notification
      const messageContent = `
      <div class="chat-message-card">
        <div class="chat-message-header">
          <h3 class="chat-message-title">${actor.name}'s Bloodloss effects have been reset</h3>
        </div>
        
        <div class="chat-message-details">
          <div class="chat-message-detail-row">
            <span class="chat-message-detail-label">Maximum HP Restored:</span>
            <span class="chat-health-box">${bloodlossReduction}</span>
          </div>
          <div class="chat-message-detail-row">
            <span class="chat-message-detail-label">New Maximum HP:</span>
            <span class="chat-health-box">${newMaxHP}</span>
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
}

/**
 * Get active status conditions for an actor
 * @param {Actor} actor - The actor to check
 * @returns {Array} Array of active status condition objects
 */
function getActiveStatusConditions(actor) {
  if (!actor || !actor.effects) return [];
  
  const activeConditions = [];
  const statusEffectIds = CONFIG.statusEffects.map(effect => effect.id);
  
  for (const effect of actor.effects) {
    if (effect.disabled) continue;
    
    // Check if this effect matches any of our defined status effects
    const statusEffect = CONFIG.statusEffects.find(se => 
      se.id === effect.id || 
      se.label === effect.label || 
      se.label === effect.name
    );
    
    if (statusEffect) {
      activeConditions.push({
        id: statusEffect.id,
        label: statusEffect.label,
        icon: statusEffect.icon
      });
    }
  }
  
  return activeConditions;
}

/**
 * Display status conditions in chat when an actor's turn starts
 * @param {Combatant} combatant - The combatant whose turn is starting
 */
async function displayStatusConditionsOnTurnStart(combatant) {
  if (!combatant?.actor) return;
  
  const activeConditions = getActiveStatusConditions(combatant.actor);
  
  // Only show message if there are active conditions
  if (activeConditions.length === 0) return;
  
  // Create status condition icons HTML
  const statusIcons = activeConditions.map(condition => 
    `<div class="status-condition-item" title="${condition.label}">
      <img src="${condition.icon}" alt="${condition.label}" class="status-condition-icon">
      <span class="status-condition-label">${condition.label}</span>
    </div>`
  ).join('');
  
  const messageContent = `
    <div class="chat-message-card status-conditions-message">
      <div class="chat-message-header">
        <h3 class="chat-message-title">
          <i class="fas fa-exclamation-triangle"></i>
          ${combatant.actor.name} has active status conditions
        </h3>
      </div>
      
      <div class="chat-message-content">
        <div class="status-conditions-grid">
          ${statusIcons}
        </div>
      </div>
    </div>
  `;

  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({actor: combatant.actor}),
    content: messageContent,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
}

Hooks.on('stryderCombatEvent', async (event) => {
  if (event.type === 'startOfTurn' && event.combatant) {
    await handleBleedingWoundDamage(event.combatant);
    await handleBurningDamage(event.combatant);
    await handlePoisonStage2Damage(event.combatant);
    await handleFrozenRoundTracking(event.combatant);
    await displayStatusConditionsOnTurnStart(event.combatant);
  }
  
  if (event.type === 'endOfTurn' && event.combatant) {
    await handleBurningMaxHealthReduction(event.combatant);
    await handlePoisonStage4Unconscious(event.combatant);
  }
  
  if (event.type === 'endOfCombat') {
    await handleBloodlossReset(event.combatants);
  }
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {

  // Hotbar macros
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

	// Handle socket communications for combat updates
    game.socket.on(`system.${SYSTEM_ID}`, async (data) => {
        switch (data.type) {
            case "turnChangeNotification":
                console.log('STRYDER DEBUG | Received turnChangeNotification socket message:', data.combatantName, 'User is GM:', game.user.isGM);
                // Show turn notification for non-GM clients (GM already saw it locally)
                if (!game.user.isGM) {
                    StryderCombat.showTurnNotification(data.combatantName);
                }
                break;
            default:
                // Only GMs can process combat actions
                if (!game.user.isGM) return;
                
                const combat = game.combats.get(data.combatId);
                if (!combat) return;
                
                const combatant = combat.combatants.get(data.combatantId);
                if (!combatant) return;

                switch (data.type) {
                    case "startCombatantTurn":
                        await combat.startTurn(combatant);
                        break;
                    case "endCombatantTurn":
                        await combat.endTurn(combatant);
                        break;
                    case "updateCombatFlag":
                        await combat.setFlag(SYSTEM_ID, data.flag, data.value);
                        break;
                }
                break;
        }
    });

  $(document).off("click", ".ability-dodge-evade-mod");
  $(document).on("click", ".unbound-leap-button", handleUnboundLeapEffect);
  
  // Handle damage application buttons
  $(document).on("click", ".damage-apply-button", async function(event) {
    const { handleDamageApply } = await import('./documents/item.mjs');
    handleDamageApply(event);
  });
  
  // Handle damage undo buttons
  $(document).on("click", ".damage-undo", async function(event) {
    const { handleDamageUndo } = await import('./documents/item.mjs');
    handleDamageUndo(event);
  });

	$(document).on("click", ".ability-dodge-evade-mod", async function(event) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			const appId = this.closest(".app")?.dataset.appid;
			const app = ui.windows[appId];
			const actor = app?.actor || app?.object?.actor || app?.object;
			
			if (!actor) return ui.notifications.error("No character selected!");

			// Check if actor is grappled
			if (isActorGrappled(actor)) {
				return handleGrappledEvasionBlock(actor);
			}

			// Lordling-specific logic
			let staminaActor = actor; // Default to using the current actor's stamina
			if (actor.type === 'lordling') {
				const linkedCharacterId = actor.system.linkedCharacterId;
				if (!linkedCharacterId) {
					return ui.notifications.warn("Lordling has no Linked Actor, so this action could not be performed!");
				}
				
				const linkedActor = game.actors.get(linkedCharacterId);
				if (!linkedActor) {
					return ui.notifications.warn("Linked Actor not found!");
				}
				staminaActor = linkedActor; // Use linked actor's stamina instead
			}

			const currentStamina = staminaActor.system.stamina?.value;
			if (currentStamina === undefined) return;
			if (currentStamina < 1) {
				return ui.notifications.warn(`${staminaActor.name} doesn't have enough Stamina!`);
			}

			// Check for Stunned condition
			const stunnedResult = await handleStunnedStaminaSpend(staminaActor, 1, 'roll');
			if (!stunnedResult.shouldProceed) {
				return; // Error message already shown
			}

			try {
				const rollFormula = this.dataset.customRoll;
				const flavor = this.dataset.label;
				const roll = new Roll(rollFormula, actor.system);
				
				await roll.evaluate({async: true});

				// Spend stamina (including stunned penalty if applicable)
				await staminaActor.update({"system.stamina.value": currentStamina - stunnedResult.cost});
				
				// Remove stunned effect if it was applied
				if (stunnedResult.cost > 1) {
					await removeStunnedEffect(staminaActor, stunnedResult.cost - 1);
				}
				const rollResult = await roll.render();

				await ChatMessage.create({
					user: game.user.id,
					speaker: ChatMessage.getSpeaker({actor: actor}),
					content: `
					<div style="background: url('systems/stryder/assets/parchment.jpg'); 
								background-size: cover; 
								padding: 15px; 
								border: 1px solid #c9a66b; 
								border-radius: 3px;">
					  <h3 style="margin-top: 0; border-bottom: 1px solid #c9a66b;"><strong>${flavor}</strong></h3>
					  ${rollResult}
					  <p style="margin-bottom: 0; border-top: 1px solid #c9a66b; padding-top: 5px;">
						${actor.type === 'lordling' ? 
						  `${staminaActor.name} (Linked Actor) spent 1 Stamina.` : 
						  `${actor.name} spent 1 Stamina.`}
					  </p>
					</div>
					`,
					type: CONST.CHAT_MESSAGE_TYPES.ROLL,
					sound: CONFIG.sounds.dice
				});

			} catch (err) {
				console.error("Roll error:", err);
				ui.notifications.error("Failed to process roll!");
			}
		});

	  try {
		if (!(ui.combat instanceof StryderCombatTracker)) {
		  console.log("STRYDER | Replacing default ui.combat instance with StryderCombatTracker");
		  ui.combat?.close();
		  ui.combat = new CONFIG.ui.combat();
		  ui.sidebar.activateTab('combat');
		  ui.combat.render(true);
		} else {
		  console.log("STRYDER | ui.combat already StryderCombatTracker");
		}
		
		// Ensure combat tracker tab pop-out is disabled
		StryderCombatTracker._disableCombatTabPopOut();
	  } catch (err) {
		console.error("STRYDER | Error replacing ui.combat instance:", err);
	  }

	});

	// Hook to ensure combat tracker tab pop-out is disabled whenever sidebar is rendered
	Hooks.on('renderSidebar', () => {
		StryderCombatTracker._disableCombatTabPopOut();
	});

/* -------------------------------------------- */
/*  Chat Message Enhancements                   */
/* -------------------------------------------- */

Hooks.on('renderChatMessage', (message, html, data) => {

  // Handle collapsible sections
  html.on('click', '.collapsible-toggle', function() {
    const content = $(this).next('.collapsible-content');
    content.slideToggle(200);
    $(this).find('i').toggleClass('fa-caret-down fa-caret-up');
  });

    // Handle effect expiration buttons
    html.find('.effect-button').click(async (event) => {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        
        if (message.getFlag(SYSTEM_ID, 'effectExpiration')) {
            const effectId = message.getFlag(SYSTEM_ID, 'effectId');
            const actorId = message.getFlag(SYSTEM_ID, 'actorId');
            const actor = game.actors.get(actorId);
            
            const buttons = {
                yes: {
                    callback: async () => {
                        if (actor) {
                            await actor.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
                        }
                        await message.delete();
                    }
                },
                no: {
                    callback: async () => {
                        await message.delete();
                    }
                }
            };
            
            if (buttons[action]?.callback) {
                await buttons[action].callback();
            }
        }
    });

});

/* -------------------------------------------- */
/*  Monk's Little Details Compatibility         */
/* -------------------------------------------- */

Hooks.once('ready', function() {
  // Check if Monk's Little Details is enabled
  if (game.modules.get('monks-little-details')?.active) {
    // Ensure our status effects have proper labels
    CONFIG.statusEffects.forEach(effect => {
      if (!effect.name) effect.name = effect.label;
    });
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.stryder.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'stryder.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
