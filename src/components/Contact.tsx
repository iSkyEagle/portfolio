import { useEffect, useRef, useState } from 'react';
import { contact } from '../data/parcours';

const HELP = 'Si votre messagerie ne s\'ouvre pas, copiez l\'adresse avec le bouton « Copier ».';

export function Contact() {
  const [label, setLabel] = useState('Copier');
  const [message, setMessage] = useState(HELP);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function report(nextLabel: string, nextMessage: string) {
    setLabel(nextLabel);
    setMessage(nextMessage);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setLabel('Copier');
      setMessage(HELP);
    }, 2500);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(contact.email);
      report('Copié', 'Adresse copiée dans le presse-papiers.');
    } catch {
      report('Copier', "La copie a échoué : sélectionnez l'adresse à la main.");
    }
  }

  return (
    <section className="contact" id="contact" tabIndex={-1} aria-labelledby="contact-titre">
      <h2 id="contact-titre">Me contacter</h2>
      <div className="grid">
        <div>
          <div className="k">Email</div>
          <div className="v">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <button className="copy" type="button" onClick={copy}>
              {label}
            </button>
          </div>
        </div>
        <div>
          <div className="k">LinkedIn</div>
          <div className="v">
            <a href={contact.linkedin.url} target="_blank" rel="noopener">
              {contact.linkedin.label}
            </a>
          </div>
        </div>
        <div>
          <div className="k">GitHub</div>
          <div className="v">
            <a href={contact.github.url} target="_blank" rel="noopener">
              {contact.github.label}
            </a>
          </div>
        </div>
      </div>
      <p className="help" role="status">
        {message}
      </p>
    </section>
  );
}
