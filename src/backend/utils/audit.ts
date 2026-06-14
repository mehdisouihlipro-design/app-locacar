import { AuthRequest } from '../middleware/auth.middleware';

// Phase 1A (BR23) : piste d'audit created_by / updated_by, injectee a partir
// de l'utilisateur authentifie (req.user) sur les ecritures POST/PUT.

export function stampCreate<T extends Record<string, unknown>>(body: T, req: AuthRequest) {
  return { ...body, created_by: req.user?.id ?? null, updated_by: req.user?.id ?? null };
}

export function stampUpdate<T extends Record<string, unknown>>(body: T, req: AuthRequest) {
  return { ...body, updated_by: req.user?.id ?? null };
}
