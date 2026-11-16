import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useTheme } from '../hooks/useTheme';
import { Contact } from './Contact';

const links = [
  { to: '/competences', label: 'Compétences' },
  { to: '/demos', label: 'Démos' },
  { to: '/projets', label: 'Projets' },
  { to: '/parcours', label: 'Parcours' },
];

export function Layout() {
  const { mode, cycle } = useTheme();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // À chaque changement de page : retour en haut et focus sur le contenu,
  // pour que le clavier et les lecteurs d'écran suivent la navigation.
  // Les fiches de projet gèrent elles-mêmes leur défilement.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (/^\/projets\/.+/.test(pathname)) return;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  function goToContact() {
    const el = document.getElementById('contact');
    el?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
  }

  return (
    <>
      <a
        className="skip"
        href="#contenu"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Aller au contenu
      </a>

      <nav className="nav" aria-label="Navigation principale">
        <div className="nav-in">
          <Link className="brand" to="/">
            Clément Emery
          </Link>
          <ul className="links">
            <li className="home-link">
              <NavLink to="/" end>
                Accueil
              </NavLink>
            </li>
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}>{l.label}</NavLink>
              </li>
            ))}
            <li>
              <button className="link-btn" type="button" onClick={goToContact}>
                Contact
              </button>
            </li>
          </ul>
          <button
            className="theme"
            type="button"
            onClick={cycle}
            aria-label={`Thème d'affichage : ${mode}. Activer pour changer.`}
          >
            Thème : {mode}
          </button>
        </div>
      </nav>

      <main className="wrap" id="contenu" ref={mainRef} tabIndex={-1}>
        <Outlet />
        <Contact />
      </main>

      <footer>Clément Emery · 2026</footer>
    </>
  );
}
