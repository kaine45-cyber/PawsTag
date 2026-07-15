// email có thể null: tài khoản Facebook không cấp email (đăng ký bằng SĐT / từ chối quyền).
export interface Owner { id: string; name: string; email: string | null; phone: string; avatar: string; city: string; }
