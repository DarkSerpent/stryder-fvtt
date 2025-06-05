import {
    SYSTEM_ID,
    STRYDER
} from '../helpers/constants.mjs';
import {
    StryderHooks
} from '../helpers/hooks.mjs';

export const ALLIED = 'allied';
export const ENEMY = 'enemy';

/**
 * Combat event class for Stryder system
 */
export class CombatEvent {
    constructor(type, round, combatants) {
        this.type = type;
        this.round = round;
        this.combatants = combatants;
    }

    forCombatant(combatant) {
        this.combatant = combatant;
        return this;
    }

    get token() {
        return this.combatant?.token;
    }

    get actor() {
        return this.combatant?.actor;
    }

    get actors() {
        return this.combatants.map(c => c.actor).filter(a => a);
    }
}

/**
 * Stryder Combat class - faction-based combat system
 */
export class StryderCombat extends Combat {
    static get combatEvent() {
        return {
            startOfCombat: 'startOfCombat',
            endOfCombat: 'endOfCombat',
            startOfRound: 'startOfRound',
            endOfRound: 'endOfRound',
            startOfTurn: 'startOfTurn',
            endOfTurn: 'endOfTurn'
        };
    }

    get nextCombatant() {
        return null;
    }

    async rollInitiative(ids, options) {
        return this;
    }

    get combatant() {
        const id = this.getFlag(SYSTEM_ID, STRYDER.flags.CombatantId);
        return id != null ? this.combatants.get(id) : null;
    }

    async setCombatant(combatant) {
        return this.setFlag(SYSTEM_ID, STRYDER.flags.CombatantId, combatant?.id ?? null);
    }

    get currentRoundTurnsTaken() {
        const allRoundsTurnsTaken = this.getTurnsTaken();
        return allRoundsTurnsTaken[this.round] ?? [];
    }

    getTurnsTaken() {
        return this.getFlag(SYSTEM_ID, STRYDER.flags.CombatantsTurnTaken) ?? {};
    }

    async setTurnsTaken(flag) {
        return this.setFlag(SYSTEM_ID, STRYDER.flags.CombatantsTurnTaken, flag);
    }

    get totalTurns() {
        return this.combatants.reduce((sum, combatant) => sum + combatant.totalTurns, 0);
    }

    async startCombat() {
        const factions = [{
                value: ALLIED,
                translation: 'Ally Phase'
            },
            {
                value: ENEMY,
                translation: 'Enemy Phase'
            }
        ];

        const firstTurnFaction = await Dialog.prompt({
            title: game.i18n.localize('Selecting Starting Phase'),
            content: await renderTemplate('systems/stryder/templates/combat/dialog-first-turn.hbs', {
                factions
            }),
            callback: html => html.find('select[name=faction]').val()
        });

        if (!firstTurnFaction) return this;

        await this.update({
            round: 1
        });
        await this.setFirstTurn(firstTurnFaction);
        await this.setCurrentTurn(firstTurnFaction);

        Hooks.callAll('stryderCombatEvent',
            new CombatEvent(StryderCombat.combatEvent.startOfCombat, this.round, this.combatants));

        return super.startCombat();
    }

    async endCombat() {
        const ended = await super.endCombat();
        if (ended) {
            Hooks.callAll('stryderCombatEvent',
                new CombatEvent(StryderCombat.combatEvent.endOfCombat, this.round, this.combatants));
        }
        return ended;
    }

    async _manageTurnEvents(adjustedTurn) {
        if (!game.users.activeGM?.isSelf) return;

        let prior = undefined;
        if (this.previous) {
            prior = this.combatants.get(this.previous.combatantId);
        }

        if (Number.isNumeric(adjustedTurn)) {
            await this.update({
                turn: adjustedTurn
            }, {
                turnEvents: false
            });
        }

        if (!this.started) return;

        const advanceRound = this.current.round > (this.previous.round ?? -1);
        const advanceTurn = this.current.turn > (this.previous.turn ?? -1);
        if (!(advanceTurn || advanceRound)) return;

        if (prior) {
            await this._onEndTurn(prior);
        }

        if (advanceRound && this.previous.round !== null) {
            await this._onEndRound();
        }

        if (advanceRound) {
            await this._onStartRound();
        }
    }

    async startTurn(combatant) {
        if (!combatant || !this.started) return;

		// Various warnings just in case this ever comes up
        const currentTurn = this.getCurrentTurn();
        if (combatant.faction !== currentTurn) {
            return ui.notifications.warn(`It's not the ${combatant.faction} phase yet!`);
        }

        if (!combatant.canTakeTurn) {
            return ui.notifications.warn(`${combatant.name} can't take a turn right now!`);
        }

        // Set this combatant as active
        await this.setCombatant(combatant);

        Hooks.callAll('stryderCombatEvent',
            new CombatEvent(StryderCombat.combatEvent.startOfTurn, this.round, this.combatants)
            .forCombatant(combatant));

        this.notifyCombatTurnChange();
    }

    notifyCombatTurnChange() {
        Hooks.callAll('combatTurnChange', this, this.previous, this.current);
    }

