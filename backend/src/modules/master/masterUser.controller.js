import * as masterService from './masterUser.service.js';

export async function registerDeveloperController(req, res) {
  try {
    const { token, full_name, password } = req.body;
    const user = await masterService.registerDeveloper(token, full_name, password);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function inviteDeveloperController(req, res) {
  try {
    const inviterId = req.body.inviterId;
    const email = req.body.email;
    const result = await masterService.inviteDeveloper(inviterId, email);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    const user = await masterService.loginMaster(email, password);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}
