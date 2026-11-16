import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ReservationDemo } from './ReservationDemo';

// Lundi 16 novembre 2026, 10 h.
const now = new Date(2026, 10, 16, 10, 0);

function renderDemo() {
  return render(
    <MemoryRouter>
      <ReservationDemo now={now} />
    </MemoryRouter>,
  );
}

describe('démo de réservation', () => {
  it('déroule le parcours complet : demande, validation, calendrier', async () => {
    const user = userEvent.setup();
    renderDemo();

    // 1. Le formulaire est prérempli : la demande part en un clic.
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(screen.getByRole('status')).toHaveTextContent('Demande envoyée');
    expect(screen.getByText('En attente de validation')).toBeInTheDocument();

    // 2. Côté responsable, la demande « au choix » reçoit un véhicule libre.
    await user.click(screen.getByRole('button', { name: /Passer côté responsable/ }));
    const request = screen.getByRole('listitem', { name: 'Demande de Visiteur' });
    // La citadine grise est prise le 17 au matin : elle n'est pas proposée.
    const options = within(request).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Citadine blanche', 'Break bleu', 'Utilitaire noir']);
    await user.selectOptions(within(request).getByLabelText('Véhicule à attribuer'), 'Break bleu');
    await user.click(within(request).getByRole('button', { name: 'Valider la demande de Visiteur' }));
    expect(screen.getByRole('status')).toHaveTextContent('Demande de Visiteur validée');

    // 3. La réservation apparaît dans le calendrier, au bon jour.
    await user.click(screen.getByRole('button', { name: /Voir votre réservation dans le calendrier/ }));
    expect(screen.getByRole('heading', { name: 'mardi 17 novembre' })).toBeInTheDocument();
    expect(screen.getByText('Votre réservation')).toBeInTheDocument();
    expect(screen.getByText('Break bleu · Réservé')).toBeInTheDocument();

    // Les trois étapes du parcours sont cochées.
    const steps = within(screen.getByRole('list', { name: 'Parcours proposé' })).getAllByRole('listitem');
    for (const step of steps) expect(step).toHaveTextContent('(fait)');
  });

  it('empêche de valider une demande en conflit et explique pourquoi', async () => {
    const user = userEvent.setup();
    renderDemo();
    await user.click(screen.getByRole('tab', { name: /Valider/ }));
    const request = screen.getByRole('listitem', { name: 'Demande de Léa' });
    expect(within(request).getByText(/déjà réservé par Hugo/)).toBeInTheDocument();
    expect(within(request).getByRole('button', { name: 'Valider la demande de Léa' })).toBeDisabled();
    await user.click(within(request).getByRole('button', { name: 'Refuser la demande de Léa' }));
    expect(screen.queryByRole('listitem', { name: 'Demande de Léa' })).not.toBeInTheDocument();
  });

  it('refuse une demande sur un véhicule déjà pris, sans rien envoyer', async () => {
    const user = userEvent.setup();
    renderDemo();
    // La citadine grise est réservée le 17 de 8 h à 12 h, le créneau prérempli la recoupe.
    await user.selectOptions(screen.getByLabelText('Véhicule'), 'v1');
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/déjà réservé sur ce créneau par Camille/);
    expect(screen.getByText(/Aucune demande pour l'instant/)).toBeInTheDocument();
  });

  it('signale une fin de créneau avant le début', async () => {
    const user = userEvent.setup();
    renderDemo();
    const end = screen.getByLabelText('Heure de fin');
    await user.clear(end);
    await user.type(end, '07:00');
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La fin doit être après le début.');
  });

  it('se remet à zéro', async () => {
    const user = userEvent.setup();
    renderDemo();
    await user.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    await user.click(screen.getByRole('button', { name: 'Remettre à zéro' }));
    expect(screen.getByText(/Aucune demande pour l'instant/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Valider/ })).toHaveTextContent('2');
  });

  it('change d\'onglet au clavier', async () => {
    const user = userEvent.setup();
    renderDemo();
    screen.getByRole('tab', { name: 'Réserver' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Valider/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Demandes en attente' })).toBeInTheDocument();
  });
});
