import type { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error.message}</p>}
    </div>
  );
}

interface InputProps extends FormFieldProps {
  registration: UseFormRegisterReturn;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function FormInput({ label, error, registration, placeholder, type = "text" }: InputProps) {
  return (
    <FormField label={label} error={error}>
      <input type={type} {...registration} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
    </FormField>
  );
}

interface SelectProps extends FormFieldProps {
  registration: UseFormRegisterReturn;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, error, registration, options }: SelectProps) {
  return (
    <FormField label={label} error={error}>
      <select {...registration}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FormField>
  );
}

interface TextareaProps extends FormFieldProps {
  registration: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
}

export function FormTextarea({ label, error, registration, rows = 3, placeholder }: TextareaProps) {
  return (
    <FormField label={label} error={error}>
      <textarea {...registration} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
    </FormField>
  );
}
