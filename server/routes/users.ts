import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Super Admin Only: List staff users
router.get('/', requireAuth, requireRole(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// List roles & permissions
router.get('/roles', requireAuth, requireRole(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    const permissions = await prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });

    res.json({
      success: true,
      data: {
        roles: roles.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.rolePermissions.map(rp => rp.permission.name),
        })),
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles.' });
  }
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string(),
  isActive: z.boolean().default(true),
});

// Create Staff User
router.post('/', requireAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createUserSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: `User with email "${email}" already exists.` });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const admin = await prisma.admin.create({
      data: {
        name: validated.name.trim(),
        email,
        passwordHash,
        roleId: validated.roleId,
        isActive: validated.isActive,
      },
      include: { role: true },
    });

    res.status(201).json({
      success: true,
      message: `Staff user "${admin.name}" created successfully.`,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role.name,
        isActive: admin.isActive,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create user.' });
  }
});

// Update Staff User
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.roleId) updateData.roleId = body.roleId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(body.password, salt);
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    res.json({
      success: true,
      message: 'Staff user updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.name,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// Delete Staff User
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === req.admin!.id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own administrative account.' });
      return;
    }

    await prisma.admin.delete({ where: { id } });
    res.json({ success: true, message: 'Staff user removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

export default router;
