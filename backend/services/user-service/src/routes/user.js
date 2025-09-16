const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rotas de Usuários
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/clinic/:clinicId', userController.getUsersByClinic);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
