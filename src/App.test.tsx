import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { projects } from './data/projects';
import { skills } from './data/skills';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('accueil', () => {
  it('présente le nom et les deux parcours', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Clément Emery' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /J'ai 2 minutes/ })).toHaveAttribute('href', '/competences');
    expect(screen.getByRole('link', { name: /Je veux tester/ })).toHaveAttribute('href', '/demos');
  });

  it('mène à la page des compétences', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('link', { name: /J'ai 2 minutes/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Compétences et preuves' })).toBeInTheDocument();
    expect(document.title).toMatch(/^Compétences/);
  });
});

describe('navigation', () => {
  it('signale la page en cours dans le menu', () => {
    renderAt('/demos');
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: 'Démos' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Projets' })).not.toHaveAttribute('aria-current');
  });

  it('affiche une page dédiée pour une adresse inconnue', () => {
    renderAt('/nulle-part');
    expect(screen.getByRole('heading', { level: 1, name: "Cette page n'existe pas" })).toBeInTheDocument();
  });

  it('propose le contact sur toutes les pages', () => {
    renderAt('/parcours');
    expect(screen.getByRole('link', { name: 'clement.emery@icloud.com' })).toHaveAttribute(
      'href',
      'mailto:clement.emery@icloud.com',
    );
  });
});

describe('compétences', () => {
  it('liste chaque compétence avec ses preuves', () => {
    renderAt('/competences');
    for (const s of skills) {
      const block = screen.getByRole('article', { name: s.title });
      expect(within(block).getAllByRole('listitem').length).toBeGreaterThanOrEqual(s.proofs.length);
    }
  });
});

describe('fiches de projet', () => {
  it('filtre les fiches par compétence et annonce le résultat', async () => {
    const user = userEvent.setup();
    renderAt('/projets');
    expect(screen.getByText(`${projects.length} fiches sur ${projects.length}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agents et automatisation' }));
    const expected = projects.filter((p) => p.skills.includes('agents'));
    expect(screen.getAllByRole('article')).toHaveLength(expected.length);
    expect(screen.getByRole('button', { name: 'Agents et automatisation' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Toutes' }));
    expect(screen.getAllByRole('article')).toHaveLength(projects.length);
  });

  it("applique le filtre demandé dans l'adresse", () => {
    renderAt('/projets?competence=evaluation');
    const expected = projects.filter((p) => p.skills.includes('evaluation'));
    expect(screen.getAllByRole('article')).toHaveLength(expected.length);
  });

  it('ignore un filtre inconnu', () => {
    renderAt('/projets?competence=inconnue');
    expect(screen.getAllByRole('article')).toHaveLength(projects.length);
  });

  it("ouvre la fiche visée par l'adresse et laisse les autres fermées", () => {
    renderAt('/projets/outil-pvt');
    const target = screen.getByRole('article', { name: 'Outil PVT' });
    expect(target.querySelector('details')).toHaveAttribute('open');
    const other = screen.getByRole('article', { name: 'FitTrack' });
    expect(other.querySelector('details')).not.toHaveAttribute('open');
  });

  it('déplie puis replie toutes les fiches', async () => {
    const user = userEvent.setup();
    renderAt('/projets');
    await user.click(screen.getByRole('button', { name: 'Tout déplier' }));
    expect(document.querySelectorAll('details[open]')).toHaveLength(projects.length);
    await user.click(screen.getByRole('button', { name: 'Tout replier' }));
    expect(document.querySelectorAll('details[open]')).toHaveLength(0);
  });
});

describe('réglages et contact', () => {
  it('change de thème et retient le choix', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: /Thème d'affichage : auto/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('pf-theme')).toBe('clair');
    await user.click(screen.getByRole('button', { name: /Thème d'affichage : clair/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it("copie l'adresse email et le confirme", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Copier' }));
    expect(writeText).toHaveBeenCalledWith('clement.emery@icloud.com');
    expect(await screen.findByText('Adresse copiée dans le presse-papiers.')).toBeInTheDocument();
  });
});
