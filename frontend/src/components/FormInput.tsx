interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function FormInput({ label, error, className = '', ...props }: FormInputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">
          {label}
        </label>
      )}
      <input className={`input-primary w-full ${className}`} {...props} />
      {error && (
        <p className="mt-1.5 text-[13px] text-danger">{error}</p>
      )}
    </div>
  )
}
