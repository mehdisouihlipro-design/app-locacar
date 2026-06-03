import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authorizeRoles('admin'));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.query('SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Users list error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de récupérer les utilisateurs.' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await global.db.query('SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('User get error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de récupérer l’utilisateur.' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, role, is_active } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const existing = await global.db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await global.db.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, email.toLowerCase(), passwordHash, full_name || null, role || 'agent', is_active ?? true]
    );

    return res.status(201).json({ success: true, data: { id: userId, email, full_name, role: role || 'agent', is_active: is_active ?? true } });
  } catch (error) {
    console.error('User create error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de créer l’utilisateur.' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, full_name, role, is_active } = req.body;
    const result = await global.db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (email) {
      updates.push(`email = $${index++}`);
      values.push(email.toLowerCase());
    }
    if (password) {
      updates.push(`password_hash = $${index++}`);
      values.push(await bcrypt.hash(password, 10));
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${index++}`);
      values.push(full_name);
    }
    if (role) {
      updates.push(`role = $${index++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${index++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée de mise à jour fournie.' });
    }

    values.push(id);
    await global.db.query(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index}`, values);
    return res.json({ success: true, message: 'Utilisateur mis à jour.' });
  } catch (error) {
    console.error('User update error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de mettre à jour l’utilisateur.' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await global.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    return res.json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error('User delete error:', error);
    return res.status(500).json({ success: false, message: 'Impossible de supprimer l’utilisateur.' });
  }
});

export default router;
