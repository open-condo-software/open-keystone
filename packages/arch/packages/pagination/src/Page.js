/** @jsx jsx */
import { jsx } from '@emotion/core';
import { Button } from '@open-arch-ui/button';
import { colors } from '@open-arch-ui/theme';

const Page = props => {
  const { onClick, value, isSelected } = props;

  const handleClick = () => {
    if (onClick) {
      onClick(value);
    }
  };

  return (
    <Button
      {...props}
      variant="nuance"
      onClick={handleClick}
      css={isSelected ? { backgroundColor: colors.primary, color: 'white' } : {}}
    />
  );
};

export default Page;
