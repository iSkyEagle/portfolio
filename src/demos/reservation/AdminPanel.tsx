import { useState } from 'react';
import { conflicts, formatSlot, freeVehicles, type Booking, type Vehicle } from './logic';

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  onApprove: (booking: Booking, vehicleId: string) => void;
  onRefuse: (booking: Booking) => void;
  onSeeCalendar: (day: string) => void;
  /** Demande du visiteur déjà validée : on propose d'aller la voir dans le calendrier. */
  lastValidated?: Booking;
}

export function AdminPanel({ vehicles, bookings, onApprove, onRefuse, onSeeCalendar, lastValidated }: Props) {
  const pending = bookings.filter((b) => b.status === 'attente');
  // Véhicule attribué par le responsable aux demandes « au choix ».
  const [assigned, setAssigned] = useState<Record<string, string>>({});

  return (
    <div className="admin">
      <h2>Demandes en attente</h2>
      <p className="field-help">
        Vous êtes maintenant le responsable de la flotte. Une demande ne peut être validée que si le véhicule est libre
        sur tout le créneau.
      </p>

      {pending.length === 0 ? (
        <p className="empty">Aucune demande en attente.</p>
      ) : (
        <ul className="requests">
          {pending.map((b) => {
            const free = freeVehicles(vehicles, bookings, b.start, b.end);
            const chosen = b.vehicleId ?? assigned[b.id] ?? free[0]?.id ?? '';
            const blocking = chosen ? conflicts(bookings, chosen, b.start, b.end, b.id) : [];
            const vehicle = vehicles.find((v) => v.id === b.vehicleId);
            const canApprove = Boolean(chosen) && blocking.length === 0;
            return (
              <li key={b.id} className="request" aria-label={`Demande de ${b.name}`}>
                <div className="request-main">
                  <strong>
                    {b.name}
                    {b.mine && <span className="tag mine">Votre demande</span>}
                  </strong>
                  <span className="slot-meta">{formatSlot(b.start, b.end)}</span>
                  {vehicle ? (
                    <span>{vehicle.name}</span>
                  ) : (
                    <div className="field inline">
                      <label htmlFor={`attrib-${b.id}`}>Véhicule à attribuer</label>
                      <select
                        id={`attrib-${b.id}`}
                        value={chosen}
                        onChange={(e) => setAssigned((prev) => ({ ...prev, [b.id]: e.target.value }))}
                        disabled={free.length === 0}
                      >
                        {free.length === 0 && <option value="">Aucun véhicule libre</option>}
                        {free.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {blocking.length > 0 && (
                    <p className="field-error">
                      Conflit : ce véhicule est déjà réservé par {blocking[0].name} ({formatSlot(blocking[0].start, blocking[0].end)}).
                    </p>
                  )}
                  {!vehicle && free.length === 0 && (
                    <p className="field-error">Aucun véhicule n'est libre sur ce créneau.</p>
                  )}
                </div>
                <div className="request-actions">
                  <button
                    className="btn primary"
                    type="button"
                    disabled={!canApprove}
                    onClick={() => onApprove(b, chosen)}
                    aria-label={`Valider la demande de ${b.name}`}
                  >
                    Valider
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => onRefuse(b)}
                    aria-label={`Refuser la demande de ${b.name}`}
                  >
                    Refuser
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {lastValidated && (
        <button className="btn" type="button" onClick={() => onSeeCalendar(lastValidated.start.slice(0, 10))}>
          Voir votre réservation dans le calendrier →
        </button>
      )}
    </div>
  );
}
