export const PASSWORD_REQUIREMENTS_TEXT = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.";

export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSymbol;
}