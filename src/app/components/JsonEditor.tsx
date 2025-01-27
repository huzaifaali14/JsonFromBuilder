import React, { useState, useEffect, useRef } from 'react';
import { Input, Alert } from 'antd';

const { TextArea } = Input;

const shallowEqual = (objA, objB) => {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  for (const key in objA) {
    if (objA.hasOwnProperty(key) && (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  for (const key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

const JsonEditor = ({ value: initialValue, onChange, ...props }) => {
  const [state, setState] = useState({
    string: JSON.stringify(initialValue, null, 2),
    value: initialValue,
    error: null,
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (!shallowEqual(initialValue, state.value)) {
      setState({
        value: initialValue,
        string: JSON.stringify(initialValue, null, 2),
        error: null,
      });
    }
  }, [initialValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    try {
      const obj = value ? JSON.parse(value) : null;
      setState({ value: obj, string: value, error: null });
      onChange(obj);
    } catch (error) {
      setState(prevState => ({ ...prevState, string: value, error }) as any);
    }
  };

  const renderErrorMessage = () => {
    if (!state.error) return null;
    const errorMessage = (state.error as string).toString();
    const message = (
      <a
        href="#!"
        onClick={() => {
          const matched = /position ([0-9]+)/.exec(errorMessage);
          const position = matched ? parseInt(matched[1], 10) : -1;
          if (inputRef.current) {
            (inputRef.current as any).textAreaRef.selectionStart = position;
            (inputRef.current as any).textAreaRef.selectionEnd = position;
            (inputRef.current as any).textAreaRef.focus();
          }
        }}
      >
        {errorMessage}
      </a>
    );
    return <Alert message={message} type="error" showIcon />;
  };

  const onClickPrettify = () => {
    if (!state.error) {
      setState(prevState => ({
        ...prevState,
        string: JSON.stringify(prevState.value, null, 2),
      }));
    }
  };

  return (
    <div>
      {renderErrorMessage() || (
        <Alert
          message={
            <a href="#!" onClick={onClickPrettify}>
              Prettify
            </a>
          }
          type="success"
          showIcon
        />
      )}
      <TextArea
        {...props}
        ref={inputRef}
        value={state.string}
        onChange={handleChange}
      />
    </div>
  );
};

export default JsonEditor;
