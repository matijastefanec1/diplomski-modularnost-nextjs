"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";

export type ComboboxOption = {
  id: string;
  label: string;
};

type ComboboxFieldProps = {
  id: string;
  name: string;
  label: string;
  options: readonly ComboboxOption[];
  defaultValue?: string;
  error?: string;
};

export function ComboboxField({
  id,
  name,
  label,
  options,
  defaultValue = "",
  error,
}: ComboboxFieldProps) {
  const listboxId = useId();
  const errorId = error ? `${id}-error` : undefined;
  const selectedOption = options.find((option) => option.id === defaultValue);

  const [selectedId, setSelectedId] = useState(
    selectedOption ? selectedOption.id : "",
  );
  const [query, setQuery] = useState(selectedOption ? selectedOption.label : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (needle === "") {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const activeOption = matches[activeIndex];

  function select(option: ComboboxOption) {
    setSelectedId(option.id);
    setQuery(option.label);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);

      if (matches.length === 0) {
        return;
      }

      const lastIndex = matches.length - 1;

      if (event.key === "ArrowDown") {
        setActiveIndex((index) => (index === lastIndex ? 0 : index + 1));
      } else {
        setActiveIndex((index) => (index === 0 ? lastIndex : index - 1));
      }
      return;
    }

    if (event.key === "Enter" && open && activeOption) {
      event.preventDefault();
      select(activeOption);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <input type="hidden" name={name} value={selectedId} />

      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        value={query}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeOption ? `${listboxId}-${activeOption.id}` : undefined
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={(event) => {
          setQuery(event.target.value);
          // forma šalje id igrača
          // ako korisnik odabere igrača i nastavi tipkati, stari id je zalijepljen uz novi tekst i šalje se kriva vrijednost
          setSelectedId("");
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="min-h-11 rounded-control border border-border bg-surface px-3 text-base"
      />

      <ul
        id={listboxId}
        role="listbox"
        hidden={!open}
        className="max-h-60 overflow-y-auto rounded-control border border-border bg-surface"
      >
        {matches.map((option, index) => (
          <li
            key={option.id}
            id={`${listboxId}-${option.id}`}
            role="option"
            aria-selected={option.id === selectedId}
            onMouseDown={(event) => {
              event.preventDefault();
              select(option);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={`cursor-pointer break-words px-3 py-2 text-sm ${
              index === activeIndex ? "bg-primary-soft text-primary" : ""
            }`}
          >
            {option.label}
          </li>
        ))}
      </ul>

      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
