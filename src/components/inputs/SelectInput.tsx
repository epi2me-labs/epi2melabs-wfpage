import React from 'react';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const SELECT_INPUT = 'select';

interface ISelectChoice {
  value: string;
  label: string;
}

export interface ISelectProps {
  id: string;
  label: string;
  format: string;
  description: string;
  defaultValue?: string;
  choices: ISelectChoice[];
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface ISelectInput extends ISelectProps {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const SelectInput = ({
  id,
  label,
  format,
  description,
  defaultValue,
  choices,
  error,
  onChange,
  className
}: ISelectInput): JSX.Element => (
  <div className={`SelectInput ${className}`}>
    <h4>{label}</h4>
    <p>{description}</p>
    <label htmlFor={id}>
      <select
        id={id}
        onChange={(e: any) => onChange(id, format, e.target.value)}
      >
        {defaultValue ? (
          ''
        ) : (
          <option
            className="placeholder"
            selected
            disabled
            hidden
            value="Select an option"
          >
            Select an option
          </option>
        )}
        {choices.map(Choice => (
          <option
            key={Choice.label}
            selected={!!(Choice.value === defaultValue)}
            value={Choice.value}
          >
            {Choice.label}
          </option>
        ))}
      </select>
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
const StyledSelectInput = styled(SelectInput)`
  .input-container {
    margin: 25px 0 0 0;
    padding: 25px;
    background-color: #1e1e1e;
    border-radius: 4px;
  }

  .input-container p {
    padding: 15px 0;
  }

  select {
    cursor: pointer;
    border: 0;
    padding: 0;
    margin: 0;
    transition: 0.2s ease-in-out all;
  }

  select {
    position: relative;
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
    /* for Firefox */
    appearance: none;
    -moz-appearance: none;
    /* for Chrome */
    -webkit-appearance: none;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledSelectInput;
