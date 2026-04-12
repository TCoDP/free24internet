export type SessionUser = {
  id: number;
  /** Пустая строка, если вход только через Telegram без привязанного email. */
  email: string;
  name: string | null;
  tgUsername?: string | null;
  isAdmin?: boolean;
};

export type UserRow = {
  id: number;
  /** null — Telegram ещё не привязан к профилю (вход по email). */
  tg_id: number | null;
  email: string | null;
  password_hash: string | null;
  name: string | null;
  tg_username: string | null;
  /** ru | en — колонка может отсутствовать до миграции 004 */
  language: string | null;
  created_at: Date;
  /** После миграции 007 */
  referral_code: string | null;
  referred_by_user_id: number | null;
  subscription_until: Date | null;
  trial_ends_at: Date | null;
  /** 1 — разрешена оплата на сайте через Moneta / PayAnyWay (после миграции 009) */
  is_their: number | boolean;
  /** 1 — доступ в /admin (после миграции 010). Пользователь id=20 всегда считается админом в коде. */
  is_admin: number | boolean;
};
