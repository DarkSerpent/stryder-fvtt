// Import document classes.
import { StryderActor } from './documents/actor.mjs';
import { StryderItem } from './documents/item.mjs';
// Import sheet classes.
import { StryderActorSheet } from './sheets/actor-sheet.mjs';
import { StryderItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { STRYDER } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.stryder = {
    StryderActor,
    StryderItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.STRYDER = STRYDER;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '2d6 + @abilities.Agility.value + @abilities.speed.value + @initiative.bonus',
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

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Hotbar macros
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

  $(document).off("click", ".ability-dodge-evade-mod");

  $(document).on("click", ".ability-dodge-evade-mod", async function(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const appId = this.closest(".app")?.dataset.appid;
    const app = ui.windows[appId];
    const actor = app?.actor || app?.object?.actor || app?.object;
    
    if (!actor) return ui.notifications.error("No character selected!");

    const currentStamina = actor.system.stamina?.value;
    if (currentStamina === undefined) return;
    if (currentStamina < 1) {
      return ui.notifications.warn(`${actor.name} doesn't have enough Stamina!`);
    }

    try {
      const rollFormula = this.dataset.customRoll;
      const flavor = this.dataset.label;
      const roll = new Roll(rollFormula, actor.system);
      
      await roll.evaluate({async: true});

      await actor.update({"system.stamina.value": currentStamina - 1});
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
          <p style="margin-bottom: 0; border-top: 1px solid #c9a66b; padding-top: 5px;">${actor.name} spent 1 Stamina.</p>
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
