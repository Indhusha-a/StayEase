  const {
    registerUser,
    loginUser,
    checkEmailAvailability,
  } = require('./UserService');

  const register = async (req, res) => {
    try {
      const result = await registerUser(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  const login = async (req, res) => {
    try {
      const result = await loginUser(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  const getMe = (req, res) => res.status(200).json(req.user);

  const checkEmail = async (req, res) => {
    try {
      const result = await checkEmailAvailability(req.query.email);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  module.exports = { register, login, getMe, checkEmail };
