import React from 'react';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const NUM_INPUT = 'number';
export const INT_INPUT = 'integer';

export interface INumProps {
  id: string;
  label: string;
  format: string;
  description: string;
  defaultValue?: number;
  min: number;
  max: number;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface INumInput extends INumProps {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const NumInput = ({
  id,
  label,
  format,
  description,
  defaultValue,
  min,
  max,
  error,
  onChange,
  className
}: INumInput): JSX.Element => (
  <div className={`NumInput ${className}`}>
    <h4>{label}</h4>
    <p>{description}</p>
    <label htmlFor={id}>
      <input
        id={id}
        type="number"
        defaultValue={defaultValue}
        min={min}
        max={max}
        onChange={(e: any) => onChange(id, format, Number(e.target.value))}
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
const StyledNumInput = styled(NumInput)`
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
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    transition: 0.2s ease-in-out all;
  }
  input {
    margin-right: 15px;
    cursor: pointer;
    outline: none;
    background-color: transparent;
    padding: 15px 25px;
    border: 1px solid black;
    color: black;
    text-transform: uppercase;
    font-size: 11px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1em;
    letter-spacing: 0.05em;
    transition: 0.2s ease-in-out all;

    -moz-appearance: textfield;
  }
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledNumInput;
