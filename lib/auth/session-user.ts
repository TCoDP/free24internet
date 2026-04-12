import { cache } from "react";
import { findUserById } from "@/lib/auth/users";

/** Один запрос к users на запрос Next (React cache), только из Node — см. `auth.ts`. */
export const getCachedUserProfile = cache((id: number) => findUserById(id));
