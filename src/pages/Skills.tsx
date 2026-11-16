import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { SmartLink } from '../components/SmartLink';
import { Tags } from '../components/Tags';
import { getDemo } from '../data/demos';
import { projects } from '../data/projects';
import { skills } from '../data/skills';
import { usePageTitle } from '../hooks/usePageTitle';

export function Skills() {
  usePageTitle('Compétences');
  const { hash } = useLocation();

  // Arrivée sur une compétence précise (depuis l'accueil).
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
  }, [hash]);

  return (
    <section aria-labelledby="titre-page">
      <div className="head">
        <div className="head-text">
          <p className="label">L'essentiel en 2 minutes</p>
          <h1 id="titre-page" className="page-title">
            Compétences et preuves
          </h1>
          <p>Chaque compétence est suivie des réalisations qui la démontrent. Rien n'est affirmé sans exemple.</p>
        </div>
      </div>

      <div className="skills">
        {skills.map((s) => {
          const demo = s.demoId ? getDemo(s.demoId) : undefined;
          const count = projects.filter((p) => p.skills.includes(s.id)).length;
          return (
            <article className="skill" id={s.id} key={s.id} tabIndex={-1} aria-labelledby={`${s.id}-titre`}>
              <div className="skill-head">
                <h2 id={`${s.id}-titre`}>{s.title}</h2>
                <p>{s.description}</p>
                <Tags items={s.tools} />
              </div>
              <div className="skill-proofs">
                <p className="label">Preuves</p>
                <ul className="proofs">
                  {s.proofs.map((p) => (
                    <li key={p.label}>
                      <SmartLink to={p.to}>{p.label}</SmartLink>
                      <span>{p.claim}</span>
                    </li>
                  ))}
                </ul>
                <div className="skill-more">
                  <Link className="btn" to={`/projets?competence=${s.id}`}>
                    Voir {count === 1 ? 'la fiche liée' : `les ${count} fiches liées`}
                  </Link>
                  {demo && (
                    <Link className="btn" to={demo.route ?? '/demos'}>
                      <span>Démo : {demo.title}</span>
                      {demo.state === 'preparation' && <span className="soon">en préparation</span>}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
