import { Link } from 'react-router';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFound() {
  usePageTitle('Page introuvable');
  return (
    <section aria-labelledby="titre-page">
      <div className="head">
        <div className="head-text">
          <p className="label">Adresse inconnue</p>
          <h1 id="titre-page" className="page-title">
            Cette page n'existe pas
          </h1>
          <p>L'adresse a peut-être changé. Le menu en haut de page mène à toutes les rubriques.</p>
        </div>
        <Link className="btn primary" to="/">
          Revenir à l'accueil
        </Link>
      </div>
    </section>
  );
}
