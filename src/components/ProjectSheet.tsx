import { useEffect, useRef } from 'react';
import { statusLabel, type Project } from '../data/projects';
import { Tags } from './Tags';

interface Props {
  project: Project;
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  /** Fiche visée par l'adresse : on l'amène à l'écran. */
  focused?: boolean;
}

export function ProjectSheet({ project, open, onToggle, focused = false }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: 'start' });
      ref.current.focus({ preventScroll: true });
    }
  }, [focused]);

  return (
    <article
      ref={ref}
      id={project.id}
      tabIndex={-1}
      className={`sheet${project.wide ? ' wide' : ''}${focused ? ' is-target' : ''}`}
      aria-labelledby={`${project.id}-titre`}
    >
      <div className="sheet-top">
        <span className={`status ${project.status === 'cours' ? 'wip' : 'done'}`}>{statusLabel[project.status]}</span>
        <span className="label">{project.category}</span>
      </div>
      <h3 id={`${project.id}-titre`}>{project.title}</h3>
      <p className="summary">{project.summary}</p>
      <Tags items={project.tags} />
      <details open={open} onToggle={(e) => onToggle(project.id, e.currentTarget.open)}>
        <summary>{open ? 'Masquer le détail' : 'Voir le détail'}</summary>
        <dl>
          {project.details.map((d) => (
            <div className="dl-row" key={d.term}>
              <dt>{d.term}</dt>
              <dd>{d.text}</dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  );
}
