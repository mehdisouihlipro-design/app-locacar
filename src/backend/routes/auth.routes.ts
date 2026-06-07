import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'locacar_secret_key';
const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION === 'true';

async function logAudit(userId: string | null, action: string, entity = 'auth', entityId: string | null = null, details: Record<string, unknown> | null = null) {
  try {
    const auditId = uuidv4();
    await global.db.post('/audit_logs', {
      id: auditId,
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details,
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const existing = await global.db.get(`/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id`).catch(() => ({ data: [] }));
    if (existing.data && existing.data.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est deja utilise.' });
    }

    let userCount = 0;
    try {
      const countRes = await global.db.get('/users?select=id', {
        headers: { 'Prefer': 'count=exact,head' }
      });
      userCount = parseInt(countRes.headers['content-range']?.split('/')[1] || '0');
    } catch {
      userCount = 0;
    }

    if (userCount === 0 || ALLOW_REGISTRATION) {
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const userRole = role || (userCount === 0 ? 'admin' : 'agent');
      await global.db.post('/users', {
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: full_name || null,
        role: userRole,
      });

      await logAudit(userId, 'register', 'users', userId, { email, role: userRole });
      return res.status(201).json({ success: true, message: 'Utilisateur cree avec succes.', data: { id: userId, email, full_name, role: userRole } });
    }

    return res.status(403).json({ success: false, message: 'L’inscription est désactivée. Contactez un administrateur.' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de l’inscription.' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const result = await global.db.get(`/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id,email,password_hash,full_name,role,is_active`).catch(() => ({ data: [] }));
    if (!result.data || result.data.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe invalide.' });
    }

    const user = result.data[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Compte utilisateur désactivé.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      await logAudit(user.id, 'login_failed', 'users', user.id, { email });
      return res.status(401).json({ success: false, message: 'Email ou mot de passe invalide.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    await global.db.patch(`/users?id=eq.${user.id}`, {
      last_login_at: new Date().toISOString()
    }).catch((err: any) => console.error('Failed to update last_login_at:', err.message));
    await logAudit(user.id, 'login_success', 'users', user.id, { email });

    return res.json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié.' });
    }

    const result = await global.db.get(`/users?id=eq.${req.user.id}&select=id,email,full_name,role,is_active,created_at,updated_at`).catch(() => ({ data: [] }));
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const user = result.data[0];
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération de l’utilisateur.' });
  }
});

router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Non authentifié.' });
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau requis.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
    }
    const result = await global.db.get(`/users?id=eq.${req.user.id}&select=password_hash`).catch(() => ({ data: [] }));
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    const matches = await bcrypt.compare(current_password, result.data[0].password_hash);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });
    }
    const newHash = await bcrypt.hash(new_password, 10);
    await global.db.patch(`/users?id=eq.${req.user.id}`, { password_hash: newHash });
    return res.json({ success: true, message: 'Mot de passe mis à jour.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

export default router;
