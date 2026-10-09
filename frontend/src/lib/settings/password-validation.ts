/** Password form validation shared by the settings and admin-reset forms. */

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordFormErrors = Partial<Record<keyof PasswordFormValues, string>>;

/**
 * Validate a password change form. Returns field-level errors (empty object
 * when valid). The backend enforces the same rules — this is UX feedback,
 * not a security boundary.
 */
export function validatePasswordForm(values: PasswordFormValues): PasswordFormErrors {
  const errors: PasswordFormErrors = {};

  if (values.currentPassword.length === 0) {
    errors.currentPassword = "请输入当前密码";
  }
  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `新密码至少 ${MIN_PASSWORD_LENGTH} 位`;
  }
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "两次输入的新密码不一致";
  }

  return errors;
}

export function isValidPasswordForm(errors: PasswordFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
