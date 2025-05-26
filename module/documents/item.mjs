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
		range = "<strong>Range:</strong> Melee<br>";
	} else if (item.system.range > 0) {
		range = `<strong>Range:</strong> ${item.system.range} meters<br>`;
	} else if (item.system.range === null || item.system.range === undefined) {
		range = ``;
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
		tag1 = `${item.system.tag1}`;
	}

	let tag2 = "";
	if (item.system.tag2 === null || item.system.tag2 === "" || item.system.tag2 === undefined) {
		tag2 = "";
	} else {
		tag2 = `${item.system.tag2}`;
	}

	let tag3 = "";
	if (item.system.tag3 === null || item.system.tag3 === "" || item.system.tag3 === undefined) {
		tag3 = "";
	} else {
		tag3 = `${item.system.tag3}`;
	}

	let itemType = item.type === "feature"       ? "Class Feature"   :
				   item.type === "racial"        ? "Folk Ability"    :
				   item.type === "hex"           ? "Hex"             :
				   item.type === "skill"         ? "Skill"           :
				   item.type === "statperk"      ? "Stat Perk"       :
				   item.type === "technique"     ? "Technique"       :
				   item.type === "profession"    ? "Profession"      :
				   item.type === "action"        ? "Action"          :
				   item.type === "fantasm"       ? "Fantasm"         :
				   item.type === "armament"      ? "Soul Armament"   :
				   item.type === "generic"       ? "Attack"          :
				   item.type === "loot"          ? "Loot"            :
				   item.type === "component"     ? "Component"       :
				   item.type === "consumable"    ? "Consumable"      :
				   item.type === "gear"          ? "Gear"            :
				   item.type === "aegiscore"     ? "Aegis Core"      :
				   item.type === "legacies"      ? "Soul Stone & Legacy" :
				   item.type === "head"          ? "Head Item"       :
				   item.type === "back"          ? "Back Item"       :
				   item.type === "arms"          ? "Arms Item"       :
				   item.type === "legs"          ? "Legs Item"       :
				   item.type === "gems"          ? "Gem"             :
				   item.type === "bonds"         ? "Bond"            :
				   item.type === "passive"       ? "Passive"         :
				   item.type === "miscellaneous" ? "Miscellaneous"   :
				   "";

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

	let bondLevel = "Esoteric";
	if (item.system.bond && item.system.bond.level) {
	  bondLevel = item.system.bond.level;
	}

	let bondFolk = "Unknown";
	if (item.system.bond && item.system.bond.folk) {
	  bondFolk = item.system.bond.folk;
	}

	let bondGender = "Unknown";
	if (item.system.bond && item.system.bond.gender) {
	  bondGender = item.system.bond.gender;
	}

	let bondAge = "No Age Entered";
	if (item.system.bond && item.system.bond.age) {
	  bondAge = item.system.bond.age;
	}

	let miscellaneous_type = "Unknown";
	if (item.system.itemtype) {
	  miscellaneous_type = item.system.itemtype;
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
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
		${(tag1 || tag2 || tag3) ? `
		  <div class="chat-message-tags">
			${tag1 ? `<span class="chat-message-tag">${tag1}</span>` : ''}
			${tag2 ? `<span class="chat-message-tag">${tag2}</span>` : ''}
			${tag3 ? `<span class="chat-message-tag">${tag3}</span>` : ''}
		  </div>
		` : ''}
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Action:</span>
		  <span>${actionType}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cooldown:</span>
		  <span>${cooldown}</span>
		</div>
		${range ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Range:</span>
			<span>${range.replace('<strong>Range:</strong> ', '').replace('<br>', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLhex = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
		${(tag1 || tag2 || tag3) ? `
		  <div class="chat-message-tags">
			${tag1 ? `<span class="chat-message-tag">${tag1}</span>` : ''}
			${tag2 ? `<span class="chat-message-tag">${tag2}</span>` : ''}
			${tag3 ? `<span class="chat-message-tag">${tag3}</span>` : ''}
		  </div>
		` : ''}
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Aspect:</span>
		  <span>${hexAspect}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Element:</span>
		  <span>${hexElement}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Action:</span>
		  <span>${actionType}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cooldown:</span>
		  <span>${cooldown}</span>
		</div>
		${range ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Range:</span>
			<span>${range.replace('<strong>Range:</strong> ', '').replace('<br>', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div><br />
	`;

	let contentHTMLracial = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
		${(tag1 || tag2 || tag3) ? `
		  <div class="chat-message-tags">
			${tag1 ? `<span class="chat-message-tag">${tag1}</span>` : ''}
			${tag2 ? `<span class="chat-message-tag">${tag2}</span>` : ''}
			${tag3 ? `<span class="chat-message-tag">${tag3}</span>` : ''}
		  </div>
		` : ''}
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Action:</span>
		  <span>${actionType}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cooldown:</span>
		  <span>${cooldown}</span>
		</div>
		${charges ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Charges:</span>
			<span>${charges.replace('<strong>Charges:</strong> ', '').replace('<br />', '')}</span>
		  </div>
		` : ''}
		${range ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Range:</span>
			<span>${range.replace('<strong>Range:</strong> ', '').replace('<br>', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLstat = `
	<div class="chat-message-card" style="text-align: center;">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-content" style="padding: 0 15px;">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	async function createCollapsibleSection(title, content) {
	  if (!content) return '';
	  const enriched = await TextEditor.enrichHTML(content, {async: true});
	  return `
		<div class="collapsible-section">
		  <button type="button" class="collapsible-toggle">${title} <i class="fas fa-caret-down"></i></button>
		  <div class="collapsible-content" style="display: none;">
			<div class="collapsible-inner">${enriched}</div>
		  </div>
		</div>
	  `;
	}

	function createResourceSpendButton(item) {
	  const hasStaminaCost = item.system.stamina_cost > 0;
	  const hasManaCost = item.system.mana_cost > 0;
	  
	  if (!hasStaminaCost && !hasManaCost) return '';

	  let buttonText = 'Spend Resources';
	  if (hasStaminaCost && hasManaCost) {
		buttonText = `Spend <span style="font-family: 'Varela Round';">${item.system.stamina_cost}</span> <span style="color: #147c32; font-weight: bold;">Stamina</span> and <span style="font-family: 'Varela Round';">${item.system.mana_cost}</span> <span style="color: #08acff; font-weight: bold;">Mana</span>`;
	  } else if (hasStaminaCost) {
		buttonText = `Spend <span style="font-family: 'Varela Round';">${item.system.stamina_cost}</span> <span style="color: #147c32; font-weight: bold;">Stamina</span>`;
	  } else if (hasManaCost) {
		buttonText = `Spend <span style="font-family: 'Varela Round';">${item.system.mana_cost}</span> <span style="color: #08acff; font-weight: bold;">Mana</span>`;
	  }

	  return `
		<div class="resource-spend-container" style="margin: 5px 0; text-align: center;">
		  <button class="resource-spend-button" 
				  data-stamina-cost="${item.system.stamina_cost || 0}"
				  data-mana-cost="${item.system.mana_cost || 0}">
			${buttonText}
		  </button>
		</div>
	  `;
	}

	function handleResourceSpend(event) {
	  event.preventDefault();
	  const button = event.currentTarget;
	  const staminaCost = parseInt(button.dataset.staminaCost) || 0;
	  const manaCost = parseInt(button.dataset.manaCost) || 0;

	  // Get the currently controlled tokens
	  const controlledTokens = canvas.tokens.controlled;
	  
	  if (controlledTokens.length === 0) {
		ui.notifications.warn("No character selected! Please select a token first.");
		return;
	  }

	  const token = controlledTokens[0];
	  const actor = token.actor;
	  
	  if (!actor) {
		ui.notifications.error("Selected token has no associated actor!");
		return;
	  }

	  // Check if the actor has enough resources
	  let canAfford = true;
	  let warningMessage = "";

	  if (staminaCost > 0) {
		if (actor.system.stamina?.value === undefined) {
		  ui.notifications.warn("Selected character doesn't have stamina to spend!");
		  return;
		}
		if (actor.system.stamina.value < staminaCost) {
		  canAfford = false;
		  warningMessage += `Not enough Stamina (${actor.system.stamina.value}/${staminaCost})`;
		}
	  }

	  if (manaCost > 0) {
		if (actor.system.mana?.value === undefined) {
		  ui.notifications.warn("Selected character doesn't have mana to spend!");
		  return;
		}
		if (actor.system.mana.value < manaCost) {
		  canAfford = false;
		  if (warningMessage) warningMessage += " and ";
		  warningMessage += `Not enough Mana (${actor.system.mana.value}/${manaCost})`;
		}
	  }

	  if (!canAfford) {
		ui.notifications.warn(`Not enough resources to spend! ${warningMessage}`);
		return;
	  }

	  // Prepare updates
	  const updates = {};
	  let hasResources = false;

	  if (staminaCost > 0 && actor.system.stamina?.value !== undefined) {
		updates['system.stamina.value'] = Math.max(0, actor.system.stamina.value - staminaCost);
		hasResources = true;
	  }

	  if (manaCost > 0 && actor.system.mana?.value !== undefined) {
		updates['system.mana.value'] = Math.max(0, actor.system.mana.value - manaCost);
		hasResources = true;
	  }

	  // Apply updates if there are any
		if (hasResources && Object.keys(updates).length > 0) {
		  actor.update(updates).then(() => {
			ui.notifications.info(`Resources spent for ${actor.name}!`);
			// Disable the button after clicking
			button.disabled = true;
			button.textContent = "Resources Spent";
			
			// Create chat message content
			let messageContent;
			if (staminaCost > 0 && manaCost > 0) {
			  messageContent = `${actor.name} spent ${staminaCost} Stamina and ${manaCost} Mana.`;
			} else if (staminaCost > 0) {
			  messageContent = `${actor.name} spent ${staminaCost} Stamina.`;
			} else if (manaCost > 0) {
			  messageContent = `${actor.name} spent ${manaCost} Mana.`;
			} else {
			  messageContent = `${actor.name} spent resources.`;
			}
			
			// Create chat message
			const chatData = {
			  user: game.user.id,
			  speaker: ChatMessage.getSpeaker({ actor: actor }),
			  content: messageContent,
			  type: CONST.CHAT_MESSAGE_TYPES.OTHER,
			  sound: CONFIG.sounds.notification,
			  flags: {
				core: {
				  canPopout: true
				}
			  }
			};
			
			chatData.content = `
			  <div style="background: url('systems/stryder/assets/parchment.jpg'); 
						  background-size: cover; 
						  padding: 15px; 
						  border: 1px solid #c9a66b; 
						  border-radius: 3px;">
				<h3 style="margin-top: 0; border-bottom: 1px solid #c9a66b;"><strong>Resource Expenditure</strong></h3>
				<p>${messageContent}</p>
			  </div>
			`;
			
			ChatMessage.create(chatData);
			
		  }).catch(err => {
			console.error("Error spending resources:", err);
			ui.notifications.error("Failed to spend resources!");
		  });
		}
	}

	Hooks.once('renderChatMessage', (message, html, data) => {
	  html.find('.resource-spend-button').click(handleResourceSpend);
	});

	let section1 = await createCollapsibleSection("Level 1 - Novice", item.system.novice);
	let section2 = await createCollapsibleSection("Level 2 - Journeyman", item.system.journeyman);
	let section3 = await createCollapsibleSection("Level 3 - Master", item.system.master);
	let section4 = await createCollapsibleSection("Profession Kit", item.system.extra);

	let contentHTMLprofession = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Level:</span>
		  <span>${professionLevel}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	  
	  ${section1}
	  ${section2}
	  ${section3}
	  ${section4}
	</div>
	`;

	let contentHTMLbonds = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details" style="text-align: center;">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Bond Level:</span>
		  <span>${bondLevel}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content" style="text-align: center;">
		${item.system.description ?? ''}
	  </div>
	  
	  <div style="font-size: 13px; color: #5c3a21; border-top: 1px solid #c0a070; padding-top: 10px; margin-top: 15px; display: flex; justify-content: space-around; gap: 10px; font-family: 'MedievalSharp', cursive;">
		<div><strong>Folk:</strong> ${bondFolk}</div>
		<div><strong>Gender:</strong> ${bondGender}</div>
		<div><strong>Age:</strong> ${bondAge}</div>
	  </div>
	</div>
	`;

	let contentHTMLfantasm = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>1 Focus</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLaction = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
		${(tag1 || tag2 || tag3) ? `
		  <div class="chat-message-tags">
			${tag1 ? `<span class="chat-message-tag">${tag1}</span>` : ''}
			${tag2 ? `<span class="chat-message-tag">${tag2}</span>` : ''}
			${tag3 ? `<span class="chat-message-tag">${tag3}</span>` : ''}
		  </div>
		` : ''}
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Action:</span>
		  <span>${actionType}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div><br />
	`;

	let contentHTMLarmament = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Form:</span>
		  <span>${armamentForm}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div><br />
	`;

	let contentHTMLgeneric = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Parent Ability:</span>
		  <span>${parentAbility}</span>
		</div>
		${range ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Range:</span>
			<span>${range.replace('<strong>Range:</strong> ', '').replace('<br>', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div><br />
	`;

	let contentHTMLpassive = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">Passive Ability</div>
	  </div>
	  
	  <div class="chat-message-content" style="text-align: center; font-style: italic;">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLmiscellaneous = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Type:</span>
		  <span>${miscellaneous_type}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLloot = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Rarity:</span>
		  <span style="color: ${getRarityColor(rarity)}; font-weight: bold;">${rarity}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Value:</span>
		  <span>${sell_price}</span>
		</div>
	  </div
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLcomponent = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Grade:</span>
		  <span style="font-family: 'Cinzel Decorative'; font-weight: bold;">${grade_rank}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Value:</span>
		  <span>${sell_price}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLconsumable = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Rarity:</span>
		  <span style="color: ${getRarityColor(rarity)}; font-weight: bold;">${rarity}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Nature:</span>
		  <span>${nature}</span>
		</div>
		${charges ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Charges:</span>
			<span>${charges.replace('<strong>Charges:</strong> ', '').replace('<br />', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Value:</span>
		  <span>${sell_price}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLgear = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Quality:</span>
		  <span style="font-weight: bold;">${quality}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Nature:</span>
		  <span>${nature}</span>
		</div>
		${charges ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Charges:</span>
			<span>${charges.replace('<strong>Charges:</strong> ', '').replace('<br />', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Value:</span>
		  <span>${sell_price}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-details" style="margin-top: 15px; border-top: 1px dashed #c0a070; padding-top: 10px;">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Action:</span>
		  <span>${actionType}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cooldown:</span>
		  <span>${cooldown}</span>
		</div>
		${range ? `
		  <div class="chat-message-detail-row">
			<span class="chat-message-detail-label">Range:</span>
			<span>${range.replace('<strong>Range:</strong> ', '').replace('<br>', '')}</span>
		  </div>
		` : ''}
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Cost:</span>
		  <span>${manacost}, ${staminacost}${othercost}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	let contentHTMLaegiscore = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-content" style="text-align: center; font-style: italic;">
		${item.system.description ?? ''}
	  </div>
	</div>
	`;

	function getRarityColor(rarity) {
	  const colors = {
		common: '#7a7a7a',
		uncommon: '#2e8b57',
		rare: '#4169e1',
		legendary: '#daa520',
		'one of a kind': '#ff4500'
	  };
	  return colors[rarity.toLowerCase()] || '#5c2b0a';
	}

	let contentHTMLlegacies = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Rarity:</span>
		  <span style="color: ${getRarityColor(rarity)}; font-weight: bold;">${rarity}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Nature:</span>
		  <span>${nature}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	  
	  <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #c0a070; font-size: 12px; color: #5c3a21; text-align: center;">
		<i class="fas fa-scroll"></i> Soul Item - Bound to Character's Soul
	  </div>
	</div>
	`;

	let contentHTMLequippable = `
	<div class="chat-message-card">
	  <div class="chat-message-header">
		<div style="text-align: center; margin-bottom: 10px;">
		  <img src="${item.img}" style="width: 50px; height: 50px; border: 2px solid #8b5a2b; border-radius: 50%; object-fit: cover; background: rgba(255, 248, 220, 0.8);">
		</div>
		<div class="chat-message-title">${item.name}</div>
		<div class="chat-message-subtitle">${itemType}</div>
	  </div>
	  
	  <div class="chat-message-details">
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Rarity:</span>
		  <span style="color: ${getRarityColor(rarity)}">${rarity}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Nature:</span>
		  <span>${nature}</span>
		</div>
		<div class="chat-message-detail-row">
		  <span class="chat-message-detail-label">Value:</span>
		  <span>${sell_price}</span>
		</div>
	  </div>
	  
	  <div class="chat-message-content">
		${item.system.description ?? ''}
	  </div>
	  
	  <div style="margin-top: 15px; padding: 8px; background: rgba(139, 90, 43, 0.1); border-radius: 4px; text-align: center; font-family: 'MedievalSharp', cursive; font-size: 14px;">
		<i class="fas fa-tshirt"></i> Equippable Item - ${getEquipmentSlot(item.type)}
	  </div>
	</div>
	`;

	function getEquipmentSlot(itemType) {
	  const slots = {
		head: "Head Slot",
		back: "Back Slot", 
		arms: "Arms Slot",
		legs: "Legs Slot",
		gems: "Gem Socket"
	  };
	  return slots[itemType] || "Equipment Slot";
	}

	Hooks.on("renderChatMessage", (message, html, data) => {
	  html[0].querySelectorAll(".collapsible-toggle").forEach(button => {
		button.addEventListener("click", () => {
		  const content = button.nextElementSibling;
		  if (content) {
			content.classList.toggle("hidden");
		  }
		});
	  });
	});

    // If there's no roll data, send a chat message.
		if (item.type === "feature" || item.type === "skill" || item.type === "technique") {
		  const resourceButton = createResourceSpendButton(item);

		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: contentHTML + resourceButton
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

			const resourceButton = createResourceSpendButton(item);

			// Construct the roll formula.
			const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');

			// Create the roll using the constructed formula.
			const roll = new Roll(formula);
			await roll.evaluate({async: true}); // Evaluate the roll asynchronously.

			// Send the result of the roll to the chat.
			roll.toMessage({
				speaker: speaker,
				flavor: contentHTMLhex + resourceButton,
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
					
					if (!item.actor || !item.actor.system.abilities.Arcana) {
						console.error("Actor or Arcana ability not found for this item.");
						return;
					}

					let arcanaValue = item.actor.system.abilities.Arcana.value;
					let masteryBonus = item.system.hex.addsMastery ? item.actor.system.attributes.mastery : 0;
					let baseDamage = Math.ceil(arcanaValue * damageMultiplier);
					const totalDamage = baseDamage + masteryBonus;

					const combinedMessage = `
					<div style="margin-bottom: 5px;">
						<div class="hex-quality-message" style="
						  background: rgba(75, 0, 130, 0.15);
						  border: 1px solid #4b0082;
						  border-radius: 5px;
						  padding: 8px 12px;
						  margin-bottom: 5px;
						  text-align: center;
						  font-family: 'Cinzel Decorative', cursive;
						  color: #4b0082;
						  text-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
						">
						  <strong>Always Excellent Hex</strong> - Perfect execution guaranteed.
						</div>
						<div class="damage-quality excellent">
						  You casted a <strong>${quality} Hex!</strong> If the Hex deals damage, you did <strong>${totalDamage}</strong> damage.
						</div>
					</div>
					`;
					
					ChatMessage.create({
						speaker: speaker,
						content: combinedMessage,
						whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
					});
				} else {
					// Determine quality based on roll result
					if (result <= 4) {
						quality = "Poor";
						damageMultiplier = 0.5;
					} else if (result >= 5 && result <= 10) {
						quality = "Good";
						damageMultiplier = 1.0;
					} else if (result >= 11) {
						quality = "Excellent";
						damageMultiplier = 1.5;
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

					const qualityMessage = `
					<div class="damage-quality ${quality.toLowerCase()}">
					  You casted a <strong>${quality} Hex!</strong> If the Hex deals damage, you did <strong>${totalDamage}</strong> damage.
					</div>
					`;
					ChatMessage.create({
						speaker: speaker,
						content: qualityMessage,
						whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
					});
				}
			}

			// Return the roll object for further processing if necessary.
			return roll;
		}
		else if (item.type === "passive") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: contentHTMLpassive
		  });
		}
		else if (item.type === "miscellaneous") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: contentHTMLmiscellaneous
		  });
		}
		else if (item.type === "racial") {
		  const resourceButton = createResourceSpendButton(item);

		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: contentHTMLracial + resourceButton
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
		else if (item.type === "bonds") {
		  ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			content: contentHTMLbonds
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

		  const resourceButton = createResourceSpendButton(item);

		  const shouldSkipRoll = !diceNum || diceNum === 0;

		  if (shouldSkipRoll) {
			const cleanedContent = contentHTMLaction.replace(/<br \/>$/, '');
			
			ChatMessage.create({
			  speaker: speaker,
			  rollMode: rollMode,
			  content: cleanedContent + resourceButton
			});
			return;
		  }

		  const actor = game.actors.get(speaker.actor);

		  if (actor) {
			if (isNaN(diceBonus) && typeof diceBonus === 'string') {
			  let attributePath;
			  if (diceBonus === "mastery") {
				attributePath = "attributes.mastery";
			  } else if (diceBonus === "might" || diceBonus === "magyk" || diceBonus === "speed" || diceBonus === "instinct") {
				attributePath = `abilities.${diceBonus}.value`;
			  } else if (diceBonus === "power") {
				attributePath = `abilities.Power.value`;
			  } else if (diceBonus === "agility") {
				attributePath = `abilities.Agility.value`;
			  } else if (diceBonus === "grit") {
				attributePath = `abilities.Grit.value`;
			  } else if (diceBonus === "arcana") {
				attributePath = `abilities.Arcana.value`;
			  } else if (diceBonus === "intuition") {
				attributePath = `abilities.Intuition.value`;
			  } else if (diceBonus === "will") {
				attributePath = `abilities.Will.value`;
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
			flavor: contentHTMLaction.replace(/<br \/>$/, '') + resourceButton, // Remove last <br /> here too
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
				if (result <= 4) {
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
			const qualityMessage = `
			<div class="damage-quality ${quality.toLowerCase()}">
			  <strong>${quality} Attack!</strong> The attack did <strong>${totalDamage}</strong> damage.
			</div>
			`;
			ChatMessage.create({
				speaker: speaker,
				content: qualityMessage,
				whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
			});

			// Return the roll object for further processing if necessary
			return roll;
		}
		else if (item.type === "generic") {
			const diceNum = item.system.roll.diceNum;
			const diceSize = item.system.roll.diceSize;
			let diceBonus = item.system.roll.diceBonus;
			const baseDamageAmp = item.system.roll.baseDamageAmp || 0;
			const rawDamageAmp = item.system.roll.rawDamageAmp || 0;

			const resourceButton = createResourceSpendButton(item);

			const actor = item.actor;
			if (!actor) {
				console.error("No actor associated with this item:", item);
				return;
			}

			if (typeof diceBonus === 'string' && isNaN(parseInt(diceBonus))) {
				let attributePath;
				const attributeMapping = {
					mastery: "attributes.mastery",
					might: "abilities.might.value",
					magyk: "abilities.magyk.value",
					speed: "abilities.speed.value",
					instinct: "abilities.instinct.value",
					power: "abilities.Power.value",
					agility: "abilities.Agility.value",
					grit: "abilities.Grit.value",
					arcana: "abilities.Arcana.value",
					intuition: "abilities.Intuition.value",
					will: "abilities.Will.value"
				};

				attributePath = attributeMapping[diceBonus] || `attributes.talent.${diceBonus}.value`;

				const attributeValue = getProperty(actor.system, attributePath);
				diceBonus = attributeValue !== undefined ? attributeValue : 0;
				if (attributeValue === undefined) {
					console.error(`Attribute ${diceBonus} not found on actor. Path tried: ${attributePath}`);
					console.log(`Actor system object:`, actor.system);
				}
			} else {
				diceBonus = parseInt(diceBonus) || 0;
			}

			const formula = `${diceNum}d${diceSize}` + (diceBonus ? `+${diceBonus}` : '');
			const roll = new Roll(formula);
			await roll.evaluate({async: true});
			roll.toMessage({
				speaker: speaker,
				flavor: contentHTMLgeneric + resourceButton,
				rollMode: rollMode
			});

			let result = roll.total;
			let quality;
			let damageMultiplier;
			if (result <= 4) {
				quality = "Poor";
				damageMultiplier = 0.5;
			} else if (result >= 5 && result <= 10) {
				quality = "Good";
				damageMultiplier = 1.0;
			} else if (result >= 11) {
				quality = "Excellent";
				damageMultiplier = 1.5;
			}

			let totalDamage;
			let powerValue = actor.system.abilities.Power?.value || actor.system.abilities.might?.value || 0;
			if (item.system.enableCustomDamage && item.system.customDamage[quality.toLowerCase()] !== null && item.system.customDamage[quality.toLowerCase()] !== undefined && item.system.customDamage[quality.toLowerCase()] !== "") {
				totalDamage = parseInt(item.system.customDamage[quality.toLowerCase()]);
			} else {
				const adjustedPower = powerValue + baseDamageAmp;
				if (quality === "Excellent") {
					totalDamage = Math.ceil(adjustedPower * damageMultiplier);
				} else {
					totalDamage = Math.floor(adjustedPower * damageMultiplier);
				}
			}
			totalDamage += rawDamageAmp;

			const qualityMessage = `
			<div class="damage-quality ${quality.toLowerCase()}">
			  <strong>${quality} Attack!</strong> The attack did <strong>${totalDamage}</strong> damage.
			</div>
			`;
			ChatMessage.create({
				speaker: speaker,
				content: qualityMessage,
				whisper: rollMode === "blindroll" ? ChatMessage.getWhisperRecipients("GM") : []
			});

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
