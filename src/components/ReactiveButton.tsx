import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import { Button, ButtonProps } from 'react-native-ui-lib';
import { Observable } from '@legendapp/state';

export type ReactiveButtonProps = ButtonProps & {
  isDisabled$?: Observable<boolean>;
}

export const ReactiveButton = forwardRef<typeof Button, ReactiveButtonProps>((props, ref) => {
  const { isDisabled$, disabled, onPress, ...rest } = props;
  const typedIsDisabled$ = isDisabled$ as Observable<boolean>;
  const [isDisabled, setIsDisabled] = useState<boolean>(typedIsDisabled$?.get() ?? Boolean(disabled));

  useEffect(() => {
    if (isDisabled$) {
      const unsubscribe = typedIsDisabled$.onChange((value) => {
        setIsDisabled(value.value);
      });
      return () => unsubscribe();
    }
  }, [isDisabled$]);

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      if(onPress && typeof onPress === 'function') {
        onPress!(props);
      }
    }
  }, [props, isDisabled]);

  return (
      <Button
          {...rest}
          ref={ref}
          disabled={isDisabled}
          onPress={handlePress}
      />
  );
});

ReactiveButton.displayName = 'ReactiveButton';