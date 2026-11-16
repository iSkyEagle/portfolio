/**
 * Logique de la démo de réservation, sans dépendance à l'affichage.
 * Les dates sont des chaînes locales « AAAA-MM-JJTHH:mm » : elles se comparent
 * directement entre elles et évitent les décalages de fuseau horaire.
 */

export type BookingStatus = 'attente' | 'validee' | 'refusee';

export interface Vehicle {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  /** null : « au choix », le responsable attribue un véhicule en validant. */
  vehicleId: string | null;
  name: string;
  start: string;
  end: string;
  status: BookingStatus;
  /** Demande créée par le visiteur pendant la démo. */
  mine?: boolean;
}

export interface RequestInput {
  vehicleId: string | null;
  name: string;
  start: string;
  end: string;
}

export interface DemoState {
  vehicles: Vehicle[];
  bookings: Booking[];
  nextId: number;
}

export type Action =
  | { type: 'demander'; input: RequestInput }
  | { type: 'valider'; id: string; vehicleId: string }
  | { type: 'refuser'; id: string }
  | { type: 'annuler'; id: string }
  | { type: 'reinitialiser'; state: DemoState };

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export function at(d: Date, time: string): string {
  return `${dateKey(d)}T${time}`;
}

export function parseLocal(value: string): Date {
  const [date, time = '00:00'] = value.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/** Deux créneaux se chevauchent s'ils partagent au moins un instant. Deux créneaux qui se suivent ne se chevauchent pas. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Réservations validées qui bloquent ce véhicule sur ce créneau. */
export function conflicts(
  bookings: Booking[],
  vehicleId: string,
  start: string,
  end: string,
  ignoreId?: string,
): Booking[] {
  return bookings.filter(
    (b) =>
      b.status === 'validee' &&
      b.vehicleId === vehicleId &&
      b.id !== ignoreId &&
      overlaps(start, end, b.start, b.end),
  );
}

export function freeVehicles(vehicles: Vehicle[], bookings: Booking[], start: string, end: string): Vehicle[] {
  return vehicles.filter((v) => conflicts(bookings, v.id, start, end).length === 0);
}

export interface RequestErrors {
  name?: string;
  dates?: string;
  vehicle?: string;
}

export function validateRequest(input: RequestInput, bookings: Booking[], now: string): RequestErrors {
  const errors: RequestErrors = {};
  if (!input.name.trim()) errors.name = 'Indiquez votre prénom.';
  if (!input.start || !input.end || input.start.length < 16 || input.end.length < 16) {
    errors.dates = 'Indiquez une date et une heure de début et de fin.';
  } else if (input.end <= input.start) {
    errors.dates = 'La fin doit être après le début.';
  } else if (input.start < now) {
    errors.dates = 'Le début ne peut pas être dans le passé.';
  } else if (input.vehicleId) {
    const taken = conflicts(bookings, input.vehicleId, input.start, input.end);
    if (taken.length > 0) {
      errors.vehicle = `Ce véhicule est déjà réservé sur ce créneau par ${taken[0].name}. Choisissez-en un autre ou « Au choix ».`;
    }
  }
  return errors;
}

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'demander': {
      const booking: Booking = {
        id: `d${state.nextId}`,
        vehicleId: action.input.vehicleId,
        name: action.input.name.trim(),
        start: action.input.start,
        end: action.input.end,
        status: 'attente',
        mine: true,
      };
      return { ...state, bookings: [...state.bookings, booking], nextId: state.nextId + 1 };
    }
    case 'valider': {
      const target = state.bookings.find((b) => b.id === action.id);
      if (!target || target.status !== 'attente') return state;
      if (!state.vehicles.some((v) => v.id === action.vehicleId)) return state;
      // Une validation qui créerait un double emploi du véhicule est ignorée.
      if (conflicts(state.bookings, action.vehicleId, target.start, target.end, target.id).length > 0) return state;
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, status: 'validee', vehicleId: action.vehicleId } : b,
        ),
      };
    }
    case 'refuser':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id && b.status === 'attente' ? { ...b, status: 'refusee' } : b,
        ),
      };
    case 'annuler':
      return { ...state, bookings: state.bookings.filter((b) => b.id !== action.id) };
    case 'reinitialiser':
      return action.state;
  }
}

/** Réservations validées présentes un jour donné, y compris celles qui s'étalent sur plusieurs jours. */
export function bookingsOnDay(bookings: Booking[], day: string): Booking[] {
  return bookings
    .filter((b) => b.status === 'validee' && b.start.slice(0, 10) <= day && b.end.slice(0, 10) >= day)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export interface DayCell {
  key: string;
  day: number;
  inMonth: boolean;
}

/** Grille d'un mois : six semaines complètes, du lundi au dimanche. */
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - offset + i);
    return { key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

/** Données de départ, entièrement fictives et placées autour de la date du jour. */
export function seed(today: Date): DemoState {
  const vehicles: Vehicle[] = [
    { id: 'v1', name: 'Citadine grise' },
    { id: 'v2', name: 'Citadine blanche' },
    { id: 'v3', name: 'Break bleu' },
    { id: 'v4', name: 'Utilitaire noir' },
  ];
  const day = (n: number) => addDays(today, n);
  const bookings: Booking[] = [
    { id: 's1', vehicleId: 'v1', name: 'Camille', start: at(day(1), '08:00'), end: at(day(1), '12:00'), status: 'validee' },
    { id: 's2', vehicleId: 'v2', name: 'Hugo', start: at(day(2), '09:00'), end: at(day(2), '17:00'), status: 'validee' },
    { id: 's3', vehicleId: 'v3', name: 'Inès', start: at(day(4), '08:00'), end: at(day(5), '18:00'), status: 'validee' },
    // Cette demande entre en conflit avec la réservation d'Hugo : le responsable ne peut pas la valider telle quelle.
    { id: 's4', vehicleId: 'v2', name: 'Léa', start: at(day(2), '14:00'), end: at(day(2), '18:00'), status: 'attente' },
    { id: 's5', vehicleId: null, name: 'Karim', start: at(day(3), '08:00'), end: at(day(3), '18:00'), status: 'attente' },
  ];
  return { vehicles, bookings, nextId: 1 };
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export function formatDay(key: string): string {
  return dayFormat.format(parseLocal(key));
}

/** « mar. 17 nov., 08:00 à 12:00 » ou, sur plusieurs jours, « ven. 20 nov. 08:00 au sam. 21 nov. 18:00 ». */
export function formatSlot(start: string, end: string): string {
  const s = shortFormat.format(parseLocal(start));
  const e = shortFormat.format(parseLocal(end));
  const st = start.slice(11, 16);
  const et = end.slice(11, 16);
  return start.slice(0, 10) === end.slice(0, 10) ? `${s}, ${st} à ${et}` : `${s} ${st} au ${e} ${et}`;
}
