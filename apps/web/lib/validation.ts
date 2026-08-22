export type ValidationErrorKey =
  | "auth.error.invalidEmail"
  | "auth.error.passwordShort"
  | "auth.error.passwordMismatch"
  | "auth.error.required";

export type ValidationField = "name" | "email" | "password" | "confirm";

export type ValidationResult = {
  valid: boolean;
  errors: Partial<Record<ValidationField, ValidationErrorKey>>;
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;

export type SignInValues = {
  email: string;
  password: string;
};

export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function validateEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function validatePassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

function emptyResult(): ValidationResult {
  return { valid: true, errors: {} };
}

export function validateSignIn(values: SignInValues): ValidationResult {
  const errors: Partial<Record<ValidationField, ValidationErrorKey>> = {};

  if (!validateEmail(values.email)) {
    errors.email = "auth.error.invalidEmail";
  }

  if (values.password.length === 0) {
    errors.password = "auth.error.required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignUp(values: SignUpValues): ValidationResult {
  const errors: Partial<Record<ValidationField, ValidationErrorKey>> = {};

  if (values.name.trim().length === 0) {
    errors.name = "auth.error.required";
  }

  if (!validateEmail(values.email)) {
    errors.email = "auth.error.invalidEmail";
  }

  if (!validatePassword(values.password)) {
    errors.password = "auth.error.passwordShort";
  }

  if (values.confirmPassword.length === 0) {
    errors.confirm = "auth.error.required";
  } else if (values.password !== values.confirmPassword) {
    errors.confirm = "auth.error.passwordMismatch";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEmailOnly(email: string): ValidationResult {
  if (!validateEmail(email)) {
    return {
      valid: false,
      errors: { email: "auth.error.invalidEmail" },
    };
  }
  return emptyResult();
}
