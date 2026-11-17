import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import brut from '../../../banc/resultats.json';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  agreement,
  controlIds,
  controlShort,
  hasData,
  hasNotes,
  modelName,
  percent,
  pickSample,
  verdictLabel,
  type BenchResults,
  type Question,
  type Verdict,
} from './logic';

const SAMPLE_SIZE = 5;
const verdicts: Verdict[] = ['garder', 'corriger', 'jeter'];
const CODE_URL = 'https://github.com/iSkyEagle/portfolio/tree/main/banc';

interface Props {
  /** Résultats injectables pour les tests. Par défaut : le fichier écrit par banc/evaluer.py. */
  results?: BenchResults;
}

export function BenchDemo({ results = brut as unknown as BenchResults }: Props) {
  usePageTitle("Démo : banc d'évaluation");
  const sample = useMemo(() => pickSample(results, SAMPLE_SIZE), [results]);
  const [answers, setAnswers] = useState<Record<string, Verdict>>({});
  const [index, setIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const noted = hasNotes(results);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Les résultats remplacent la question : on les amène à l'écran et on y place le focus.
  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ block: 'start' });
      resultsRef.current.focus({ preventScroll: true });
    }
  }, [showResults]);

  const header = (
    <div className="head">
      <div className="head-text">
        <p className="label">
          <Link to="/demos">Démos</Link> · Démonstration
        </p>
        <h1 id="titre-page" className="page-title">
          Banc d'évaluation de QCM générés
        </h1>
        <p>
          Des modèles de langage exécutés sur mon ordinateur écrivent des questions de révision à partir d'un cours. Je
          mesure ce qu'ils produisent de deux façons : des contrôles automatiques et une notation humaine à l'aveugle.
        </p>
      </div>
      <a className="btn" href={CODE_URL} target="_blank" rel="noopener">
        Voir le code<span className="sr-only"> (nouvel onglet)</span>
      </a>
    </div>
  );

  if (!hasData(results)) {
    return (
      <section aria-labelledby="titre-page">
        {header}
        <p className="empty">Les résultats ne sont pas encore publiés.</p>
      </section>
    );
  }

  const current = sample[index];
  const done = Object.keys(answers).length;
  const score = agreement(results, answers);

  function judge(q: Question, v: Verdict) {
    setAnswers((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: v }));
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setShowResults(false);
  }

  return (
    <section aria-labelledby="titre-page">
      {header}

      <ol className="steps" aria-label="Protocole">
        <li className="is-done">
          <span className="step-num" aria-hidden="true">1</span>
          <span>Même cours, même consigne et mêmes réglages pour chaque modèle</span>
        </li>
        <li className="is-done">
          <span className="step-num" aria-hidden="true">2</span>
          <span>Cinq contrôles automatiques sur chaque question</span>
        </li>
        <li className={noted ? 'is-done' : ''}>
          <span className="step-num" aria-hidden="true">3</span>
          <span>
            Notation humaine à l'aveugle, modèle masqué
            {!noted && ' (en cours)'}
          </span>
        </li>
      </ol>

      {!showResults && current && (
        <div className="demo-app bench">
          <div className="bench-bar">
            <h2>À vous de juger</h2>
            <p className="count" role="status">
              Question {index + 1} sur {sample.length}
            </p>
          </div>
          <QuestionCard
            key={current.id}
            question={current}
            results={results}
            answer={answers[current.id]}
            onJudge={(v) => judge(current, v)}
          />
          <div className="bench-nav">
            {answers[current.id] && index < sample.length - 1 && (
              <button className="btn primary" type="button" onClick={() => setIndex(index + 1)}>
                Question suivante →
              </button>
            )}
            {answers[current.id] && index === sample.length - 1 && (
              <button className="btn primary" type="button" onClick={() => setShowResults(true)}>
                Voir les résultats →
              </button>
            )}
            {!(answers[current.id] && index === sample.length - 1) && (
              <button className="btn" type="button" onClick={() => setShowResults(true)}>
                Passer aux résultats
              </button>
            )}
          </div>
        </div>
      )}

      {showResults && (
        <div className="bench-results" ref={resultsRef} tabIndex={-1} aria-label="Résultats du banc">
          {done > 0 && (
            <div className="demo-app bench">
              <h2>Votre jugement</h2>
              <p>
                Vous avez jugé {done} question{done > 1 ? 's' : ''}.{' '}
                {score.withHuman !== null && (
                  <>
                    Votre avis rejoint le mien sur <strong>{score.withHuman}</strong>.{' '}
                  </>
                )}
                Il rejoint les contrôles automatiques sur <strong>{score.withChecks}</strong> : garder une question
                qu'ils valident, ou écarter une question qu'ils signalent.
              </p>
              <button className="btn" type="button" onClick={restart}>
                Recommencer
              </button>
            </div>
          )}
          <ModelTable results={results} />
          {noted && <CrossTable results={results} />}
          <Limits results={results} />
        </div>
      )}
    </section>
  );
}

