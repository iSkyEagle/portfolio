import { Link } from 'react-router';
import { demos, orderedDemos } from '../data/demos';
import { getSkill } from '../data/skills';
import { usePageTitle } from '../hooks/usePageTitle';

export function Demos() {
  usePageTitle('Démos');
  const ready = demos.filter((d) => d.state === 'disponible').length;

  return (
    <section aria-labelledby="titre-page">
      <div className="head">
        <div className="head-text">
          <p className="label">À tester</p>
          <h1 id="titre-page" className="page-title">
            Démonstrations
          </h1>
          <p>
            Des outils à manipuler directement dans le navigateur, sans compte ni installation. Chaque démonstration
            précise d'où viennent ses données.
          </p>
        </div>
        <p className="count" role="status">
          {ready} disponible{ready > 1 ? 's' : ''} sur {demos.length}
        </p>
      </div>

      <div className="demos">
        {orderedDemos.map((d) => (
          <article className="demo" key={d.id} aria-labelledby={`${d.id}-titre`}>
            <div className="sheet-top">
              <span className={`status ${d.state === 'disponible' ? 'done' : 'wip'}`}>
                {d.state === 'disponible' ? 'Disponible' : 'En préparation'}
              </span>
            </div>
            <h2 id={`${d.id}-titre`}>{d.title}</h2>
            <dl>
              <div className="dl-row">
                <dt>Vous faites</dt>
                <dd>{d.action}</dd>
              </div>
              <div className="dl-row">
                <dt>Ça montre</dt>
                <dd>{d.shows}</dd>
              </div>
              <div className="dl-row">
                <dt>Données</dt>
                <dd>{d.note}</dd>
              </div>
            </dl>
            <ul className="demo-skills" aria-label="Compétences démontrées">
              {d.skills.map((id) => {
                const skill = getSkill(id);
                return skill ? (
                  <li key={id}>
                    <Link to={`/competences#${id}`}>{skill.title}</Link>
                  </li>
                ) : null;
              })}
            </ul>
            {d.route && (
              <Link className="btn primary demo-go" to={d.route} aria-label={`Lancer la démo : ${d.title}`}>
                Lancer la démo →
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
