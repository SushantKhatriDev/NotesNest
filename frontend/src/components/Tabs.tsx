type Tab = { id: string; label: string; count: number };

type TabsProps = {
  tabs: Tab[];
  selected: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, selected, onChange }: TabsProps) {
  const selectRelative = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].id);
  };

  return (
    <div role="tablist" aria-label="Resource type" className="segmented-control">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`${tab.id}-tab`}
          type="button"
          role="tab"
          aria-selected={selected === tab.id}
          aria-controls={`${tab.id}-panel`}
          tabIndex={selected === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              selectRelative(index + 1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              selectRelative(index - 1);
            }
          }}
          className={`text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
            selected === tab.id
              ? "bg-brand text-white"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          {tab.label} <span className="ml-1 text-xs">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}
