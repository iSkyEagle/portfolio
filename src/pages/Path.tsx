import { Fragment } from 'react';
import { method, steps } from '../data/parcours';
import { usePageTitle } from '../hooks/usePageTitle';

export function Path() {
  usePageTitle('Parcours');
  return (
    <>
      <section aria-labelledby="titre-page">
        <div className="head">
          <div className="head-text">
            <p className="label">Parcours</p>
            <h1 id="titre-page" className="page-title">
              Formation et expérience
            </h1>
          </div>
        </div>
        <div className="path">
          {steps.map((s) => (
            <Fragment key={s.what}>
              <div className="when">{s.when}</div>
              <div className="what">
                <strong>{s.what}</strong> <span>· {s.detail}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section aria-labelledby="methode">
        <div className="head">
          <div className="head-text">
            <p className="label">Méthode</p>
            <h2 id="methode">Ma méthode de travail</h2>
          </div>
        </div>
        <div className="method">
          {method.map((m) => (
            <div key={m.title}>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