function QuestionCard({
  question: q,
  results,
  answer,
  onJudge,
}: {
  question: Question;
  results: BenchResults;
  answer?: Verdict;
  onJudge: (v: Verdict) => void;
}) {
  const passage = results.cours.passages.find((p) => p.id === q.passage_id);
  const note = results.notes[q.id];
  return (
    <div className="demo-cols bench-cols">
      <div className="bench-source">
        <p className="label">Passage du cours · {passage?.titre}</p>
        <p className="bench-passage">{passage?.texte}</p>
      </div>
      <div className="bench-question">
        <p className="label">Question écrite par un modèle</p>
        <p className="bench-q">{q.question}</p>
        <ol className="bench-choices">
          {q.choix.map((c, i) => (
            <li key={i} className={i === q.bonne_reponse ? 'is-answer' : ''}>
              {c}
              {i === q.bonne_reponse && <span className="tag mine">Réponse indiquée par le modèle</span>}
            </li>
          ))}
        </ol>

        {!answer ? (
          <fieldset className="bench-judge">
            <legend>Que feriez-vous de cette question ?</legend>
            {verdicts.map((v) => (
              <button key={v} className="btn" type="button" onClick={() => onJudge(v)}>
                {verdictLabel[v]}
              </button>
            ))}
          </fieldset>
        ) : (
          <div className="bench-reveal" role="status">
            <p>
              Vous : <strong>{verdictLabel[answer].toLowerCase()}</strong>.{' '}
              {note ? (
                <>
                  Moi : <strong>{verdictLabel[note.verdict].toLowerCase()}</strong>
                  {note.verdict === answer ? ', même avis.' : '.'}
                </>
              ) : (
                'Je ne l\'ai pas encore notée.'
              )}
            </p>
            {note?.commentaire && <p className="bench-comment">« {note.commentaire} »</p>}
            <p>
              Modèle : <strong>{modelName(q.modele)}</strong>
            </p>
            <ul className="checks" aria-label="Contrôles automatiques">
              {controlIds.map((id) => (
                <li key={id} className={q.mesures[id] ? 'ok' : 'ko'}>
                  <span aria-hidden="true">{q.mesures[id] ? '✓' : '✗'}</span> {controlShort[id]}
                  <span className="sr-only">{q.mesures[id] ? ' : réussi' : ' : échoué'}</span>
                </li>
              ))}
            </ul>
            {q.citation && (
              <p className="bench-cite">
                Citation fournie par le modèle : « {q.citation} »
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelTable({ results }: { results: BenchResults }) {
  const noted = hasNotes(results);
  return (
    <div className="demo-app bench">
      <h2>Résultats par modèle</h2>
      <div className="table-wrap">
        <table className="bench-table">
          <caption className="sr-only">Résultats des contrôles automatiques et de la notation humaine, par modèle</caption>
          <thead>
            <tr>
              <th scope="col">Mesure</th>
              {results.modeles.map((m) => (
                <th scope="col" key={m.nom}>
                  {modelName(m.nom)}
                  {m.parametres && <span className="th-sub">{m.parametres}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Questions obtenues</th>
              {results.modeles.map((m) => (
                <td key={m.nom}>
                  {m.questions_obtenues} / {m.questions_attendues}
                </td>
              ))}
            </tr>
            {controlIds.map((id) => (
              <tr key={id}>
                <th scope="row" title={results.controles[id]}>
                  {controlShort[id]}
                </th>
                {results.modeles.map((m) => (
                  <td key={m.nom}>
                    {m.controles[id]} / {m.questions_attendues}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="row-strong">
              <th scope="row">Tous les contrôles réussis</th>
              {results.modeles.map((m) => (
                <td key={m.nom}>
                  {m.tous_controles} / {m.questions_attendues}
                  <span className="td-sub">{percent(m.tous_controles, m.questions_attendues)}</span>
                </td>
              ))}
            </tr>
            {noted && (
              <>
                <tr className="row-strong">
                  <th scope="row">Questions que je garderais</th>
                  {results.modeles.map((m) => (
                    <td key={m.nom}>
                      {m.notes_humaines.garder} / {m.notes_humaines.questions_notees}
                      <span className="td-sub">{percent(m.notes_humaines.garder, m.notes_humaines.questions_notees)}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Réponse indiquée juste</th>
                  {results.modeles.map((m) => (
                    <td key={m.nom}>
                      {m.notes_humaines.reponse_juste} / {m.notes_humaines.questions_notees}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Une seule réponse défendable</th>
                  {results.modeles.map((m) => (
                    <td key={m.nom}>
                      {m.notes_humaines.reponse_unique} / {m.notes_humaines.questions_notees}
                    </td>
                  ))}
                </tr>
              </>
            )}
            <tr>
              <th scope="row">Vitesse de génération</th>
              {results.modeles.map((m) => (
                <td key={m.nom}>{m.jetons_par_seconde !== null ? `${m.jetons_par_seconde} jetons/s` : '–'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CrossTable({ results }: { results: BenchResults }) {
  const c = results.comparaison;
  return (
    <div className="demo-app bench">
      <h2>Ce que les contrôles automatiques ne voient pas</h2>
      <p>
        Sur {c.questions_notees} questions notées, mon jugement et les contrôles automatiques concordent dans{' '}
        <strong>{c.accord !== null ? percent(c.accord, 1) : '–'}</strong> des cas.
      </p>
      <div className="table-wrap">
        <table className="bench-table cross">
          <caption className="sr-only">Croisement du jugement humain et des contrôles automatiques</caption>
          <thead>
            <tr>
              <td />
              <th scope="col">Je la garde</th>
              <th scope="col">Je la corrige ou la jette</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Tous les contrôles réussis</th>
              <td>{c.auto_ok_humain_garder}</td>
              <td className="cell-warn">{c.auto_ok_humain_rejet}</td>
            </tr>
            <tr>
              <th scope="row">Au moins un contrôle échoué</th>
              <td className="cell-warn">{c.auto_ko_humain_garder}</td>
              <td>{c.auto_ko_humain_rejet}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="field-help">
        Les deux cases encadrées sont les désaccords : une question validée par les contrôles que j'écarte, ou une
        question signalée que je garde.
      </p>
    </div>
  );
}

function Limits({ results }: { results: BenchResults }) {
  const total = results.modeles.reduce((n, m) => n + m.questions_attendues, 0);
  return (
    <div className="bench-limits">
      <h2>Limites</h2>
      <ul>
        <li>
          Un seul cours, court, et {total} questions demandées en tout : les écarts entre modèles sont indicatifs.
        </li>
        <li>Un seul évaluateur humain, donc pas de mesure d'accord entre évaluateurs.</li>
        <li>« Réponse dans la citation » compare des mots : c'est un indice, pas une preuve.</li>
        <li>
          Les réponses des modèles sont enregistrées telles quelles. Rien n'est régénéré quand vous ouvrez cette page.
        </li>
      </ul>
    </div>
  );
}
