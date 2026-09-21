import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Upload Single Image
router.post('/single', requireAuth, upload.single('image'), (req: AuthRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file was provided.' });
      return;
    }

    const folderName = path.basename(req.file.destination);
    const subPath = folderName === 'uploads' ? '' : `${folderName}/`;
    const fileUrl = `/uploads/${subPath}${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Image upload failed.' });
  }
});

// Upload Multiple Images
router.post('/multiple', requireAuth, upload.array('images', 8), (req: AuthRequest, res: Response): void => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No images provided.' });
      return;
    }

    const urls = files.map(f => {
      const folderName = path.basename(f.destination);
      const subPath = folderName === 'uploads' ? '' : `${folderName}/`;
      return `/uploads/${subPath}${f.filename}`;
    });

    res.json({
      success: true,
      message: `${files.length} images uploaded successfully.`,
      urls,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Multiple image upload failed.' });
  }
});

export default router;
