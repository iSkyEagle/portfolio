import { describe, expect, it } from 'vitest';
import {
  bookingsOnDay,
  conflicts,
  formatSlot,
  freeVehicles,
  monthGrid,
  overlaps,
  reducer,
  seed,
  validateRequest,
  type Booking,
} from './logic';

// Lundi 16 novembre 2026.
const today = new Date(2026, 10, 16);
const NOW = '2026-11-16T10:00';

describe('overlaps', () => {
  it('détecte deux créneaux qui se recoupent', () => {
    expect(overlaps('2026-11-18T09:00', '2026-11-18T17:00', '2026-11-18T14:00', '2026-11-18T18:00')).toBe(true);
  });

  it('accepte deux créneaux qui se suivent sans se recouper', () => {
    expect(overlaps('2026-11-18T08:00', '2026-11-18T12:00', '2026-11-18T12:00', '2026-11-18T18:00')).toBe(false);
  });

  it('détecte un créneau inclus dans un autre, sur plusieurs jours', () => {
    expect(overlaps('2026-11-20T08:00', '2026-11-21T18:00', '2026-11-21T09:00', '2026-11-21T10:00')).toBe(true);
  });
});

describe('conflicts et freeVehicles', () => {
  const { vehicles, bookings } = seed(today);

  it('ne compte que les réservations validées du même véhicule', () => {
    // v2 : Hugo validé de 09:00 à 17:00, Léa seulement en attente.
    const found = conflicts(bookings, 'v2', '2026-11-18T14:00', '2026-11-18T18:00');
    expect(found.map((b) => b.name)).toEqual(['Hugo']);
    expect(conflicts(bookings, 'v1', '2026-11-18T14:00', '2026-11-18T18:00')).toHaveLength(0);
  });

  it('liste les véhicules libres sur un créneau', () => {
    const free = freeVehicles(vehicles, bookings, '2026-11-18T10:00', '2026-11-18T11:00');
    expect(free.map((v) => v.id)).toEqual(['v1', 'v3', 'v4']);
  });
});

describe('validateRequest', () => {
  const { bookings } = seed(today);
  const base = { vehicleId: null, name: 'Alex', start: '2026-11-17T08:00', end: '2026-11-17T18:00' };

  it('accepte une demande complète', () => {
    expect(validateRequest(base, bookings, NOW)).toEqual({});
  });

  it('exige un prénom', () => {
    expect(validateRequest({ ...base, name: '  ' }, bookings, NOW).name).toBeDefined();
  });

  it('refuse une fin avant le début', () => {
    expect(validateRequest({ ...base, end: '2026-11-17T07:00' }, bookings, NOW).dates).toMatch(/après le début/);
  });

  it('refuse un début dans le passé', () => {
    expect(validateRequest({ ...base, start: '2026-11-15T08:00' }, bookings, NOW).dates).toMatch(/passé/);
  });

  it('signale un véhicule déjà réservé et nomme la personne', () => {
    const errors = validateRequest(
      { ...base, vehicleId: 'v2', start: '2026-11-18T10:00', end: '2026-11-18T11:00' },
      bookings,
      NOW,
    );
    expect(errors.vehicle).toMatch(/Hugo/);
  });
});

describe('reducer', () => {
  const initial = seed(today);
  const request = { vehicleId: null, name: ' Alex ', start: '2026-11-17T14:00', end: '2026-11-17T18:00' };

  it('enregistre une demande en attente, marquée comme celle du visiteur', () => {
    const next = reducer(initial, { type: 'demander', input: request });
    const added = next.bookings.at(-1) as Booking;
    expect(added).toMatchObject({ name: 'Alex', status: 'attente', mine: true, vehicleId: null });
    expect(initial.bookings).toHaveLength(5);
  });

  it('valide une demande en attribuant le véhicule', () => {
    const next = reducer(initial, { type: 'valider', id: 's5', vehicleId: 'v4' });
    expect(next.bookings.find((b) => b.id === 's5')).toMatchObject({ status: 'validee', vehicleId: 'v4' });
  });

  it('ignore une validation qui mettrait deux réservations sur le même véhicule', () => {
    // s4 (Léa, v2) chevauche la réservation validée d'Hugo.
    const next = reducer(initial, { type: 'valider', id: 's4', vehicleId: 'v2' });
    expect(next).toBe(initial);
  });

  it('ne revalide pas une demande déjà traitée', () => {
    const refused = reducer(initial, { type: 'refuser', id: 's5' });
    expect(refused.bookings.find((b) => b.id === 's5')?.status).toBe('refusee');
    expect(reducer(refused, { type: 'valider', id: 's5', vehicleId: 'v4' })).toBe(refused);
  });

  it('annule une réservation', () => {
    const next = reducer(initial, { type: 'annuler', id: 's1' });
    expect(next.bookings.some((b) => b.id === 's1')).toBe(false);
  });
});

describe('calendrier', () => {
  it('construit six semaines qui commencent un lundi', () => {
    const cells = monthGrid(2026, 10);
    expect(cells).toHaveLength(42);
    // Le 1er novembre 2026 est un dimanche : la grille commence le lundi 26 octobre.
    expect(cells[0]).toMatchObject({ key: '2026-10-26', inMonth: false });
    expect(cells[6]).toMatchObject({ key: '2026-11-01', inMonth: true });
  });

  it('affiche une réservation de plusieurs jours sur chacun de ses jours', () => {
    const { bookings } = seed(today);
    // Inès : du 20 au 21 novembre.
    expect(bookingsOnDay(bookings, '2026-11-20').map((b) => b.name)).toEqual(['Inès']);
    expect(bookingsOnDay(bookings, '2026-11-21').map((b) => b.name)).toEqual(['Inès']);
    expect(bookingsOnDay(bookings, '2026-11-22')).toHaveLength(0);
  });

  it("n'affiche pas les demandes en attente", () => {
    const { bookings } = seed(today);
    expect(bookingsOnDay(bookings, '2026-11-19')).toHaveLength(0);
  });

  it('formate un créneau sur un jour et sur plusieurs', () => {
    expect(formatSlot('2026-11-17T08:00', '2026-11-17T12:00')).toBe('mar. 17 nov., 08:00 à 12:00');
    expect(formatSlot('2026-11-20T08:00', '2026-11-21T18:00')).toBe('ven. 20 nov. 08:00 au sam. 21 nov. 18:00');
  });
});
