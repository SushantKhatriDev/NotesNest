type HighlightProps = {
  text: string;
  query: string;
};

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Highlight({ text, query }: HighlightProps) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const pattern = new RegExp(`(${escapeForRegExp(trimmed)})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-brand/15 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}
