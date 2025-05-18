// src/cmps/FormComponents/FormField.tsx
import React from 'react';
import { useField, FieldAttributes } from 'formik';

// Create a more specific type for the component props
interface FormFieldProps extends FieldAttributes<any> {
  label: string;
  required?: boolean;
  className?: string;
  errorMessage?: string;
  placeholder?: string;
  labelIcon?: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required = false,
  className = '',
  errorMessage,
  labelIcon,
  style,
  disabled,
  children,
  ...props
}) => {
  const [field, meta] = useField(name);
  const isError = meta.touched && meta.error;

  // Combine CSS classes
  const inputClasses = `${className || ''} ${isError ? 'is-invalid' : ''}`;

  return (
    <div className='form-group' style={style}>
      <label htmlFor={props.id || name}>
        {labelIcon && <span className='label-icon'>{labelIcon}</span>}
        {label} {required && <span className='required-mark'>*</span>}
      </label>

      {props.as === 'select' ? (
        <select
          id={props.id || name}
          className={inputClasses}
          disabled={disabled}
          {...field}
          {...props}
        >
          {children}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea
          id={props.id || name}
          className={inputClasses}
          disabled={disabled}
          {...field}
          {...props}
        />
      ) : (
        <input
          id={props.id || name}
          className={inputClasses}
          type={props.type || 'text'}
          disabled={disabled}
          {...field}
          {...props}
        />
      )}

      {isError && (
        <div className='form-error'>{errorMessage || meta.error}</div>
      )}
    </div>
  );
};

// Checkbox variant
export const FormCheckbox: React.FC<Omit<FormFieldProps, 'as'>> = ({
  label,
  name,
  required = false,
  className = '',
  disabled,
  ...props
}) => {
  const [field, meta] = useField({ name, type: 'checkbox' });

  return (
    <div className='form-checkbox'>
      <input
        type='checkbox'
        id={props.id || name}
        className={`${className} ${
          meta.touched && meta.error ? 'is-invalid' : ''
        }`}
        disabled={disabled}
        {...field}
        {...props}
      />
      <label htmlFor={props.id || name}>
        {label} {required && <span className='required-mark'>*</span>}
      </label>

      {meta.touched && meta.error ? (
        <div className='form-error'>{meta.error}</div>
      ) : null}
    </div>
  );
};

// Radio button variant
export const FormRadio: React.FC<
  FormFieldProps & { value: string | number }
> = ({
  label,
  name,
  value,
  required = false,
  className = '',
  disabled,
  ...props
}) => {
  const [field, meta] = useField({ name, type: 'radio', value });

  return (
    <div className='form-radio'>
      <input
        type='radio'
        id={`${name}-${value}`}
        className={`${className} ${
          meta.touched && meta.error ? 'is-invalid' : ''
        }`}
        disabled={disabled}
        {...field}
        value={value}
        checked={field.value === value}
        {...props}
      />
      <label htmlFor={`${name}-${value}`}>{label}</label>

      {meta.touched && meta.error ? (
        <div className='form-error'>{meta.error}</div>
      ) : null}
    </div>
  );
};
