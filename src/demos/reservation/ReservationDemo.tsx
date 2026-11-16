import { useMemo, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AdminPanel } from './AdminPanel';
import { CalendarView } from './CalendarView';
import { addDays, at, dateKey, reducer, seed, type Booking, type RequestInput } from './logic';
import { RequestForm } from './RequestForm';

type Tab = 'reserver' | 'valider' | 'calendrier';

const tabs: { id: Tab; label: string }[] = [
  { id: 'reserver', label: 'Réserver' },
  { id: 'valider', label: 'Valider' },
  { id: 'calendrier', label: 'Calendrier' },
];

interface Props {
  /** Date de référence, injectable pour les tests. */
  now?: Date;
}

export function ReservationDemo({ now }: Props) {
  usePageTitle('Démo : outil interne de réservation');
  const today = useMemo(() => now ?? new Date(), [now]);
  const [state, dispatch] = useReducer(reducer, today, seed);
  const [tab, setTab] = useState<Tab>('reserver');
  const [calendarDay, setCalendarDay] = useState(dateKey(today));
  const [seenCalendar, setSeenCalendar] = useState(false);
  const [notice, setNotice] = useState('');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ reserver: null, valider: null, calendrier: null });

  const pending = state.bookings.filter((b) => b.status === 'attente');
  const mine = state.bookings.filter((b) => b.mine);
  const myValidated = mine.find((b) => b.status === 'validee');
  const steps = [
    { label: 'Réservez un véhicule', done: mine.length > 0 },
    { label: 'Passez côté responsable et validez la demande', done: mine.some((b) => b.status !== 'attente') },
    { label: 'Retrouvez la réservation dans le calendrier', done: Boolean(myValidated) && seenCalendar },
  ];

  function open(next: Tab, day?: string) {
    setTab(next);
    if (day) setCalendarDay(day);
    if (next === 'calendrier' && myValidated) setSeenCalendar(true);
  }

  function submit(input: RequestInput) {
    dispatch({ type: 'demander', input });
    setNotice('Demande envoyée. Elle attend la validation du responsable.');
  }

  function approve(booking: Booking, vehicleId: string) {
    dispatch({ type: 'valider', id: booking.id, vehicleId });
    setNotice(`Demande de ${booking.name} validée. Elle apparaît dans le calendrier.`);
    setCalendarDay(booking.start.slice(0, 10));
  }

  function refuse(booking: Booking) {
    dispatch({ type: 'refuser', id: booking.id });
    setNotice(`Demande de ${booking.name} refusée.`);
  }

  function cancel(booking: Booking) {
    dispatch({ type: 'annuler', id: booking.id });
    setNotice(`Réservation de ${booking.name} annulée.`);
  }

  function reset() {
    dispatch({ type: 'reinitialiser', state: seed(today) });
    setTab('reserver');
    setCalendarDay(dateKey(today));
    setSeenCalendar(false);
    setNotice('Démo remise à zéro.');
  }

  // Navigation au clavier entre les onglets, avec les flèches.
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.findIndex((t) => t.id === tab);
    const move = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = tabs[(index + move + tabs.length) % tabs.length].id;
    open(next);
    tabRefs.current[next]?.focus();
  }

  const tomorrow = addDays(today, 1);

  return (
    <section aria-labelledby="titre-page">
      <div className="head">
        <div className="head-text">
          <p className="label">
            <Link to="/demos">Démos</Link> · Démonstration
          </p>
          <h1 id="titre-page" className="page-title">
            Outil interne de réservation
          </h1>
          <p>
            Reproduction autonome d'un outil que j'ai construit pour réserver les véhicules partagés d'une équipe. Les
            véhicules et les personnes sont fictifs. Rien n'est enregistré ni envoyé.
          </p>
        </div>
        <button className="btn" type="button" onClick={reset}>
          Remettre à zéro
        </button>
      </div>

      <ol className="steps" aria-label="Parcours proposé">
        {steps.map((s, i) => (
          <li key={s.label} className={s.done ? 'is-done' : ''}>
            <span className="step-num" aria-hidden="true">
              {s.done ? '✓' : i + 1}
            </span>
            <span>
              {s.label}
              <span className="sr-only">{s.done ? ' (fait)' : ' (à faire)'}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="demo-app">
        <div className="tabs" role="tablist" aria-label="Vues de l'outil">
          {tabs.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`onglet-${t.id}`}
              className="tab"
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panneau-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => open(t.id)}
              onKeyDown={onTabKey}
            >
              {t.label}
              {t.id === 'valider' && pending.length > 0 && (
                <span className="tab-count">
                  {pending.length}
                  <span className="sr-only"> en attente</span>
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="notice" role="status">
          {notice}
        </p>

        <div id={`panneau-${tab}`} className="tab-panel" role="tabpanel" aria-labelledby={`onglet-${tab}`}>
          {tab === 'reserver' && (
            <RequestForm
              vehicles={state.vehicles}
              bookings={state.bookings}
              now={today}
              defaultStart={at(tomorrow, '08:00')}
              defaultEnd={at(tomorrow, '18:00')}
              mine={mine}
              onSubmit={submit}
              onGoToAdmin={() => open('valider')}
            />
          )}
          {tab === 'valider' && (
            <AdminPanel
              vehicles={state.vehicles}
              bookings={state.bookings}
              onApprove={approve}
              onRefuse={refuse}
              onSeeCalendar={(day) => open('calendrier', day)}
              lastValidated={myValidated}
            />
          )}
          {tab === 'calendrier' && (
            <CalendarView
              vehicles={state.vehicles}
              bookings={state.bookings}
              today={dateKey(today)}
              selected={calendarDay}
              onSelect={setCalendarDay}
              onCancel={cancel}
            />
          )}
        </div>
      </div>

      <p className="demo-foot">
        Dans l'outil réel, une demande validée est inscrite dans l'agenda partagé de l'équipe et le demandeur reçoit un
        email de confirmation. Ici, tout se passe dans la page.
      </p>
    </section>
  );
}
