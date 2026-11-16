import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Lien interne (route) ou externe (URL complète, ouverte dans un nouvel onglet). */
export function SmartLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (/^https?:\/\//.test(to)) {
    return (
      <a className={className} href={to} target="_blank" rel="noopener">
        {children}
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    );
  }
  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
}
