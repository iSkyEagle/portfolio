export function Tags({ items }: { items: string[] }) {
  return (
    <ul className="tags" aria-label="Outils et notions">
      {items.map((t) => (
        <li className="tag" key={t}>
          {t}
        </li>
      ))}
    </ul>
  );
}