    async endTurn(combatant) {
        if (!combatant || !this.started) return;

        // Mark this combatant as having taken their turn
        const flag = this.getTurnsTaken();
        flag[this.round] ??= [];
        flag[this.round].push(combatant.id);
        await this.setTurnsTaken(flag);

        // Clear current combatant
        await this.setCombatant(null);

        Hooks.callAll('stryderCombatEvent',
            new CombatEvent(StryderCombat.combatEvent.endOfTurn, this.round, this.combatants)
            .forCombatant(combatant));

        // Check if all combatants of current faction have taken their turns
        const currentTurn = this.getCurrentTurn();
        const factionCombatants = this.combatants.filter(c => c.faction === currentTurn);
        const turnsTaken = this.currentRoundTurnsTaken;

        const allFactionActed = factionCombatants.every(c =>
            turnsTaken.includes(c.id) || !c.canTakeTurn
        );

        if (allFactionActed) {
            // Switch to next faction
            const nextTurn = currentTurn === ALLIED ? ENEMY : ALLIED;
            await this.setCurrentTurn(nextTurn);

            // Check if all factions have acted
            const allCombatants = this.combatants.filter(c => c.canTakeTurn);
            const allActed = allCombatants.every(c =>
                turnsTaken.includes(c.id)
            );

            if (allActed) {
                await this.nextRound();
            }
        }

        this.notifyCombatTurnChange();
    }

    get isTurnStarted() {
        return this.combatant != null;
    }

    populateData(data) {
        data.hasCombatStarted = this.started;
        data.currentTurn = this.getCurrentTurn();
        data.totalTurns = this.combatants.reduce((agg, combatant) => {
            agg[combatant.id] = combatant.totalTurns;
            return agg;
        }, {});
        data.turnsLeft = this.countTurnsLeft();
        data.turnStarted = this.isTurnStarted;
        data.combatant = this.combatant;
        data.isGM = game.user?.isGM;
    }

    countTurnsLeft() {
        const countTurnsTaken = this.currentRoundTurnsTaken.reduce((agg, currentValue) => {
            agg[currentValue] = (agg[currentValue] ?? 0) + 1;
            return agg;
        }, {});

        return this.combatants.reduce((agg, combatant) => {
            agg[combatant.id] = combatant.totalTurns - (countTurnsTaken[combatant.id] ?? 0);
            return agg;
        }, {});
    }

    determineNextTurn() {
        if (!this.started) return undefined;

        const lastCombatant = this.currentRoundTurnsTaken
            .map(id => this.combatants.get(id))
            .findLast(c => c?.faction);

        if (lastCombatant) {
            const lastTurn = lastCombatant.faction;
            const nextTurn = lastTurn === ENEMY ? ALLIED : ENEMY;
            let turnsNotTaken = this.currentRoundTurnsLeft;

            if (this.settings.skipDefeated) {
                turnsNotTaken = turnsNotTaken.filter(c => !c.isDefeated);
            }

            const factionsWithTurnsLeft = turnsNotTaken.map(c => c.faction);
            return factionsWithTurnsLeft.includes(nextTurn) ? nextTurn : lastTurn;
        } else {
            return this.getFirstTurn();
        }
    }

    get currentRoundTurnsLeft() {
        const countTurnsTaken = this.currentRoundTurnsTaken.reduce((agg, currentValue) => {
            agg[currentValue] = (agg[currentValue] ?? 0) + 1;
            return agg;
        }, {});

        return this.combatants.filter(c => (countTurnsTaken[c.id] ?? 0) < c.totalTurns);
    }

    getCurrentTurn() {
        return this.getFlag(SYSTEM_ID, STRYDER.flags.CurrentTurn);
    }

    async setCurrentTurn(flag) {
        if (game.user === game.users.activeGM) {
            return flag ?
                this.setFlag(SYSTEM_ID, STRYDER.flags.CurrentTurn, flag) :
                this.unsetFlag(SYSTEM_ID, STRYDER.flags.CurrentTurn);
        }
    }

    async nextTurn() {
        await this.setCurrentTurn(this.determineNextTurn());

        const turnsTaken = this.currentRoundTurnsTaken.map(id => this.combatants.get(id));
        let turnsNotTaken = this.currentRoundTurnsLeft;

        if (this.settings.skipDefeated) {
            turnsNotTaken = turnsNotTaken.filter(c => !c.isDefeated);
        }

        const next = turnsNotTaken.length ? turnsTaken.length : null;
        let round = this.round;

        if (this.round === 0 || next === null) {
            return this.nextRound();
        }

        const updateData = {
            round,
            turn: next
        };
        const updateOptions = {
            advanceTime: CONFIG.time.turnTime,
            direction: 1
        };
        Hooks.callAll('combatTurn', this, updateData, updateOptions);

        return this.update(updateData, updateOptions);
    }

    async nextRound() {
        await this.setCurrentTurn(this.getFirstTurn());

        let turn = this.turn === null ? null : 0;
        let advanceTime = Math.max(this.totalTurns - this.turn, 0) * CONFIG.time.turnTime;
        advanceTime += CONFIG.time.roundTime;
        let nextRound = this.round + 1;

        const updateData = {
            round: nextRound,
            turn
        };
        const updateOptions = {
            advanceTime,
            direction: 1
        };
        Hooks.callAll('combatRound', this, updateData, updateOptions);

        Hooks.callAll('stryderCombatEvent',
            new CombatEvent(StryderCombat.combatEvent.endOfRound, this.round, this.combatants));

        return this.update(updateData, updateOptions);
    }

    getFirstTurn() {
        return this.getFlag(SYSTEM_ID, STRYDER.flags.FirstTurn);
    }

    async setFirstTurn(flag) {
        return this.setFlag(SYSTEM_ID, STRYDER.flags.FirstTurn, flag);
    }

    get actors() {
        return Array.from(this.combatants.map(c => c.actor));
    }

    static showTurnsFor(combatant) {
        if (game.user?.isGM || combatant.actor.isOwner || combatant.actor.type === 'character') return true;
        const showTurnsMode = game.settings.get(SYSTEM_ID, 'optionCombatHudShowNPCTurnsLeftMode');
        return showTurnsMode !== 'never';
    }

    hasActor(actor) {
        return this.actors.includes(actor);
    }

    static get hasActiveEncounter() {
        return !!game.combat;
    }

    static get activeEncounter() {
        return game.combat;
    }
}