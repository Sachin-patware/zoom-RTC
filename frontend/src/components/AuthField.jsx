import { forwardRef, useId } from "react";

const AuthField = forwardRef(function AuthField(
  { label, error, icon, rightLabel, hint, className = "", ...inputProps },
  ref
) {
  const generatedId = useId();
  const inputId = inputProps.id || generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <label className="block" htmlFor={inputId}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          {label}
        </span>
        {rightLabel}
      </div>

      <div className={`auth-field ${error ? "auth-field-error" : ""}`}>
        <div className={`auth-field-icon ${error ? "auth-field-icon-error" : ""}`}>{icon}</div>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`auth-field-input ${className}`.trim()}
          {...inputProps}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="auth-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="auth-hint">
          {hint}
        </p>
      ) : null}
    </label>
  );
});

export default AuthField;
