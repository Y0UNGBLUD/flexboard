/**
 * 지정한 길이의 랜덤 문자열 ID를 생성한다.
 *
 * @function generateRandomId
 * @param {number} [length=16] - 생성할 문자열의 길이 (기본값 16).
 * @returns {string} 랜덤으로 생성된 ID 문자열.
 *
 * @example
 * generateRandomId()     // "a8Fs0KzQ19LmX3pT"
 * generateRandomId(8)    // "Zx4T9k1L"
 */
export function generateRandomId(length = 16): string {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

/**
 * 환경에 따라 고유 ID를 생성한다.
 *
 * Web Crypto API의 randomUUID를 사용할 수 있는 환경에서는
 * crypto.randomUUID()를 사용하고, 지원하지 않는 환경에서는
 * generateRandomId()를 사용한다.
 *
 * @function generateId
 * @returns {string} 생성된 ID 문자열.
 *
 * @example
 * generateId() // "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return generateRandomId();
}
