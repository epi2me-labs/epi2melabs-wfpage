import React, { useEffect, useState } from 'react';
import { requestAPI } from '../../handler';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { GenericStringObject, GenericObject } from '../../types';
import { validateSchema, parseValidationErrors } from '../../schema';
import StyledWorkflowParameterSection from './WorkflowParameterSection';
import {
  Workflow,
  WorkflowDefaults,
  ParameterSection,
  Parameter
} from './schema';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface IWorkflowComponent {
  className?: string;
}

const WorkflowComponent = ({ className }: IWorkflowComponent): JSX.Element => {
  // ------------------------------------
  // Set up state
  // ------------------------------------
  const params = useParams();
  const navigate = useNavigate();
  const [workflowData, setWorkflowData] = useState<Workflow | undefined>();
  const [workflowParams, setWorkflowParams] = useState<WorkflowDefaults>({});
  const [workflowParamsValid, setWorkflowParamsValid] = useState(false);
  const [workflowParamsErrors, setWorkflowParamsErrors] =
    useState<GenericObject>({});
  const [workflowActiveSections, setWorkflowActiveSections] = useState<
    ParameterSection[]
  >([]);

  // ------------------------------------
  // Handle component initialisation
  // ------------------------------------
  const getWorkflowData = async () => {
    return await requestAPI<any>(`workflows/${params.name}`);
  };

  const filterHiddenParameters = (parameters: { [key: string]: Parameter }) =>
    Object.entries(parameters)
      .filter(([key, Property]) => !Property.hidden && key !== 'out_dir')
      .reduce(
        (obj, prop) => ({
          [prop[0]]: prop[1],
          ...obj
        }),
        {}
      );

  const filterSchemaSections = (definitions: ParameterSection[]) => {
    return Object.values(definitions)
      .map(Section => ({
        ...Section,
        properties: filterHiddenParameters(Section.properties)
      }))
      .filter(Def => Object.keys(Def.properties).length !== 0);
  };

  useEffect(() => {
    const init = async () => {
      const workflowData = await getWorkflowData();
      setWorkflowData(workflowData);
      setWorkflowParams(workflowData.defaults);

      const sections = filterSchemaSections(workflowData.schema.definitions);
      setWorkflowActiveSections(sections);
    };
    init();
  }, []);

  // ------------------------------------
  // Handle parameter validation
  // ------------------------------------
  const filterErrorsByParameters = (
    parameters: { [key: string]: Parameter },
    errors: GenericStringObject
  ) =>
    Object.keys(parameters).reduce(
      (obj, key) =>
        Object.prototype.hasOwnProperty.call(errors, key)
          ? {
              ...obj,
              [key]: errors[key]
            }
          : obj,
      {}
    );

  const handleInputChange = (id: string, format: string, value: any) => {
    if (value === '') {
      const { [id]: _, ...rest } = workflowParams;
      setWorkflowParams(rest);
      return;
    }
    if (['file-path', 'directory-path', 'path'].includes(format)) {
      let fmt;
      switch (format) {
        case 'file-path':
          fmt = 'file';
          break;
        case 'directory-path':
          fmt = 'directory';
          break;
        default:
          fmt = 'path';
      }
      validatePath(id, value, fmt);
      return;
    }
    setWorkflowParams({ ...workflowParams, [id]: value });
  };

  const validatePath = async (id: string, path: string, format = 'file') => {
    const encodedPath = encodeURIComponent(path);
    const data = await requestAPI<any>(`${format}/${encodedPath}`, {
      method: 'GET'
    });
    if (!data.exists) {
      setWorkflowParamsErrors({
        ...workflowParamsErrors,
        [id]: [data.error]
      });
      setWorkflowParamsValid(false);
      return;
    }
    setWorkflowParamsErrors({ ...workflowParamsErrors, [id]: [] });
    setWorkflowParams({ ...workflowParams, [id]: path });
  };

  useEffect(() => {
    if (workflowData) {
      const { valid, errors } = validateSchema(
        workflowParams,
        workflowData.schema
      );
      valid
        ? setWorkflowParamsErrors({})
        : setWorkflowParamsErrors(parseValidationErrors(errors));
      setWorkflowParamsValid(valid);
    }
  }, [workflowParams]);

  // ------------------------------------
  // Handle workflow launch
  // ------------------------------------
  const launchWorkflow = async () => {
    if (!workflowParamsValid) {
      return;
    }
    const { instance } = await requestAPI<any>('instances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow: params.name,
        params: workflowParams
      })
    });
    navigate(`/instances/${instance.id}`);
  };

  return workflowData ? (
    <div className={`workflow ${className}`}>
      <div className="workflow-container">
        {/* Workflow header */}
        <div className="workflow-section workflow-header">
          <h1>Workflow: {params.name}</h1>
          <div className="workflow-details">
            <div>{workflowData.desc}</div>
            <div>Version {workflowData.defaults.wfversion}</div>
          </div>
        </div>

        {/* Workflow params */}
        <div className="workflow-section workflow-parameter-sections">
          <h2>1. Choose parameters</h2>
          <div className="workflow-section-contents">
            <ul>
              {workflowActiveSections.map(Section => (
                <li>
                  <StyledWorkflowParameterSection
                    title={Section.title}
                    description={Section.description}
                    fa_icon={Section.fa_icon}
                    properties={Section.properties}
                    errors={filterErrorsByParameters(
                      Section.properties,
                      workflowParamsErrors
                    )}
                    onChange={handleInputChange}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workflow launch */}
        <div className="workflow-section workflow-launch-control">
          <h2>2. Launch workflow</h2>
          <div className="workflow-section-contents">
            <div
              className={`launch-control ${
                workflowParamsValid ? 'active' : 'inactive'
              }`}
            >
              <button onClick={() => launchWorkflow()}>Run command</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <React.Fragment />
  );
};

// -----------------------------------------------------------------------------
// Component Styles
// -----------------------------------------------------------------------------
const StyledWorkflowComponent = styled(WorkflowComponent)`
  background-color: #f6f6f6;

  .workflow-container {
    padding: 50px 0 100px 0 !important;
  }

  .workflow-section {
    width: 100%;
    padding: 15px;
    max-width: 1200px;
    margin: 0 auto 25px auto;
    background-color: white;
    box-shadow: 0 6px 15px rgb(36 37 38 / 8%);
    border-radius: 4px;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
    background-color: #ffffff;
  }

  .workflow-section > h2 {
    padding-bottom: 15px;
  }

  .workflow-details div {
    color: #333;
    font-weight: normal;
    font-size: 14px;
    padding-bottom: 5px;
  }

  .workflow-parameter-sections .workflow-section-contents > ul > li {
    background-color: #f6f6f6;
    padding: 15px;
    margin: 0 0 15px 0;
    border-radius: 4px;
  }

  .workflow-launch-control .workflow-section-contents {
    padding: 15px;
    border-radius: 4px;
    background-color: #f6f6f6;
  }

  .workflow-launch-control button {
    padding: 15px 25px;
    margin: 0 15px 0 0;
    border: 1px solid lightgray;
    color: lightgray;
    text-transform: uppercase;
    font-size: 11px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1em;
    letter-spacing: 0.05em;
    transition: 0.2s ease-in-out all;
    outline: none;
    background-color: transparent;
  }

  .workflow-launch-control .active button {
    border: 1px solid #1d9655;
    color: #1d9655;
  }
  .workflow-launch-control .active button:hover {
    cursor: pointer;
    background-color: #1d9655;
    color: white;
  }
`;

export default StyledWorkflowComponent;
