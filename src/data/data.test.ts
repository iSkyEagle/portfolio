import { describe, expect, it } from 'vitest';
import { demos, getDemo } from './demos';
import { filterProjects, getProject, projects } from './projects';
import { skills } from './skills';

const routes = ['/', '/competences', '/demos', '/demos/banc', '/demos/reservation', '/projets', '/parcours'];

describe('cohérence des données', () => {
  it('donne un identifiant unique à chaque fiche, compétence et démo', () => {
    for (const list of [projects, skills, demos]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('rattache chaque fiche à au moins une compétence existante', () => {
    const known = skills.map((s) => s.id);
    for (const p of projects) {
      expect(p.skills.length, p.id).toBeGreaterThan(0);
      for (const s of p.skills) expect(known, p.id).toContain(s);
    }
  });

  it('appuie chaque compétence sur au moins deux preuves', () => {
    for (const s of skills) expect(s.proofs.length, s.id).toBeGreaterThanOrEqual(2);
  });

  it('ne laisse aucune preuve pointer vers une page ou une fiche inexistante', () => {
    for (const s of skills) {
      for (const proof of s.proofs) {
        if (/^https:\/\//.test(proof.to)) continue;
        const [path] = proof.to.split('#');
        const fiche = path.match(/^\/projets\/(.+)$/);
        if (fiche) expect(getProject(fiche[1]), proof.to).toBeDefined();
        else expect(routes, proof.to).toContain(path);
      }
    }
  });

  it('relie chaque compétence à une démo qui existe', () => {
    for (const s of skills) {
      if (s.demoId) expect(getDemo(s.demoId), s.id).toBeDefined();
    }
  });
});

describe('filterProjects', () => {
  it('renvoie toutes les fiches sans filtre', () => {
    expect(filterProjects(projects, null)).toHaveLength(projects.length);
  });

  it('ne garde que les fiches de la compétence demandée', () => {
    const result = filterProjects(projects, 'agents');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.skills.includes('agents'))).toBe(true);
  });
});
