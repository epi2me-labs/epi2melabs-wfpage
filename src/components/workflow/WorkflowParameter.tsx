import React from 'react';
import { Parameter } from './schema';
import { getInputComponent } from './inputs';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface IParameterComponent {
  id: string;
  schema: Parameter;
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

const ParameterComponent = ({
  id,
  schema,
  error,
  onChange,
  className
}: IParameterComponent): JSX.Element => (
  <div className={`parameter ${className}`}>
    {getInputComponent(id, schema, error, onChange)}
  </div>
);

// -----------------------------------------------------------------------------
// Component Styles
// -----------------------------------------------------------------------------
const StyledParameterComponent = styled(ParameterComponent)`
  padding: 25px 0;
  border-top: 1px solid #ccc;

  h4 {
    padding: 0 0 5px 0;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }

  p {
    padding: 0 0 10px 0;
  }

  input {
    font-size: 12px;
    font-family: monospace;
  }
`;

export default StyledParameterComponent;
