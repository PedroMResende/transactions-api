const express = require('express'); 
const router = express.Router(); 

const {loginUserValidator} = require('../validators/userValidator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const validate = require('../middlewares/validate');

router.post('/login', validate(loginUserValidator), authController.login); 
router.post('/refresh', authMiddleware.verifyToken, authMiddleware.refreshToken);


module.exports = router; 