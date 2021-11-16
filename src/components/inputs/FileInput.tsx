import React from 'react';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const FILE_INPUT = 'file';

export interface IFileProps {
  id: string;
  label: string;
  description: string;
  defaultValue?: string;
  accept?: string;
  multiple: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface IFileInput extends IFileProps {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const FileInput = ({
  id,
  label,
  description,
  defaultValue,
  accept,
  multiple,
  error,
  onChange,
  className
}: IFileInput) => (
  <div className={`FileInput ${className}`}>
    <h4>{label}</h4>
    <p>{description}</p>
    <label htmlFor={id}>
      <input
        id={id}
        type="file"
        defaultValue={defaultValue}
        multiple={false}
        accept={accept}
        onChange={(e: any) => onChange(id, e.target.files[0].path)}
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
const StyledFileInput = styled(FileInput)`
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
  input::file-selector-button {
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
    line-height: 1em;
    letter-spacing: 0.05em;
    transition: 0.2s ease-in-out all;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledFileInput;
