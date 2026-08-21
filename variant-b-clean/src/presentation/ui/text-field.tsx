type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  description?: string;
  error?: string;
  defaultValue?: string;
};

export function TextField({
  id,
  name,
  label,
  type,
  autoComplete,
  description,
  error,
  defaultValue,
}: TextFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      {description ? (
        <p id={descriptionId} className="text-sm text-text-secondary">
          {description}
        </p>
      ) : null}

      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        className="min-h-11 rounded-control border border-border bg-surface px-3 text-base"
      />

      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
