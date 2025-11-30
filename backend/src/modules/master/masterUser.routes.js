import express from 'express';
import { registerDeveloperController, inviteDeveloperController, loginController } from './masterUser.controller.js';

const router = express.Router();

// Login
router.post('/login', loginController);

// Developer davet et
router.post('/invite', inviteDeveloperController);

// Developer kayıt ol
router.post('/developer/register', registerDeveloperController);

export default router;
