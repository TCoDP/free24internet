export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
};

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
};
