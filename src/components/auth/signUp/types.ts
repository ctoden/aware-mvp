import {Observable} from "@legendapp/state";

export interface InputFieldProps {
  label: string;
  value: Observable<string> | any;
  prefix?: string;
  onChange?: (text: string) => void;
  type?: "text" | "email" | "password" | "tel";
  id?: string;
  testID?: string;
  onBlur?: () => void;
  error?: string | null;
  secureTextEntry?: boolean;
  onKeyPress?: (e: any) => void;
  textContentType?: "none" | "URL" | "addressCity" | "addressCityAndState" | "addressState" | "countryName" | "creditCardNumber" | "emailAddress" | "familyName" | "fullStreetAddress" | "givenName" | "jobTitle" | "location" | "middleName" | "name" | "namePrefix" | "nameSuffix" | "nickname" | "organizationName" | "postalCode" | "streetAddressLine1" | "streetAddressLine2" | "sublocality" | "telephoneNumber" | "username" | "password" | "newPassword" | "oneTimeCode";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  onFocus?: (e: any) => void;
}

export interface CreateAccountFormData {
  name: string;
  phoneNumber: string;
  email: string;
}
