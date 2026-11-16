import { useEffect } from 'react';

const SITE = 'Portfolio Clément Emery';

/** Titre de l'onglet : la page d'abord, pour s'y retrouver entre plusieurs onglets. */
export function usePageTitle(page?: string): void {
  useEffect(() => {
    document.title = page ? `${page} · ${SITE}` : SITE;
  }, [page]);
}
