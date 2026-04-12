import { SKILLS, SkillDef, SkillRarity } from '../data/skills';
import { SKILL_RARITY_WEIGHTS } from '../config';
import { RunState } from './RunState';

export interface SkillChoiceInfo {
  skill: SkillDef;
  evolutionProgress?: { current: number; required: number; evolvesTo: string };
}

export class SkillManager {
  getRandomSkillChoices(runState: RunState, count: number = 3): SkillDef[] {
    const adjustedCount = count + runState.skillChoiceBonus;

    // Collect conflict IDs from currently owned skills (mutually-exclusive pairs)
    const ownedConflicts = new Set<string>();
    for (const owned of runState.skills) {
      if (owned.skill.conflictsWith) {
        for (const id of owned.skill.conflictsWith) ownedConflicts.add(id);
      }
    }

    const available = SKILLS.filter(skill => {
      // Legendary skills never appear in the pool
      if (skill.rarity === 'legendary') return false;

      // Exclude skills that conflict with anything already owned
      if (ownedConflicts.has(skill.id)) return false;

      const active = runState.skills.find(s => s.skill.id === skill.id);
      if (!active) return true;
      return skill.stackable && active.stacks < skill.maxStacks;
    });

    if (available.length <= adjustedCount) return [...available];

    const choices: SkillDef[] = [];
    const pool = [...available];

    for (let i = 0; i < adjustedCount && pool.length > 0; i++) {
      const rarity = this.rollRarity();
      const matching = pool.filter(s => s.rarity === rarity);
      const source = matching.length > 0 ? matching : pool;
      const index = Math.floor(Math.random() * source.length);
      const chosen = source[index];
      choices.push(chosen);
      pool.splice(pool.indexOf(chosen), 1);
    }

    return choices;
  }

  getEvolutionInfo(skill: SkillDef, runState: RunState): SkillChoiceInfo['evolutionProgress'] | undefined {
    if (!skill.evolvesTo || !skill.evolveStacks) return undefined;
    const active = runState.skills.find(s => s.skill.id === skill.id);
    const current = active ? active.stacks : 0;
    const evolvedSkill = SKILLS.find(s => s.id === skill.evolvesTo);
    return {
      current,
      required: skill.evolveStacks,
      evolvesTo: evolvedSkill?.name ?? skill.evolvesTo,
    };
  }

  private rollRarity(): SkillRarity {
    const total = SKILL_RARITY_WEIGHTS.normal + SKILL_RARITY_WEIGHTS.rare + SKILL_RARITY_WEIGHTS.epic;
    const roll = Math.random() * total;
    if (roll < SKILL_RARITY_WEIGHTS.normal) return 'normal';
    if (roll < SKILL_RARITY_WEIGHTS.normal + SKILL_RARITY_WEIGHTS.rare) return 'rare';
    return 'epic';
  }
}
