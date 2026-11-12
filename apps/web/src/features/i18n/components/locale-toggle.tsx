'use client';

import { useLocaleToggle } from '../hooks/use-locale-toggle';

export function LocaleToggle() {
  const { label, options, handleSelect } = useLocaleToggle();

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 text-sm">
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          lang={option.locale}
          aria-pressed={option.isActive}
          onClick={() => handleSelect(option.locale)}
          className={`rounded-sm px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            option.isActive ? 'font-semibold underline' : 'text-muted-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
