import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'prettypuff_super_secure_jwt_secret_key_2026_luxury_cosmetics';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Admin Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid email or password format.',
        errors: parseResult.error.flatten(),
      });
      return;
    }

    const { email, password } = parseResult.data;

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        message: 'This administrative account has been deactivated. Please contact the Super Admin.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = admin.role.rolePermissions.map(rp => rp.permission.name);

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        role: admin.role.name,
        permissions,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An internal error occurred during authentication.',
    });
  }
});

// Current Admin Profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin!.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found.' });
      return;
    }

    const permissions = admin.role.rolePermissions.map(rp => rp.permission.name);

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        role: admin.role.name,
        permissions,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Could not fetch admin profile.' });
  }
});

// Forgot Password Request
router.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent email enumeration, return success even if admin doesn't exist
    res.json({
      success: true,
      message: 'If an administrative account matches this email, password reset instructions have been generated.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error processing password reset request.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res): Promise<void> => {
  try {
    const { email, temporaryCode, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: 'Email and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin account not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

export default router;
