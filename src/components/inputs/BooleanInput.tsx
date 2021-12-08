import React, { useState } from 'react';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const BOOL_INPUT = 'boolean';

export interface IBooleanProps {
  id: string;
  label: string;
  format: string;
  description: string;
  defaultValue?: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface IBooleanInput extends IBooleanProps {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const BooleanInput = ({
  id,
  label,
  format,
  description,
  defaultValue,
  error,
  onChange,
  className
}: IBooleanInput): JSX.Element => {
  const [isChecked, setIsChecked] = useState(defaultValue);

  return (
    <div
      className={`BooleanInput ${className} ${
        isChecked ? 'checked' : 'unchecked'
      }`}
    >
      <h4>{label}</h4>
      <p>{description}</p>
      <label htmlFor={id}>
        <input
          id={id}
          className="boolInput"
          type="checkbox"
          defaultChecked={defaultValue}
          onChange={(e: any) => {
            setIsChecked(e.target.value);
            onChange(id, format, e.target.checked ? true : false);
          }}
        />
        <span>&#10003;</span>
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
};

// -----------------------------------------------------------------------------
// Component Styles
// -----------------------------------------------------------------------------
const StyledBooleanInput = styled(BooleanInput)`
  .input-container {
    margin: 25px 0 0 0;
    padding: 25px;
    background-color: #1e1e1e;
    border-radius: 4px;
  }

  p {
    padding: 15px 0;
    margin: 0 0 10px 0;
  }

  label {
    padding: 15px 0 0 0;
    position: relative;
  }

  input {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  label span {
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    transition: 0.2s ease-in-out all;
  }

  label span {
    margin-right: 15px;
    cursor: pointer;
    outline: none;
    background-color: transparent;
    padding: 10px 15px;
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

  label span {
    font-size: 20px;
  }

  input:checked + span {
    background-color: black;
    color: white;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledBooleanInput;
