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
import { handleConfusedApplication, handleConfusedRollIntercept, confusedState } from './conditions/confused.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { STRYDER } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

export const blindedState = {
  nextRollShouldBeModified: false,
  waitingForBlindResponse: false
};

Hooks.once('init', function () {
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
		const poisoned = actor.effects.find(e =>
		  e.label.startsWith("Poisoned") && 
		  (e.flags[SYSTEM_ID]?.poisonStage || 1) >= 1
		);
		
		if (poisoned && this.formula.includes('2d6')) {
		  this._formula = `${this._formula} - 1`;
		  this.terms = Roll.parse(this._formula);
		}
		
		// Blinded handling - updated to use blindedState
		const blinded = actor.effects.find(e => 
		  e.label === "Blinded" && e.flags[SYSTEM_ID]?.isBlinded
		);
		
		if (blinded && blindedState.nextRollShouldBeModified) {
		  this._formula = `${this._formula} - 3`;
		  this.terms = Roll.parse(this._formula);
		  blindedState.nextRollShouldBeModified = false;
		}

		// Confused handling
		const confused = actor.effects.find(e => 
		e.label === "Confused" && e.flags[SYSTEM_ID]?.isConfused
		);

		if (confused && confusedState.nextRollShouldBeBlocked) {
		confusedState.nextRollShouldBeBlocked = false;
		return null; // Block the roll
		}
	  }

	  return wrapped.call(this, ...args);
	}, "MIXED");

  CONFIG.time.roundTime = 8;
  
  // Register application
  Actors.unregisterSheet('core', CombatTracker);
  Actors.registerSheet('stryder', StryderCombatTracker, {
    makeDefault: true,
    label: 'STRYDER.SheetLabels.CombatTracker'
  });

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
		}
	];

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '2d6 + @abilities.Agility.value + @abilities.speed.value + @initiative.bonus',
    decimals: 0,
  };

	// Set combat tracker
	console.log(`Initializing combat tracker`);
	CONFIG.Combat.documentClass = StryderCombat;
	CONFIG.Combatant.documentClass = StryderCombatant;
	CONFIG.Combat.initiative = {
		formula: '1',
		decimals: 0,
	};
	CONFIG.ui.combat = StryderCombatTracker;

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
});

Hooks.on('stryderCombatEvent', async (event) => {
  if (event.type === 'startOfTurn' && event.combatant) {
    await handleBleedingWoundDamage(event.combatant);
    await handleBurningDamage(event.combatant);
    await handlePoisonStage2Damage(event.combatant);
  }
  
  if (event.type === 'endOfTurn' && event.combatant) {
    await handleBurningMaxHealthReduction(event.combatant);
    await handlePoisonStage4Unconscious(event.combatant);
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
    });

  $(document).off("click", ".ability-dodge-evade-mod");
  $(document).on("click", ".unbound-leap-button", handleUnboundLeapEffect);

	$(document).on("click", ".ability-dodge-evade-mod", async function(event) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			const appId = this.closest(".app")?.dataset.appid;
			const app = ui.windows[appId];
			const actor = app?.actor || app?.object?.actor || app?.object;
			
			if (!actor) return ui.notifications.error("No character selected!");

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

			try {
				const rollFormula = this.dataset.customRoll;
				const flavor = this.dataset.label;
				const roll = new Roll(rollFormula, actor.system);
				
				await roll.evaluate({async: true});

				await staminaActor.update({"system.stamina.value": currentStamina - 1});
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
