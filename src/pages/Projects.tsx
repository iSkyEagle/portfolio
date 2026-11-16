import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router';
import { ProjectSheet } from '../components/ProjectSheet';
import { Tags } from '../components/Tags';
import { academicRows, filterProjects, otherRows, projects, type Project, type Row } from '../data/projects';
import { getSkill, skills, type SkillId } from '../data/skills';
import { usePageTitle } from '../hooks/usePageTitle';

function Rows({ rows }: { rows: Row[] }) {
  return (
    <div className="rows">
      {rows.map((r) => (
        <div className="row" key={r.title}>
          <h3>{r.title}</h3>
          <p>{r.text}</p>
          <Tags items={r.tags} />
        </div>
      ))}
    </div>
  );
}

export function Projects() {
  usePageTitle('Projets');
  const { id: targetId } = useParams();
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const requested = params.get('competence');
  const skill = requested && getSkill(requested) ? (requested as SkillId) : null;

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(targetId ? [targetId] : []));

  // Une fiche visée par l'adresse s'ouvre d'elle-même.
  useEffect(() => {
    if (targetId) setOpenIds((prev) => new Set(prev).add(targetId));
  }, [targetId]);

  // Arrivée sur une section précise (travaux académiques).
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ block: 'start' });
    el?.focus({ preventScroll: true });
  }, [hash]);

  const visible = filterProjects(projects, skill);
  const mine = visible.filter((p) => p.group === 'projets');
  const school = visible.filter((p) => p.group === 'scolaires');
  const allOpen = visible.length > 0 && visible.every((p) => openIds.has(p.id));

  function toggle(id: string, open: boolean) {
    setOpenIds((prev) => {
      if (prev.has(id) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    setOpenIds(allOpen ? new Set() : new Set(visible.map((p) => p.id)));
  }

  function choose(next: SkillId | null) {
    setParams(next ? { competence: next } : {}, { replace: true, preventScrollReset: true });
  }

  const sheets = (list: Project[]) =>
    list.map((p) => (
      <ProjectSheet key={p.id} project={p} open={openIds.has(p.id)} onToggle={toggle} focused={p.id === targetId} />
    ));

  return (
    <>
      <section aria-labelledby="titre-page">
        <div className="head">
          <div className="head-text">
            <p className="label">Projets personnels, professionnels et scolaires</p>
            <h1 id="titre-page" className="page-title">
              Fiches de projet
            </h1>
            <p>Chaque fiche donne l'essentiel en quelques lignes. Le détail s'ouvre à la demande.</p>
          </div>
          <button className="btn" type="button" onClick={toggleAll} aria-expanded={allOpen} disabled={visible.length === 0}>
            {allOpen ? 'Tout replier' : 'Tout déplier'}
          </button>
        </div>

        <div className="filter" role="group" aria-label="Filtrer les fiches par compétence">
          <button className="chip" type="button" aria-pressed={skill === null} onClick={() => choose(null)}>
            Toutes
          </button>
          {skills.map((s) => (
            <button className="chip" type="button" key={s.id} aria-pressed={skill === s.id} onClick={() => choose(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
        <p className="count" role="status">
          {visible.length} fiche{visible.length > 1 ? 's' : ''} sur {projects.length}
          {skill ? ` pour « ${getSkill(skill)!.title} »` : ''}
        </p>

        {mine.length > 0 && (
          <div className="group">
            <h2 className="group-title">Projets personnels et professionnels</h2>
            <div className="sheets">{sheets(mine)}</div>
          </div>
        )}
        {school.length > 0 && (
          <div className="group">
            <h2 className="group-title">Projets scolaires</h2>
            <div className="sheets">{sheets(school)}</div>
          </div>
        )}
      </section>

      <section id="alternance" tabIndex={-1} aria-labelledby="alternance-titre">
        <div className="head">
          <div className="head-text">
            <p className="label">Alternance</p>
            <h2 id="alternance-titre">Travaux académiques liés à mon alternance</h2>
            <p>Présentés de façon générale : les détails restent propres à mon entreprise.</p>
          </div>
        </div>
        <Rows rows={academicRows} />
      </section>

      <section aria-labelledby="autres-titre">
        <div className="head">
          <div className="head-text">
            <p className="label">Aussi</p>
            <h2 id="autres-titre">Autres réalisations</h2>
          </div>
        </div>
        <Rows rows={otherRows} />
      </section>
    </>
  );
}
