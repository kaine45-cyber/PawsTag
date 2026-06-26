export const validators = {
  email:    (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone:    (v: string) => /^(\+84|0)[3-9]\d{8}$/.test(v.replace(/\s/g, "")),
  password: (v: string) => v.length >= 8,
  required: (v: string) => v.trim().length > 0,
};
