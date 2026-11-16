import { useState } from 'react';
import { bookingsOnDay, formatDay, monthGrid, parseLocal, type Booking, type Vehicle } from './logic';

interface Props {
  vehicles: Vehicle[];
  bookings: Booking[];
  today: string;
  selected: string;
  onSelect: (day: string) => void;
  onCancel: (booking: Booking) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export function CalendarView({ vehicles, bookings, today, selected, onSelect, onCancel }: Props) {
  const initial = parseLocal(selected);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const cells = monthGrid(view.year, view.month);
  const dayBookings = bookingsOnDay(bookings, selected);
  const index = (id: string | null) => vehicles.findIndex((v) => v.id === id);

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div className="demo-cols calendar">
      <div>
        <div className="cal-head">
          <h2 aria-live="polite">{monthFormat.format(new Date(view.year, view.month, 1))}</h2>
          <div className="cal-nav">
            <button className="btn" type="button" onClick={() => shift(-1)} aria-label="Mois précédent">
              ‹
            </button>
            <button className="btn" type="button" onClick={() => shift(1)} aria-label="Mois suivant">
              ›
            </button>
          </div>
        </div>

        <ul className="legend" aria-label="Véhicules">
          {vehicles.map((v, i) => (
            <li key={v.id}>
              <span className={`swatch v${i + 1}`} aria-hidden="true" />
              {v.name}
            </li>
          ))}
        </ul>

        <div className="cal-grid">
          {WEEKDAYS.map((d) => (
            <div className="cal-wd" key={d} aria-hidden="true">
              {d}
            </div>
          ))}
          {cells.map((c) => {
            const list = bookingsOnDay(bookings, c.key);
            const count = list.length;
            return (
              <button
                key={c.key}
                type="button"
                className={`cal-day${c.inMonth ? '' : ' out'}${c.key === today ? ' today' : ''}`}
                aria-pressed={c.key === selected}
                aria-label={`${formatDay(c.key)}, ${count === 0 ? 'aucune réservation' : `${count} réservation${count > 1 ? 's' : ''}`}`}
                onClick={() => onSelect(c.key)}
              >
                <span className="cal-num">{c.day}</span>
                <span className="cal-marks" aria-hidden="true">
                  {list.map((b) => (
                    <span key={b.id} className={`swatch v${index(b.vehicleId) + 1}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="demo-side" aria-live="polite">
        <h2 className="day-title">{formatDay(selected)}</h2>
        <ul className="vstatus" aria-label="Disponibilité des véhicules ce jour-là">
          {vehicles.map((v) => {
            const busy = dayBookings.some((b) => b.vehicleId === v.id);
            return (
              <li key={v.id} className={busy ? 'busy' : 'free'}>
                {v.name} · {busy ? 'Réservé' : 'Libre'}
              </li>
            );
          })}
        </ul>
        {dayBookings.length === 0 ? (
          <p className="empty">Aucune réservation ce jour-là.</p>
        ) : (
          <ul className="slots">
            {dayBookings.map((b) => (
              <li key={b.id}>
                <strong>
                  <span className={`swatch v${index(b.vehicleId) + 1}`} aria-hidden="true" />
                  {vehicles[index(b.vehicleId)]?.name}
                  {b.mine && <span className="tag mine">Votre réservation</span>}
                </strong>
                <span className="slot-meta">
                  {b.name} · {b.start.slice(0, 10) === b.end.slice(0, 10)
                    ? `${b.start.slice(11, 16)} à ${b.end.slice(11, 16)}`
                    : `du ${b.start.slice(8, 10)}/${b.start.slice(5, 7)} ${b.start.slice(11, 16)} au ${b.end.slice(8, 10)}/${b.end.slice(5, 7)} ${b.end.slice(11, 16)}`}
                </span>
                <button
                  className="link-danger"
                  type="button"
                  onClick={() => onCancel(b)}
                  aria-label={`Annuler la réservation de ${b.name}`}
                >
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
