import { SKILLS, SkillDef, SkillRarity } from '../data/skills';
import { SKILL_RARITY_WEIGHTS } from '../config';
import { RunState } from './RunState';

export class SkillManager {
  getRandomSkillChoices(runState: RunState, count: number = 3): SkillDef[] {
    const available = SKILLS.filter(skill => {
      const active = runState.skills.find(s => s.skill.id === skill.id);
      if (!active) return true;
      return skill.stackable && active.stacks < skill.maxStacks;
    });

    if (available.length <= count) return [...available];

    const choices: SkillDef[] = [];
    const pool = [...available];

    for (let i = 0; i < count && pool.length > 0; i++) {
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

  private rollRarity(): SkillRarity {
    const total = SKILL_RARITY_WEIGHTS.normal + SKILL_RARITY_WEIGHTS.rare + SKILL_RARITY_WEIGHTS.epic;
    const roll = Math.random() * total;
    if (roll < SKILL_RARITY_WEIGHTS.normal) return 'normal';
    if (roll < SKILL_RARITY_WEIGHTS.normal + SKILL_RARITY_WEIGHTS.rare) return 'rare';
    return 'epic';
  }
}
