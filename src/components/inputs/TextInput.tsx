import React from 'react';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const STR_INPUT = 'string';

export interface ITextProps {
  id: string;
  label: string;
  format: string;
  description: string;
  defaultValue: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface ITextInput extends ITextProps {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const TextInput = ({
  id,
  label,
  format,
  description,
  defaultValue,
  minLength,
  maxLength,
  pattern,
  error,
  onChange,
  className
}: ITextInput): JSX.Element => (
  <div className={`TextInput ${className}`}>
    <h4>{label}</h4>
    <p>{description}</p>
    <label htmlFor={id}>
      <input
        id={id}
        type="text"
        placeholder={'Enter a value'}
        defaultValue={defaultValue}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        onChange={e => onChange(id, format, e.target.value)}
      />
    </label>
    {error ? (
      <div className="error">
        <p>Error: {error}</p>
      </div>
    ) : (
      ''
    )}
  </div>
);

// -----------------------------------------------------------------------------
// Component Styles
// -----------------------------------------------------------------------------
const StyledTextInput = styled(TextInput)`
  .input-container {
    margin: 25px 0 0 0;
    padding: 25px;
    background-color: #1e1e1e;
    border-radius: 4px;
  }

  .input-container p {
    padding: 15px 0;
  }

  input {
    border: 0;
    padding: 0;
    margin: 0;
    transition: 0.2s ease-in-out all;
  }
  input {
    min-width: 50%;
    margin-right: 15px;
    outline: none;
    background-color: transparent;
    padding: 15px 25px;
    border: 1px solid black;
    color: black;
    font-size: 11px;
    border-radius: 4px;
    line-height: 1em;
    letter-spacing: 0.05em;
    transition: 0.2s ease-in-out all;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledTextInput;
