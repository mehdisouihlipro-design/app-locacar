import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authorizeRoles('admin'));

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/users?select=id,email,full_name,role,is_active,created_at,updated_at&order=created_at.desc');
    return res.json({ success: true, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossible de récupérer les utilisateurs.' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await global.db.get(`/users?id=eq.${id}&select=id,email,full_name,role,is_active,created_at,updated_at`);
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    return res.json({ success: true, data: result.data[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossible de récupérer l\'utilisateur.' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, role, is_active } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }
    const existing = await global.db.get(`/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id`);
    if (existing.data && existing.data.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    await global.db.post('/users', {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: full_name || null,
      role: role || 'agent',
      is_active: is_active ?? true,
    });
    return res.status(201).json({ success: true, data: { id: userId, email, full_name, role: role || 'agent', is_active: is_active ?? true } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossible de créer l\'utilisateur.' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, full_name, role, is_active } = req.body;

    const check = await global.db.get(`/users?id=eq.${id}&select=id`);
    if (!check.data || check.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const updates: Record<string, unknown> = {};
    if (email) updates.email = email.toLowerCase();
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    if (full_name !== undefined) updates.full_name = full_name;
    if (role) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée de mise à jour fournie.' });
    }

    await global.db.patch(`/users?id=eq.${id}`, updates);
    return res.json({ success: true, message: 'Utilisateur mis à jour.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossible de mettre à jour l\'utilisateur.' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const check = await global.db.get(`/users?id=eq.${id}&select=id`);
    if (!check.data || check.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    await global.db.delete(`/users?id=eq.${id}`);
    return res.json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossible de supprimer l\'utilisateur.' });
  }
});

export default router;
