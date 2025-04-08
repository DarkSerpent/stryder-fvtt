import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class StryderActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['stryder', 'sheet', 'actor'],
      width: 600,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/stryder/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    if (actorData.type == 'monster') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    context.gearSlotsUsed = this._calculateGearSlotsUsed();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  _calculateGearSlotsUsed() {
    const gearItems = this.actor.items.filter(i => i.type === 'gear');
    return gearItems.reduce((total, item) => {
      return total + parseInt(item.system.inventory_size || 1);
    }, 0);
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.STRYDER.abilities[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const actions = [];
    const armament = [];
    const generic = [];
    const aegiscore = [];
    const legacies = [];
    const head = [];
    const back = [];
    const arms = [];
    const legs = [];
    const gems = [];
    const loot = [];
    const component = [];
    const consumable = [];
    const gear = [];
    const fantasms = [];
    const hexes = [];
    const skills = [];
    const features = [];
    const racials = [];
    const statperks = [];
    const techniques = [];
    const professions = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to actions.
      if (i.type === 'action') {
        actions.push(i);
      }
      // Append to armament.
      if (i.type === 'armament') {
        armament.push(i);
      }
      // Append to generic attack.
      if (i.type === 'generic') {
        generic.push(i);
      }
      // Append to aegiscore.
      if (i.type === 'aegiscore') {
        aegiscore.push(i);
      }
      // Append to legacies.
      if (i.type === 'legacies') {
        legacies.push(i);
      }
      // Append to head.
      if (i.type === 'head') {
        head.push(i);
      }
      // Append to back.
      if (i.type === 'back') {
        back.push(i);
      }
      // Append to arms.
      if (i.type === 'arms') {
        arms.push(i);
      }
      // Append to legs.
      if (i.type === 'legs') {
        legs.push(i);
      }
      // Append to gems.
      if (i.type === 'gems') {
        gems.push(i);
      }
      // Append to loot.
      if (i.type === 'loot') {
        loot.push(i);
      }
      // Append to component.
      if (i.type === 'component') {
        component.push(i);
      }
      // Append to consumable.
      if (i.type === 'consumable') {
        consumable.push(i);
      }
      // Append to gear.
      if (i.type === 'gear') {
        gear.push(i);
      }
      // Append to fantasms.
      if (i.type === 'fantasm') {
        fantasms.push(i);
      }
      // Append to hexes.
      else if (i.type === 'hex') {
        hexes.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to racials.
      else if (i.type === 'racial') {
        racials.push(i);
      }
      // Append to statperks.
      else if (i.type === 'statperk') {
        statperks.push(i);
      }
      // Append to techniques.
      else if (i.type === 'technique') {
        techniques.push(i);
      }
      // Append to professions.
      else if (i.type === 'profession') {
        professions.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.actions = actions;
    context.armament = armament;
    context.generic = generic;
    context.aegiscore = aegiscore;
    context.legacies = legacies;
    context.head = head;
    context.back = back;
    context.arms = arms;
    context.legs = legs;
    context.gems = gems;
    context.loot = loot;
    context.component = component;
    context.consumable = consumable;
    context.gear = gear;
    context.fantasms = fantasms;
    context.hexes = hexes;
    context.skills = skills;
    context.features = features;
    context.racials = racials;
    context.statperks = statperks;
    context.techniques = techniques;
    context.professions = professions;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
	async _onItemCreate(event) {
	  event.preventDefault();
	  const header = event.currentTarget;

	  // Get the type of item to create.
	  const type = header.dataset.type;

	  // Check if the item is a loot and if adding it would exceed the limit
	  if (type === 'loot') {
		const lootItems = this.actor.items.filter(i => i.type === 'loot');
		if (lootItems.length >= 24) {
		  let message = game.i18n.localize('<b>Notice:</b> Your "Loot" slots are full! Please drop an item or move one to storage before adding another.');
		  ChatMessage.create({
			content: message,
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			whisper: [game.user.id]
		  });
		  return;
			}
		} else if (type === 'component') {
			const componentItems = this.actor.items.filter(i => i.type === 'component');
			if (componentItems.length >= 10) {
				let message = game.i18n.localize('<b>Notice:</b> Your "Component" slots are full! Please drop an item or move one to storage before adding another.');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'consumable') {
			const consumableItems = this.actor.items.filter(i => i.type === 'consumable');
			if (consumableItems.length >= 6) {
				let message = game.i18n.localize('<b>Notice:</b> Your "Consumable" slots are full! Please drop an item or move one to storage before adding another.');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
			} else if (type === 'gear') {
				const gearItems = this.actor.items.filter(i => i.type === 'gear');
				const gearInventorySizeUsed = gearItems.reduce((acc, item) => {
					return acc + parseInt(item.system.inventory_size || 1);
				}, 0);

				const newItemSize = parseInt(header.dataset.inventorySize || 1);
				if (gearInventorySizeUsed + newItemSize > 4) {
					let message = game.i18n.localize('<b>Notice:</b> Your "Gear" slots are full! Please drop an item or move one to storage before adding another.');
					ChatMessage.create({
						content: message,
						speaker: ChatMessage.getSpeaker({ actor: this.actor }),
						whisper: [game.user.id]
					});
					return;
				}
		} else if (type === 'legacies') {
			const legaciesItems = this.actor.items.filter(i => i.type === 'legacies');
			if (legaciesItems.length >= 3) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 3 Legacies!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'head') {
			const headItems = this.actor.items.filter(i => i.type === 'head');
			if (headItems.length >= 1) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 1 Head item in your Head Slot!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'back') {
			const backItems = this.actor.items.filter(i => i.type === 'back');
			if (backItems.length >= 1) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 1 Back item in your Back Slot!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'arms') {
			const armsItems = this.actor.items.filter(i => i.type === 'arms');
			if (armsItems.length >= 1) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 1 Arm item in your Arms Slot!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'legs') {
			const legsItems = this.actor.items.filter(i => i.type === 'legs');
			if (legsItems.length >= 1) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 1 Leg item in your Legs Slot!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		} else if (type === 'gems') {
			const gemsItems = this.actor.items.filter(i => i.type === 'gems');
			if (gemsItems.length >= 2) {
				let message = game.i18n.localize('<b>Notice:</b> You cannot equip more than 2 Gems!');
				ChatMessage.create({
					content: message,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					whisper: [game.user.id]
				});
				return;
			}
		}

	  // Continue to create the item if it's not loot or doesn't exceed the limit
	  const data = duplicate(header.dataset);
	  const name = `New ${type.capitalize()}`;
	  const itemData = {
		name: name,
		type: type,
		system: data,
	  };
	  delete itemData.system['type'];

	  return await Item.create(itemData, { parent: this.actor });
	}

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }
}
