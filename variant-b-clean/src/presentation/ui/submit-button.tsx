type SubmitButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  pending: boolean;
  testId?: string;
};

const variantClassName = {
  primary:
    "bg-primary text-surface hover:bg-primary-hover",
  secondary:
    "border border-border bg-surface hover:bg-primary-soft hover:text-primary",
};

export const SubmitButton = ({
  label,
  variant = "primary",
  pending,
  testId,
}: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      data-testid={testId}
      className={`inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${variantClassName[variant]}`}
    >
      {label}
    </button>
  );
};
