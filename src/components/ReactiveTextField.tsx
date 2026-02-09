import { Observable } from "@legendapp/state";
import React, { forwardRef, useEffect, useState } from "react";
import { TextInput, TextInputProps } from "react-native";

export type ReactiveTextFieldProps = TextInputProps & {
  value$: Observable<string>;
};

export const ReactiveTextField = forwardRef<TextInput, ReactiveTextFieldProps>(
  (props, ref) => {
    const { value$, onChangeText } = props;
    const typedValue$ = value$ as Observable<string>;
    const [value, setValue] = useState<string>(typedValue$.get() ?? "");

    useEffect(() => {
      const unsubscribe = typedValue$.onChange((value) => {
        setValue(value.value);
      });
      return () => unsubscribe();
    }, []);

    return (
      <TextInput
        {...props}
        ref={ref}
        value={value}
        onChangeText={(text: string) => {
          typedValue$.set(text);
          if (onChangeText && typeof onChangeText === "function") {
            onChangeText(text);
          }
        }}
      />
    );
  }
);

ReactiveTextField.displayName = "ReactiveTextField";
