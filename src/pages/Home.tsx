import { Link } from 'react-router';
import { skills } from '../data/skills';
import { usePageTitle } from '../hooks/usePageTitle';

export function Home() {
  usePageTitle();
  return (
    <>
      <section className="hero" aria-labelledby="nom">
        <div>
          <p className="label">I.A appliquée · Facteurs humains</p>
          <h1 id="nom">Clément Emery</h1>
          <p className="lead">
            Je construis des outils d'I.A de bout en bout : agents et automatisations, LLM exécutés en local, applications
            déployées. Ergonome cognitif de formation (Master 2 ESCSI), je les conçois et je les évalue du point de vue de
            leurs utilisateurs.
          </p>
        </div>
        <aside className="brief" aria-labelledby="bref">
          <h2 id="bref">En bref</h2>
          <dl>
            <div>
              <dt>Domaine</dt>
              <dd>I.A appliquée, automatisation de workflows, facteurs humains</dd>
            </div>
            <div>
              <dt>Poste actuel</dt>
              <dd>Ingénieur en facteurs humains</dd>
            </div>
            <div>
              <dt>Formation</dt>
              <dd>Psychologie (Toulouse Jean Jaurès), puis Master 2 ESCSI (Savoie Mont-Blanc)</dd>
            </div>
            <div>
              <dt>Outils</dt>
              <dd>Python, PyTorch, React, TypeScript, n8n, Ollama</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section aria-labelledby="visite">
        <div className="head">
          <div className="head-text">
            <p className="label">Visite</p>
            <h2 id="visite">Deux façons de parcourir ce site</h2>
          </div>
        </div>
        <div className="paths">
          <Link className="path-card" to="/competences">
            <span className="label">J'ai 2 minutes</span>
            <span className="path-title">Les compétences et leurs preuves</span>
            <span className="path-text">
              Cinq compétences sur une page. Chacune renvoie aux réalisations qui la démontrent.
            </span>
            <span className="path-go" aria-hidden="true">
              Lire →
            </span>
          </Link>
          <Link className="path-card" to="/demos">
            <span className="label">Je veux tester</span>
            <span className="path-title">Les démonstrations</span>
            <span className="path-text">
              Des outils à manipuler dans le navigateur. Juger des questions écrites par des modèles de langage, ou réserver
              un véhicule puis valider la demande côté responsable.
            </span>
            <span className="path-go" aria-hidden="true">
              Essayer →
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="cles">
        <div className="head">
          <div className="head-text">
            <p className="label">Compétences clés</p>
            <h2 id="cles">Ce que je sais faire</h2>
          </div>
        </div>
        <ul className="skill-list">
          {skills.map((s) => (
            <li key={s.id}>
              <Link to={`/competences#${s.id}`}>
                <span className="skill-name">{s.title}</span>
                <span className="skill-short">{s.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
