import { forwardRef, useId } from "react";

const AuthField = forwardRef(function AuthField(
  { label, error, icon, rightLabel, hint, className = "", ...inputProps },
  ref
) {
  const generatedId = useId();
  const inputId = inputProps.id || generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="block w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {rightLabel}
      </div>

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-[14px] border ${error ? "border-destructive focus:border-destructive" : "border-white/10 focus:border-primary/50"
            } bg-black/40 ${icon ? 'pl-11' : 'px-4'} pr-4 py-3 text-[14px] text-white outline-none focus:ring-1 ${error ? "focus:ring-destructive/30" : "focus:ring-primary/30"
            } placeholder:text-zinc-600 transition-all ${className}`.trim()}
          {...inputProps}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive mt-1.5" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default AuthField;
