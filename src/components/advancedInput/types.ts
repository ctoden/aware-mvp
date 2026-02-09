export interface AdvancedInputProps {
    label: string;
    errorMessage?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
    autoFocus?: boolean;
    testID?: string;
}

export interface StyleProps {
    hasError: boolean;
    disabled: boolean;
}