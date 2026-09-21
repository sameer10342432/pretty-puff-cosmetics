import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  admin?: AuthenticatedAdmin;
}

const JWT_SECRET = process.env.JWT_SECRET || 'prettypuff_super_secure_jwt_secret_key_2026_luxury_cosmetics';

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed authorization token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    // Fetch active admin with permissions
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
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

    if (!admin || !admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Admin account is either invalid or inactive.',
      });
      return;
    }

    const permissions = admin.role.rolePermissions.map(rp => rp.permission.name);

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role.name,
      permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // SUPER_ADMIN has full access to all resources
    if (req.admin.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.admin.role}' does not have sufficient clearance for this operation.`,
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permissionName: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // SUPER_ADMIN has all permissions
    if (req.admin.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    if (!req.admin.permissions.includes(permissionName)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Missing required permission: '${permissionName}'.`,
      });
      return;
    }

    next();
  };
};
