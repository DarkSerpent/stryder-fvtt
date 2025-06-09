import { SYSTEM_ID, STRYDER } from '../helpers/constants.mjs';
import { ALLIED, ENEMY } from './combat.mjs';

export class StryderCombatTracker extends CombatTracker {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "combat",
      template: "systems/stryder/templates/combat/combat-tracker.hbs",
      title: "DOCUMENT.Combats",
      document: "Combat"
    });
  }

	async getData(options) {
	  const data = await super.getData(options);
	  
	  if (data.combat) {
		data.factions = {
		  [ALLIED]: [],
		  [ENEMY]: []
		};

		const combatants = data.combat.combatants.contents;
		combatants.sort((a, b) => {
		  if (a.faction !== b.faction) {
			return a.faction === ALLIED ? -1 : 1;
		  }
		  return a.name.localeCompare(b.name);
		});

		const currentTurn = data.combat.getCurrentTurn();
		const turnsTaken = data.combat.currentRoundTurnsTaken || [];
		const activeCombatant = data.combat.combatant;
		
		// Get all combatants who have started but not finished their turns
		const activeTurnCombatants = data.combat.combatants.filter(c => 
		  c.isActiveTurn && c.id !== activeCombatant?.id
		);
		
		combatants.forEach(combatant => {
		  if (combatant.faction) {
			combatant._canTakeTurn = combatant.faction === currentTurn && 
									!turnsTaken.includes(combatant.id) && 
									combatant.canTakeTurn;
									
			combatant._isActive = activeCombatant?.id === combatant.id;
			combatant._isActiveTurn = activeTurnCombatants.some(c => c.id === combatant.id);
			
			// Check if user can control this combatant
			const isGM = game.user.isGM;
			const isOwner = combatant.actor?.testUserPermission(game.user, "OWNER") ?? false;
			combatant._canControl = isGM || isOwner;
			
			// Set CSS classes
			combatant.css = '';
			if (combatant._isActive) {
			  combatant.css += 'started-turn';
			} 
			if (combatant._isActiveTurn) {
			  combatant.css += ' active-turn';
			}
			if (combatant.isDefeated) {
			  combatant.css += ' defeated';
			}
			
			data.factions[combatant.faction].push(combatant);
		  }
		});

		data.currentTurn = currentTurn;
		data.hasCombat = !!data.combat;
		data.combatCount = game.combats?.size || 0;
		data.user = game.user;
	  }
	  
	  return data;
	}

  activateListeners(html) {
    super.activateListeners(html);

	// Start Turn button
	html.find('.combatant-control[data-action="startTurn"]').click(ev => {
		const li = $(ev.currentTarget).parents('.combatant');
		const combat = this.viewed;
		const combatant = combat?.combatants.get(li.data('combatant-id'));
		if (combatant) combat.startTurn(combatant);
	});

	// End Turn button
	html.find('.combatant-control[data-action="endTurn"]').click(ev => {
		const li = $(ev.currentTarget).parents('.combatant');
		const combat = this.viewed;
		const combatant = combat?.combatants.get(li.data('combatant-id'));
		if (combatant) combat.endTurn(combatant);
	});
  
    
	// Toggle Defeated status
	html.find('.combatant-control[data-control="toggleDefeated"]').click(ev => {
		const li = $(ev.currentTarget).parents('.combatant');
		const combat = this.viewed;
		const combatant = combat?.combatants.get(li.data('combatant-id'));
		if (combatant) combatant.toggleDefeated();
	});

  }
}