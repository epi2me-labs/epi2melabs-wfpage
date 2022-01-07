import React, { useState, useRef, useEffect } from 'react';
import { requestAPI } from '../../handler';
import styled from 'styled-components';

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------
export const FILE_INPUT = 'file';

export interface IFileSettings {
  id: string;
  label: string;
  format: string;
  description: string;
  defaultValue?: string;
  pattern?: string;
}

interface IFileInput extends IFileSettings {
  error: string[];
  onChange: CallableFunction;
  className?: string;
}

interface IPath {
  name: string;
  path: string;
  updated: string;
  dir: boolean;
}

// -----------------------------------------------------------------------------
// Helper methods
// -----------------------------------------------------------------------------
const setNativeValue = (element: any, value: any) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    'value'
  )?.set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter?.call(element, value);
  } else {
    valueSetter?.call(element, value);
  }
};

const mapFormatToEndpoint = (format: string) => {
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
  return fmt;
};

const getDirContents = async (path: string) => {
  const encodedPath = encodeURIComponent(path);
  const data = await requestAPI<any>(`directory/${encodedPath}?contents=true`, {
    method: 'GET'
  });
  return data.contents;
};

const getParentDir = (path: string) => {
  const parent = path.split('/').slice(0, -1).join('/');
  if (parent === '') {
    return '/';
  }
  return parent;
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
const FileInput = ({
  id,
  label,
  format,
  description,
  defaultValue,
  pattern,
  error,
  onChange,
  className
}: IFileInput) => {
  // ------------------------------------
  // Set up state
  // ------------------------------------
  const [browserError, setBrowserError] = useState<string[] | null>(null);
  const [browserLocation, setBrowserLocation] = useState('/');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [browserContents, setBrowserContents] = useState<IPath[]>([]);
  const [browserOpen, setBrowserOpen] = useState(false);
  const inputRef = useRef(null);

  // ------------------------------------
  // Handle browser change
  // ------------------------------------
  useEffect(() => {
    const update = async () => {
      const contents = await getDirContents(browserLocation);
      setBrowserContents(contents);
    };
    update();
  }, [browserLocation]);

  const handleDoubleClickPath = (path: string, dir: boolean) => {
    if (dir) {
      //   setPrevBrowserLocation(browserLocation);
      setBrowserLocation(path);
    }
  };

  // ------------------------------------
  // Handle input change
  // ------------------------------------
  const handleInputChange = (value: any) => {
    const fmt = mapFormatToEndpoint(format);
    validatePath(value, fmt);
  };

  const handleClickPath = (path: string, dir: boolean, ref: any) => {
    if (path === selectedPath) {
      return;
    }
    if (dir && mapFormatToEndpoint(format) === 'file') {
      return;
    }
    setSelectedPath(path);
    const current = ref.current;
    if (current) {
      setNativeValue(current, path);
      const event = new Event('input', { bubbles: true });
      current.dispatchEvent(event);
    }
  };

  // ------------------------------------
  // Handle path validation
  // ------------------------------------
  const validatePath = async (path: string, format: string) => {
    const encodedPath = encodeURIComponent(path);
    const data = await requestAPI<any>(`${format}/${encodedPath}`, {
      method: 'GET'
    });
    if (!data.exists) {
      setBrowserError(data.error);
      return;
    }
    setBrowserError(null);
    onChange(id, format, path);
  };

  return (
    <div className={`FileInput ${className}`}>
      <h4>{label}</h4>
      <p>{description}</p>
      <div className="file-input-container">
        <label htmlFor={id}>
          <input
            id={id}
            ref={inputRef}
            type="text"
            placeholder={'Enter a value'}
            defaultValue={defaultValue}
            pattern={pattern}
            onChange={e => {
              handleInputChange(e.target.value);
            }}
          />
        </label>
        <div className="file-browser-toggle">
          <button onClick={() => setBrowserOpen(!browserOpen)}>Browse</button>
        </div>
      </div>

      {browserOpen ? (
        <div className="file-browser">
          <ul>
            {browserLocation !== '/' ? (
              <button
                onClick={() =>
                  setBrowserLocation(getParentDir(browserLocation))
                }
              >
                Go Up
              </button>
            ) : (
              ''
            )}
            {browserContents.map(Item => (
              <li className="file-browser-path">
                <button
                  onClick={() => handleClickPath(Item.path, Item.dir, inputRef)}
                  onDoubleClick={() =>
                    handleDoubleClickPath(Item.path, Item.dir)
                  }
                >
                  {Item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        ''
      )}

      {browserError ? (
        <div className="error">
          <p>Error: {browserError}</p>
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

  .file-input-container {
    display: flex;
  }

  .file-input-container label {
    display: inline-block;
    width: 50%;
  }

  .file-input-container input {
    box-sizing: border-box;
    border: 0;
    padding: 0;
    margin: 0;
    width: 100%;
    outline: none;
    background-color: transparent;
    padding: 15px 25px;
    border: 1px solid black;
    color: black;
    font-size: 11px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    line-height: 1em;
    letter-spacing: 0.05em;
    transition: 0.2s ease-in-out all;
  }

  .file-input-container .file-browser-toggle button {
    padding: 15px 25px;
    border-radius: 0;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    color: black;
    font-size: 11px;
    border: 1px solid black;
  }

  .file-browser {
    max-height: 300px;
    border: 1px solid black;
    border-radius: 4px;
    overflow-y: auto;
  }

  .file-browser-path {
    min-width: 50%;
    padding: 5px 25px;
    background-color: white;
    color: black;
    border-bottom: 1px solid black;
    font-size: 11px;
    line-height: 1em;
    letter-spacing: 0.05em;
  }

  .error {
    padding: 15px 0 0 0;
    color: #e34040;
  }
`;

export default StyledFileInput;
