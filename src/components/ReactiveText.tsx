import React, { forwardRef, useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native-ui-lib';
import { Observable } from '@legendapp/state';

export type ReactiveTextProps = TextProps & {
  text$: Observable<string | null>;
}

export const ReactiveText = forwardRef<Text, ReactiveTextProps>((props, ref) => {
  const { text$, children, ...rest } = props;
  const typedText$ = text$ as Observable<string | null>;
  const [text, setText] = useState<string>(typedText$.get() ?? String(children ?? ''));

  useEffect(() => {
    if (text$) {
      const unsubscribe = typedText$.onChange((value) => {
        setText(value.value ?? '');
      });
      return () => unsubscribe();
    }
  }, [text$]);

  return (
    <Text {...rest} ref={ref}>
      {text}
    </Text>
  );
});

ReactiveText.displayName = 'ReactiveText';