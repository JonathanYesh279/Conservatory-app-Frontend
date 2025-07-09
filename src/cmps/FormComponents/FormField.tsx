// src/cmps/FormComponents/FormField.tsx
import React, { ReactNode } from 'react';
import { useField } from 'formik';

// Create a more specific type for the component props
export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  errorMessage?: string;
  placeholder?: string;
  labelIcon?: ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  as?: 'select' | 'textarea' | undefined;
  type?: string;
  id?: string;
  children?: React.ReactNode;
  rows?: number;
  min?: string | number;
  max?: string | number;
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
      <div className='field-header'>
        <label htmlFor={props.id || name} className={required ? 'required-field' : ''}>
          {labelIcon && <span className='label-icon'>{labelIcon}</span>}
          {label}
        </label>
        {isError && (
          <div className='form-error-inline'>{errorMessage || meta.error}</div>
        )}
      </div>

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
          value={field.value === undefined ? (props.type === 'number' ? '' : '') : field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          {...props}
        />
      )}
    </div>
  );
};

// Checkbox variant
export interface FormCheckboxProps extends Omit<FormFieldProps, 'as'> {
  id?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
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
      <label htmlFor={props.id || name} className={required ? 'required-field' : ''}>
        {label}
      </label>

      {meta.touched && meta.error ? (
        <div className='form-error'>{meta.error}</div>
      ) : null}
    </div>
  );
};

// Radio button variant
export interface FormRadioProps extends FormFieldProps {
  value: string | number;
}

export const FormRadio: React.FC<FormRadioProps> = ({
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