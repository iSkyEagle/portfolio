import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import published from '../../../banc/resultats.json';
import { BenchDemo } from './BenchDemo';
import { fixture } from './fixture';
import { agreement, hasData, modelName, percent, pickSample, type BenchResults } from './logic';

const renderDemo = (results: BenchResults) =>
  render(
    <MemoryRouter>
      <BenchDemo results={results} />
    </MemoryRouter>,
  );

describe('pickSample', () => {
  it('sert d\'abord les désaccords entre jugement humain et contrôles', () => {
    const sample = pickSample(fixture, 2);
    // a2 : validée par les contrôles mais à corriger. b2 : signalée par les contrôles mais gardée.
    expect(sample.map((q) => q.id)).toEqual(['a2', 'b2']);
  });

  it('ne dépasse pas le nombre de questions disponibles et ne répète rien', () => {
    const sample = pickSample(fixture, 20);
    expect(sample).toHaveLength(6);
    expect(new Set(sample.map((q) => q.id)).size).toBe(6);
  });

  it('donne toujours le même échantillon', () => {
    expect(pickSample(fixture, 4).map((q) => q.id)).toEqual(pickSample(fixture, 4).map((q) => q.id));
  });

  it('écarte les questions illisibles', () => {
    const broken = structuredClone(fixture);
    broken.questions[0].mesures.format_valide = false;
    expect(pickSample(broken, 20).some((q) => q.id === 'a1')).toBe(false);
  });
});

describe('agreement', () => {
  it('compte les accords avec la notation humaine et avec les contrôles', () => {
    // a1 : humain garder, contrôles ok. a3 : humain jeter, contrôles ko. b2 : humain garder, contrôles ko.
    const result = agreement(fixture, { a1: 'garder', a3: 'corriger', b2: 'jeter' });
    expect(result).toEqual({ judged: 3, withHuman: 1, withChecks: 3 });
  });

  it('ne compare pas au jugement humain quand rien n\'est noté', () => {
    const bare = { ...fixture, notes: {} };
    expect(agreement(bare, { a1: 'garder' }).withHuman).toBeNull();
  });
});

describe('affichage', () => {
  it('formate les noms et les pourcentages', () => {
    expect(modelName('mistral:latest')).toBe('mistral');
    expect(modelName('qwen2.5:7b')).toBe('qwen2.5:7b');
    expect(percent(1, 3)).toBe('33 %');
    expect(percent(0, 0)).toBe('–');
  });
});

describe('page du banc', () => {
  it('masque le modèle tant que le visiteur n\'a pas jugé, puis révèle tout', async () => {
    const user = userEvent.setup();
    renderDemo(fixture);
    expect(screen.getByText('Énoncé a2 ?')).toBeInTheDocument();
    expect(screen.queryByText(/alpha/)).not.toBeInTheDocument();
    expect(screen.queryByText('Deux réponses possibles.', { exact: false })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'La garder' }));
    const reveal = screen.getAllByRole('status').find((el) => el.className === 'bench-reveal')!;
    expect(reveal).toHaveTextContent('Vous : la garder. Moi : la corriger.');
    expect(reveal).toHaveTextContent('Modèle : alpha');
    expect(reveal).toHaveTextContent('Deux réponses possibles.');
    expect(within(reveal).getByRole('list', { name: 'Contrôles automatiques' })).toBeInTheDocument();
    // Le jugement est figé : plus de boutons de verdict.
    expect(screen.queryByRole('button', { name: 'La jeter' })).not.toBeInTheDocument();
  });

  it('affiche les résultats par modèle et le croisement', async () => {
    const user = userEvent.setup();
    renderDemo(fixture);
    await user.click(screen.getByRole('button', { name: 'La corriger' }));
    await user.click(screen.getByRole('button', { name: 'Passer aux résultats' }));

    expect(screen.getByText(/Votre avis rejoint le mien sur/)).toHaveTextContent('rejoint le mien sur 1');
    const table = screen.getByRole('table', { name: /par modèle/ });
    expect(within(table).getByRole('columnheader', { name: /alpha/ })).toBeInTheDocument();
    const row = within(table).getByRole('row', { name: /Tous les contrôles réussis/ });
    expect(row).toHaveTextContent('2 / 4');
    expect(row).toHaveTextContent('50 %');
    expect(screen.getByRole('table', { name: /Croisement/ })).toBeInTheDocument();
    expect(screen.getByText(/concordent dans/)).toHaveTextContent('67 %');
  });

  it('n\'affiche ni croisement ni avis humain sans notation', async () => {
    const user = userEvent.setup();
    const bare: BenchResults = { ...fixture, notes: {}, comparaison: { ...fixture.comparaison, questions_notees: 0, accord: null } };
    renderDemo(bare);
    expect(screen.getByText(/en cours/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'La garder' }));
    expect(screen.getByText(/Je ne l'ai pas encore notée/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Passer aux résultats' }));
    expect(screen.queryByRole('table', { name: /Croisement/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Questions que je garderais/ })).not.toBeInTheDocument();
  });

  it('dit clairement quand aucun résultat n\'est publié', () => {
    renderDemo({ ...fixture, modeles: [], questions: [], notes: {} });
    expect(screen.getByText('Les résultats ne sont pas encore publiés.')).toBeInTheDocument();
  });
});

describe('résultats publiés', () => {
  it('ne contiennent que des questions rattachées à un passage et à un modèle connus', () => {
    const results = published as unknown as BenchResults;
    const passages = results.cours.passages.map((p) => p.id);
    const models = results.modeles.map((m) => m.nom);
    for (const q of results.questions) {
      expect(passages).toContain(q.passage_id);
      expect(models).toContain(q.modele);
    }
    if (hasData(results)) expect(results.genere_le).not.toBeNull();
  });
});
