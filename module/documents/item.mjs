/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class StryderItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = { ...super.getRollData() };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `${item.name}`;

	let actionType = "";
	if (item.system.action_type === "focused" || item.system.action_type === undefined) {
		actionType = "Focused";
	} else if (item.system.action_type === "swift") {
		actionType = "Swift";
	} else if (item.system.action_type === "passive") {
		actionType = "Passive";
	}

	let cooldown = "";
	if (item.system.cooldown_value === null || item.system.cooldown_value === undefined) {
		cooldown = `No cooldown entered.`;
	} else if (item.system.cooldown_value === 0) {
		cooldown = `None.`;
	} else if (item.system.cooldown_unit === "turn") {
		cooldown = `${item.system.cooldown_value} Turn(s)`;
	} else if (item.system.cooldown_unit === "round") {
		cooldown = `${item.system.cooldown_value} Round(s)`;
	} else if (item.system.cooldown_unit === "perRest") {
		cooldown = `${item.system.cooldown_value} per Rest`;
	} else if (item.system.cooldown_unit === "perTurn") {
		cooldown = `${item.system.cooldown_value} per Turn`;
	} else if (item.system.cooldown_unit === "perRound") {
		cooldown = `${item.system.cooldown_value} per Round`;
	} else if (item.system.cooldown_unit === "perSpring") {
		cooldown = `${item.system.cooldown_value} per Spring of Life`;
	}

	let range = "";
	if (item.system.range === 0) {
		range = "Melee";
	} else if (item.system.range > 0) {
		range = `${item.system.range} meters`;
	} else if (item.system.range === null || item.system.range === undefined) {
		range = `No range entered.`;
	}

	let manacost = "";
	if (item.system.mana_cost === null || item.system.mana_cost === 0 || item.system.mana_cost === undefined) {
		manacost = "0 mana";
	} else if (item.system.mana_cost > 0) {
		manacost = `${item.system.mana_cost} mana`;
	}

	let staminacost = "";
	if (item.system.stamina_cost === null || item.system.stamina_cost === 0 || item.system.stamina_cost === undefined) {
		staminacost = "0 stamina";
	} else if (item.system.stamina_cost > 0) {
		staminacost = `${item.system.stamina_cost} stamina`;
	}

	let othercost = "";
	if (item.system.other_restrictions === null || item.system.other_restrictions === 0 || item.system.other_restrictions === "" || item.system.other_restrictions === undefined) {
		othercost = "";
	} else {
		othercost = `, ${item.system.other_restrictions}`;
	}

	let tag1 = "";
	if (item.system.tag1 === null || item.system.tag1 === "" || item.system.tag1 === undefined) {
		tag1 = "";
	} else {
		tag1 = `[${item.system.tag1}]`;
	}

	let tag2 = "";
	if (item.system.tag2 === null || item.system.tag2 === "" || item.system.tag2 === undefined) {
		tag2 = "";
	} else {
		tag2 = `, [${item.system.tag2}]`;
	}

	let tag3 = "";
	if (item.system.tag3 === null || item.system.tag3 === "" || item.system.tag3 === undefined) {
		tag3 = "";
	} else {
		tag3 = `, [${item.system.tag3}]`;
	}

	let itemType = item.type === "feature" ? "Class Feature" : item.type === "racial" ? "Folk Ability" : item.type === "hex" ? "Hex" : item.type === "skill" ? "Skill" : item.type === "statperk" ? "Stat Perk" : item.type === "technique" ? "Technique" : item.type === "profession" ? "Profession" : item.type === "action" ? "Action" : item.type === "armament" ? "Soul Armament" : item.type === "generic" ? "Generic Attack" : item.type === "loot" ? "Loot" : item.type === "component" ? "Component" : item.type === "consumable" ? "Consumable" : item.type === "gear" ? "Gear" : item.type === "aegiscore" ? "Aegis Core" : item.type === "legacies" ? "Legacy" : item.type === "head" ? "Head Item" : item.type === "back" ? "Back Item" : item.type === "arms" ? "Arms Item" : item.type === "legs" ? "Legs Item" : item.type === "gems" ? "Gem" : "";

	let hexAspect = "";
	if (item.system.aspect === null || item.system.aspect === undefined || item.system.aspect === "") {
		hexAspect = "None.";
	} else {
		hexAspect = `${item.system.aspect}`;
	}

	let hexElement = "";
	if (item.system.element === null || item.system.element === undefined || item.system.element === "") {
		hexElement = "None.";
	} else {
		hexElement = `${item.system.element}`;
	}

	let professionLevel = "";
	if (item.system.profession_level === null || item.system.profession_level === undefined || item.system.profession_level === 0) {
		professionLevel = "No experience.";
	} else {
		professionLevel = `${item.system.profession_level}`;
	}

	let armamentForm = "";
	if (item.system.form === null || item.system.form === undefined || item.system.form === "") {
		armamentForm = "Formless";
	} else {
		armamentForm = `${item.system.form}`;
	}

	let parentAbility = "";
	if (item.system.parent_ability === null || item.system.parent_ability === undefined || item.system.parent_ability === "") {
		parentAbility = "No derived ability.";
	} else {
		parentAbility = `${item.system.parent_ability}`;
	}

	let rarity = "";
	if (item.system.rarity === null || item.system.rarity === undefined || item.system.rarity === "") {
		rarity = "No Rarity";
	} else if (item.system.rarity === "common") {
		rarity = `Common`;
	} else if (item.system.rarity === "uncommon") {
		rarity = `Uncommon`;
	} else if (item.system.rarity === "rare") {
		rarity = `Rare`;
	} else if (item.system.rarity === "legendary") {
		rarity = `Legendary`;
	} else if (item.system.rarity === "one of a kind") {
		rarity = `One of a Kind`;
	}

	let grade_rank = "";
	if (item.system.grade === null || item.system.grade === undefined || item.system.grade === "") {
		grade_rank = "Gradeless.";
	} else if (item.system.grade === "G4") {
		grade_rank = `Rank 4`;
	} else if (item.system.grade === "G3") {
		grade_rank = `Rank 3`;
	} else if (item.system.grade === "G2") {
		grade_rank = `Rank 2`;
	} else if (item.system.grade === "G1") {
		grade_rank = `Rank 1`;
	} else if (item.system.grade === "G0") {
		grade_rank = `Mythic`;
	}

	let nature = "";
	if (item.system.nature === null || item.system.nature === undefined || item.system.nature === "") {
		nature = "Esoteric";
	} else if (item.system.nature === "enchanted") {
		nature = `Enchanted`;
	} else if (item.system.nature === "magytech") {
		nature = `Magytech`;
	} else if (item.system.nature === "other") {
		nature = `Other`;
	}

	let quality = "";
	if (item.system.quality === null || item.system.quality === undefined || item.system.quality === "") {
		quality = "Qualityless";
	} else if (item.system.quality === "prototype") {
		quality = `Prototype`;
	} else if (item.system.quality === "improved") {
		quality = `Improved`;
	} else if (item.system.quality === "perfect") {
		quality = `Perfect`;
	}

	let charges = "";
	if (item.system.charges && (item.system.charges.max === null || item.system.charges.max === undefined || item.system.charges.max === 0)) {
		charges = "";
	} else if (item.system.charges) {
		charges = `<strong>Charges:</strong> ` + item.system.charges.value + `/` + item.system.charges.max + `<br />`;
	}

	let sell_price = "";
	if (item.system.sell_price === null || item.system.sell_price === undefined || item.system.sell_price === 0) {
		sell_price = "No value.";
	} else {
		sell_price = `${item.system.sell_price} Grail`;
	}

	let contentHTML = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px; font-family: Modesto Condensed">${tag1} ${tag2} ${tag3}</div>
		<div style="margin-bottom: 10px;">
			<strong>Action:</strong> ${actionType}<br>
			<strong>Cooldown:</strong> ${cooldown}<br>
			<strong>Range:</strong> ${range}<br>
			<strong>Cost:</strong> ${manacost}, ${staminacost}${othercost}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLhex = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px; font-family: Modesto Condensed">${tag1} ${tag2} ${tag3}</div>
		<div style="margin-bottom: 10px;">
			<strong>Aspect:</strong> ${hexAspect}<br>
			<strong>Element:</strong> ${hexElement}<br><br>
			<strong>Action:</strong> ${actionType}<br>
			<strong>Cooldown:</strong> ${cooldown}<br>
			<strong>Range:</strong> ${range}<br>
			<strong>Cost:</strong> ${manacost}, ${staminacost}${othercost}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLracial = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px; font-family: Modesto Condensed">${tag1} ${tag2} ${tag3}</div>
		<div style="margin-bottom: 10px;">
			<strong>Action:</strong> ${actionType}<br>
			<strong>Cooldown:</strong> ${cooldown}<br>
			${charges}
			<strong>Range:</strong> ${range}<br>
			<strong>Cost:</strong> ${manacost}, ${staminacost}${othercost}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLstat = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLprofession = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Level:</strong> ${professionLevel}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLfantasm = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Cost:</strong> 1 focus<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLaction = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px; font-family: Modesto Condensed">${tag1} ${tag2} ${tag3}</div>
		<div style="margin-bottom: 10px;">
			<strong>Action:</strong> ${actionType}<br>
			<strong>Cost:</strong> ${manacost}, ${staminacost}${othercost}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLarmament = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Form:</strong> ${armamentForm}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLgeneric = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Parent Ability:</strong> ${parentAbility}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLloot = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Rarity:</strong> ${rarity}<br>
			<strong>Sell Price:</strong> ${sell_price}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLcomponent = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Grade:</strong> ${grade_rank}<br>
			<strong>Sell Price:</strong> ${sell_price}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLconsumable = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Rarity:</strong> ${rarity}<br>
			<strong>Nature:</strong> ${nature}<br>
			${charges}
			<strong>Sell Price:</strong> ${sell_price}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLgear = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Quality:</strong> ${quality}<br>
			<strong>Nature:</strong> ${nature}<br>
			${charges}
			<strong>Sell Price:</strong> ${sell_price}<br>
			<br>
			<strong>Action:</strong> ${actionType}<br>
			<strong>Cooldown:</strong> ${cooldown}<br>
			<strong>Range:</strong> ${range}<br>
			<strong>Cost:</strong> ${manacost}, ${staminacost}${othercost}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLaegiscore = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLlegacies = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Rarity:</strong> ${rarity}<br>
			<strong>Nature:</strong> ${nature}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

	let contentHTMLequippable = `
	<div style="background-image: url('systems/stryder/assets/parchment.jpg'); background-color: #f9f9f9; border: 2px solid #ddd; border-radius: 5px; padding: 10px;">
		<div style="position: relative; left: 40%"><img src="${item.img}" width="50" height="50"></div>
		<div style="text-align: center; font-size: 20px; font-weight: bold;">${item.name}</div>
		<div style="font-style: italic; margin-bottom: 10px;">${itemType}</div>
		<div style="margin-bottom: 10px;">
			<strong>Rarity:</strong> ${rarity}<br>
			<strong>Nature:</strong> ${nature}<br>
			<strong>Sell Price:</strong> ${sell_price}<br>
		</div>
		<div>${item.system.description ?? ''}</div>
	</div>
	`;

    // If there's no roll data, send a chat message.
		if (item.type === "feature" || item.type === "skill" || item.type === "technique") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTML
		  });
		}
		// Handle the case where item.type is "hex"
		else if (item.type === "hex_old") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLhex
		  });
		}
		else if (item.type === "hex") {
			// Retrieve the necessary properties to construct the roll formula.
			const diceNum = item.system.roll.diceNum;
			const diceSize = item.system.roll.diceSize;
			const diceBonus = item.system.roll.diceBonus;

			// Construct the roll formula.
			const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');

			// Create the roll using the constructed formula.
			const roll = new Roll(formula);
			await roll.evaluate({async: true}); // Evaluate the roll asynchronously.

			// Send the result of the roll to the chat.
			roll.toMessage({
				speaker: speaker,
				flavor: contentHTMLhex,
				rollMode: rollMode
			});

			// If rollsDamage is true, proceed with additional chat messages.
			if (item.system.hex.rollsDamage) {
				let result = roll.total;
				let quality, damageMultiplier;
				
				// Check if alwaysRollsExcellent is true
				if (item.system.hex.alwaysRollsExcellent) {
					quality = "Excellent";
					damageMultiplier = 1.5;
					const excellentMessage = `<strong>Always Excellent Hex!</strong> This hex always performs at its best!`;
					ChatMessage.create({
						speaker: speaker,
						content: excellentMessage,
						whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
					});
				} else {
					// Determine quality based on roll result
					if (result >= 2 && result <= 4) {
						quality = "Poor";
						damageMultiplier = 0.5;
					} else if (result >= 5 && result <= 10) {
						quality = "Good";
						damageMultiplier = 1.0;
					} else if (result >= 11) {
						quality = "Excellent";
						damageMultiplier = 1.5;
					}
				}

				if (!item.actor || !item.actor.system.abilities.Arcana) {
					console.error("Actor or Arcana ability not found for this item.");
					return;
				}

				let arcanaValue = item.actor.system.abilities.Arcana.value;
				let masteryBonus = item.system.hex.addsMastery ? item.actor.system.attributes.mastery : 0;
				let baseDamage = Math.floor(arcanaValue * damageMultiplier);
				if (quality === "Excellent") {
					baseDamage = Math.ceil(arcanaValue * damageMultiplier);
				}
				const totalDamage = baseDamage + masteryBonus;

				const qualityMessage = `You casted a <strong>${quality} Hex!</strong> If the Hex deals damage, you did ${totalDamage} damage.`;
				ChatMessage.create({
					speaker: speaker,
					content: qualityMessage,
					whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
				});
			}

			// Return the roll object for further processing if necessary.
			return roll;
		}
		else if (item.type === "racial") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLracial
		  });
		}
		else if (item.type === "statperk") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLstat
		  });
		}
		else if (item.type === "profession") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLprofession
		  });
		}
		else if (item.type === "fantasm") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLfantasm
		  });
		}
		else if (item.type === "loot") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLloot
		  });
		}
		else if (item.type === "component") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLcomponent
		  });
		}
		else if (item.type === "consumable") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLconsumable
		  });
		}
		else if (item.type === "gear") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLgear
		  });
		}
		else if (item.type === "aegiscore") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLaegiscore
		  });
		}
		else if (item.type === "legacies") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLlegacies
		  });
		}
		else if (item.type === "head" || item.type === "back" || item.type === "arms" || item.type === "legs" || item.type === "gems") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLequippable
		  });
		}
		else if (item.type === "action") {
		  const diceNum = item.system.roll.diceNum;
		  const diceSize = item.system.roll.diceSize;
		  let diceBonus = item.system.roll.diceBonus;

		  const actor = game.actors.get(speaker.actor);

		if (actor) {
			if (isNaN(diceBonus) && typeof diceBonus === 'string') {
				let attributePath;
				if (diceBonus === "mastery") {
					attributePath = "attributes.mastery";
				} else {
					attributePath = `attributes.talent.${diceBonus}.value`;
				}

				const attributeValue = getProperty(actor.system, attributePath);

				if (attributeValue !== undefined) {
					diceBonus = attributeValue;
				} else {
					console.error(`Attribute ${diceBonus} not found on actor. Path tried: ${attributePath}`);
					console.log(`Actor system object:`, actor.system);
					diceBonus = 0;
				}
			}
		} else {
			console.error("Actor not found for the speaker with ID:", speaker.actor);
			diceBonus = 0;
		}

		  const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');
		  const roll = new Roll(formula);
		  await roll.evaluate({async: true});
		  roll.toMessage({
			speaker: speaker,
			flavor: contentHTMLaction,
			rollMode: rollMode
		  });

		  return roll;
		}
		else if (item.type === "armament") {
			// Retrieve the necessary properties to construct the roll formula.
			const diceNum = item.system.roll.diceNum;
			const diceSize = item.system.roll.diceSize;
			const diceBonus = item.system.roll.diceBonus;
			const baseDamageAmp = item.system.roll.baseDamageAmp || 0;
			const rawDamageAmp = item.system.roll.rawDamageAmp || 0;

			// Construct the roll formula.
			const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');

			// Create the roll using the constructed formula.
			const roll = new Roll(formula);
			await roll.evaluate({async: true}); // Evaluate the roll asynchronously.

			// Send the result of the roll to the chat.
			roll.toMessage({
				speaker: speaker,
				flavor: contentHTMLarmament,
				rollMode: rollMode
			});

			// Determine the quality of the roll based on the total, unless alwaysRollsExcellent is true
			let result = roll.total;
			let quality;
			let damageMultiplier;
			if (item.system.armament.alwaysRollsExcellent) {
				quality = "Excellent";
				damageMultiplier = 1.5;
			} else {
				if (result >= 2 && result <= 4) {
					quality = "Poor";
					damageMultiplier = 0.5;
				} else if (result >= 5 && result <= 10) {
					quality = "Good";
					damageMultiplier = 1.0;
				} else if (result >= 11) {
					quality = "Excellent";
					damageMultiplier = 1.5;
				}
			}

			if (!item.actor || (!item.actor.system.abilities.Power && !item.actor.system.abilities.Arcana)) {
				console.error("Actor or necessary abilities not found for this item.");
				return;
			}

			// Validate if armament is a Witchblade to choose the correct ability
			const abilityType = item.system.armament.isWitchblade ? "Arcana" : "Power";
			const abilityValue = item.actor.system.abilities[abilityType].value;

			let baseDamage;
			const adjustedPower = abilityValue + baseDamageAmp; // Add baseDamageAmp before multiplier
			if (quality === "Poor") {
				baseDamage = Math.floor(adjustedPower * damageMultiplier);
			} else if (quality === "Excellent") {
				baseDamage = Math.ceil(adjustedPower * damageMultiplier);
			} else {
				baseDamage = Math.floor(adjustedPower * damageMultiplier);
			}

			// Add mastery bonus if applicable
			const masteryBonus = item.system.armament.addsMastery ? item.actor.system.attributes.mastery : 0;
			const totalDamage = baseDamage + rawDamageAmp + masteryBonus; // Add rawDamageAmp and mastery bonus after multiplier

			// Create follow-up chat message
			const qualityMessage = `<strong>${quality} Attack:</strong> The attack did ${totalDamage} damage.`;
			ChatMessage.create({
				speaker: speaker,
				content: qualityMessage,
				whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
			});

			// Return the roll object for further processing if necessary
			return roll;
		}
		else if (item.type === "generic") {
		  // Retrieve the necessary properties to construct the roll formula.
		  const diceNum = item.system.roll.diceNum;
		  const diceSize = item.system.roll.diceSize;
		  const diceBonus = item.system.roll.diceBonus;
		  const baseDamageAmp = item.system.roll.baseDamageAmp || 0;  // Default to 0 if not defined
		  const rawDamageAmp = item.system.roll.rawDamageAmp || 0;    // Default to 0 if not defined

		  // Construct the roll formula.
		  const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');

		  // Create the roll using the constructed formula.
		  const roll = new Roll(formula);
		  await roll.evaluate({async: true}); // Evaluate the roll asynchronously.

		  // Send the result of the roll to the chat.
		  roll.toMessage({
			speaker: speaker,
			flavor: contentHTMLgeneric,
			rollMode: rollMode
		  });

		  // Determine the quality of the roll based on the total
		  let result = roll.total;
		  let quality;
		  let damageMultiplier;
		  if (result >= 2 && result <= 4) {
			quality = "Poor";
			damageMultiplier = 0.5;
		  } else if (result >= 5 && result <= 10) {
			quality = "Good";
			damageMultiplier = 1.0;
		  } else if (result >= 11) {
			quality = "Excellent";
			damageMultiplier = 1.5;
		  }

		  // Ensure the Actor exists and has the necessary properties
		  if (!item.actor || !item.actor.system.abilities.Power) {
			console.error("Actor or Power ability not found for this item.");
			return;
		  }

		  // Calculate the damage using Power value from the Actor
		  const powerValue = item.actor.system.abilities.Power.value;
		  const adjustedPower = powerValue + baseDamageAmp; // Add baseDamageAmp before multiplier
		  let baseDamage;
		  if (quality === "Poor") {
			baseDamage = Math.floor(adjustedPower * damageMultiplier);
		  } else if (quality === "Excellent") {
			baseDamage = Math.ceil(adjustedPower * damageMultiplier);
		  } else {
			baseDamage = Math.floor(adjustedPower * damageMultiplier);
		  }
		  const totalDamage = baseDamage + rawDamageAmp; // Add rawDamageAmp after multiplier

		  // Create follow-up chat message
		  const qualityMessage = `<strong>${quality} Attack:</strong> The attack did ${totalDamage} damage.`;
		  ChatMessage.create({
			speaker: speaker,
			content: qualityMessage,
			whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
		  });

		  // Return the roll object for further processing if necessary.
		  return roll;
		}
		// Handle all other cases that don't match the above conditions
		else {
		  // This could be a default action or error handling
		  console.log("Unhandled item type:", item.type);
		  // Optionally, you can create a generic chat message or take no action
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: "An item of an unspecified type was used."
		  });
		}
  }
}
