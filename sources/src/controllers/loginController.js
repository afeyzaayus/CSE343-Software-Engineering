const loginService = require('../services/loginService');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await loginService.validateLogin(email, password);
    res.status(200).json({ message: 'Giriş başarılı!', user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = {
  login,
};