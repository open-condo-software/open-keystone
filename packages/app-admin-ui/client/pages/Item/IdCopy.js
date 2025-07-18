/** @jsx jsx */
import { jsx } from '@emotion/core';
import { useCallback, memo, useState, useEffect } from 'react';

import copyToClipboard from 'clipboard-copy';
import Animation from '../../components/Animation';
import { CheckIcon, ClippyIcon } from '@primer/octicons-react';
import { FlexGroup } from '@open-arch-ui/layout';
import { A11yText } from '@open-arch-ui/typography';
import { colors } from '@open-arch-ui/theme';
import { Button } from '@open-arch-ui/button';
import Tooltip from '@open-arch-ui/tooltip';

let CopyIcon = memo(function CopyIcon({ isCopied }) {
  return isCopied ? (
    <Animation name="pulse" duration="500ms">
      <CheckIcon css={{ color: colors.create }} />
    </Animation>
  ) : (
    <ClippyIcon />
  );
});

export let IdCopy = memo(function IdCopy({ id }) {
  let [isCopied, setIsCopied] = useState(false);
  const onSuccess = useCallback(() => {
    setIsCopied(true);
  }, []);

  useEffect(() => {
    if (isCopied) {
      let timeoutID = setTimeout(() => {
        setIsCopied(false);
      }, 500);
      return () => {
        clearTimeout(timeoutID);
      };
    }
  }, [isCopied, setIsCopied]);

  return (
    <FlexGroup align="center" isContiguous isInline>
      <div
        css={{
          color: colors.N30,
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '0.85em',
        }}
      >
        ID: {id}
      </div>
      <Tooltip content="Copy ID" hideOnMouseDown hideOnKeyDown>
        {ref => (
          <Button
            ref={ref}
            onClick={() => {
              copyToClipboard(id).then(onSuccess);
            }}
            variant="subtle"
          >
            <div css={{ width: 16 }}>
              <CopyIcon isCopied={isCopied} />
            </div>
            <A11yText>Copy ID</A11yText>
          </Button>
        )}
      </Tooltip>
    </FlexGroup>
  );
});
