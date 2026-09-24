export const PASSWORD_POLICY_HINT = "Ít nhất 8 ký tự, gồm 1 chữ hoa và 1 ký tự đặc biệt";

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (new TextEncoder().encode(password).length > 72) return "Mật khẩu không được vượt quá 72 byte UTF-8";
  if (!/\p{Lu}/u.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
  if (!/[^\p{L}\p{N}]/u.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
  return null;
}
