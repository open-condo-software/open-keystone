/** @jsx jsx */

import { jsx } from '@emotion/core';

import { FieldContainer, FieldLabel, FieldDescription, FieldInput } from '@open-arch-ui/fields';
import { Input } from '@open-arch-ui/input';

const TextField = ({ onChange, autoFocus, field, errors, value = '', isDisabled }) => {
  const handleChange = event => {
    onChange(event.target.value);
  };

  const { isMultiline } = field.config;
  const htmlID = `ks-input-${field.path}`;
  const canRead = errors.every(
    error => !(error instanceof Error && error.name === 'AccessDeniedError')
  );
  const error = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError');

  return (
    <FieldContainer>
      <FieldLabel htmlFor={htmlID} field={field} errors={errors} />
      <FieldDescription text={field.adminDoc} />
      <FieldInput>
        <Input
          autoComplete="off"
          autoFocus={autoFocus}
          required={field.isRequired}
          type="text"
          value={canRead ? value : undefined}
          placeholder={canRead ? undefined : error.message}
          onChange={handleChange}
          id={htmlID}
          isMultiline={isMultiline}
          disabled={isDisabled}
        />
      </FieldInput>
    </FieldContainer>
  );
};

export default TextField;
