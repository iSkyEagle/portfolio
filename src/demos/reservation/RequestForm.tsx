import { useState, type FormEvent } from 'react';
import {
  dateKey,
  formatSlot,
  freeVehicles,
  validateRequest,
  type Booking,
  type RequestErrors,
  type RequestInput,
  type Vehicle,
} from './logic';

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  now: Date;
  defaultStart: string;
  defaultEnd: string;
  mine: Booking[];
  onSubmit: (input: RequestInput) => void;
  onGoToAdmin: () => void;
}

const statusText = { attente: 'En attente de validation', validee: 'Validée', refusee: 'Refusée' } as const;

export function RequestForm({ vehicles, bookings, now, defaultStart, defaultEnd, mine, onSubmit, onGoToAdmin }: Props) {
  const [vehicleId, setVehicleId] = useState('');
  const [name, setName] = useState('Visiteur');
  const [startDate, setStartDate] = useState(defaultStart.slice(0, 10));
  const [startTime, setStartTime] = useState(defaultStart.slice(11, 16));
  const [endDate, setEndDate] = useState(defaultEnd.slice(0, 10));
  const [endTime, setEndTime] = useState(defaultEnd.slice(11, 16));
  const [errors, setErrors] = useState<RequestErrors>({});

  const start = `${startDate}T${startTime}`;
  const end = `${endDate}T${endTime}`;
  const validSlot = start.length === 16 && end.length === 16 && end > start;
  const free = validSlot ? freeVehicles(vehicles, bookings, start, end) : vehicles;
  const nowIso = `${dateKey(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  function submit(e: FormEvent) {
    e.preventDefault();
    const input: RequestInput = { vehicleId: vehicleId || null, name, start, end };
    const found = validateRequest(input, bookings, nowIso);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(input);
  }

  const vehicleName = (id: string | null) => vehicles.find((v) => v.id === id)?.name ?? 'Au choix';

  return (
    <div className="demo-cols">
      <form className="demo-form" onSubmit={submit} noValidate aria-labelledby="form-titre">
        <h2 id="form-titre">Nouvelle réservation</h2>

        <div className="field">
          <label htmlFor="res-vehicule">Véhicule</label>
          <select
            id="res-vehicule"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            aria-describedby={errors.vehicle ? 'err-vehicule' : 'aide-vehicule'}
            aria-invalid={Boolean(errors.vehicle)}
          >
            <option value="">Au choix (le responsable attribue un véhicule)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {validSlot && !free.includes(v) ? ' (déjà réservé sur ce créneau)' : ''}
              </option>
            ))}
          </select>
          {errors.vehicle ? (
            <p className="field-error" id="err-vehicule" role="alert">
              {errors.vehicle}
            </p>
          ) : (
            <p className="field-help" id="aide-vehicule">
              {validSlot
                ? `${free.length} véhicule${free.length > 1 ? 's' : ''} libre${free.length > 1 ? 's' : ''} sur ${vehicles.length} pour ce créneau.`
                : 'Choisissez un créneau pour voir les véhicules libres.'}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="res-prenom">Votre prénom</label>
          <input
            id="res-prenom"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            aria-describedby={errors.name ? 'err-prenom' : undefined}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="field-error" id="err-prenom" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <fieldset className="slot" aria-describedby={errors.dates ? 'err-dates' : undefined}>
          <legend>Créneau</legend>
          <div className="field">
            <label htmlFor="res-debut-date">Date de début</label>
            <input id="res-debut-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="res-debut-heure">Heure de début</label>
            <input id="res-debut-heure" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="res-fin-date">Date de fin</label>
            <input id="res-fin-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="res-fin-heure">Heure de fin</label>
            <input id="res-fin-heure" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </fieldset>
        {errors.dates && (
          <p className="field-error" id="err-dates" role="alert">
            {errors.dates}
          </p>
        )}

        <button className="btn primary" type="submit">
          Envoyer la demande
        </button>
      </form>

      <div className="demo-side" aria-labelledby="mes-demandes">
        <h2 id="mes-demandes">Vos demandes</h2>
        {mine.length === 0 ? (
          <p className="empty">Aucune demande pour l'instant. Le formulaire est prérempli : il suffit de l'envoyer.</p>
        ) : (
          <>
            <ul className="slots">
              {mine.map((b) => (
                <li key={b.id}>
                  <span className={`status ${b.status === 'validee' ? 'done' : b.status === 'refusee' ? 'refused' : 'wip'}`}>
                    {statusText[b.status]}
                  </span>
                  <strong>{vehicleName(b.vehicleId)}</strong>
                  <span className="slot-meta">{formatSlot(b.start, b.end)}</span>
                </li>
              ))}
            </ul>
            {mine.some((b) => b.status === 'attente') && (
              <button className="btn" type="button" onClick={onGoToAdmin}>
                Passer côté responsable →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
