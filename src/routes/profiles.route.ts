import { Router } from 'express';
import {
  createProfileController,
  deleteProfileController,
  getAllProfilesController,
  getSingleProfileController,
} from '../controllers/profiles.controller.js';
import { validateCreateProfile } from '../middleware/validate.middleware.js';

export const profilesRouter = Router();

profilesRouter.post('/', validateCreateProfile, createProfileController);
profilesRouter.get('/', getAllProfilesController);
profilesRouter.get('/:id', getSingleProfileController);
profilesRouter.delete('/:id', deleteProfileController);
