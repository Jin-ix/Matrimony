import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { updateProfileSchema, updatePreferencesSchema } from '../validators/profile.validators.js';
import { uploadPhoto } from '../middleware/upload.middleware.js';

const router = Router();

// All profile routes require auth
router.use(authMiddleware);

router.get('/me', profileController.getMyProfile);
router.put('/me', validate(updateProfileSchema), profileController.updateMyProfile);
router.get('/preferences', profileController.getPreferences);
router.put('/preferences', validate(updatePreferencesSchema), profileController.updatePreferences);
router.post('/photos', uploadPhoto.single('photo'), profileController.uploadPhoto);
router.delete('/photos/:photoId', profileController.deletePhoto);
router.put('/photos/:photoId/primary', profileController.setPrimaryPhoto);
router.put('/ghost-mode', profileController.toggleGhostMode);
router.get('/:userId', profileController.getPublicProfile);

export default router;
