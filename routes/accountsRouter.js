const express = require('express'); 

const router = express.Router(); 

const accountsController = require('../controllers/accountsController'); 
const {verifyToken} = require('../middlewares/authMiddleware');

router.post('/', verifyToken, accountsController.createAccount); 

router.get('/', verifyToken, accountsController.getAccounts); 
router.get('/:id', verifyToken, accountsController.tryGetAccountById, accountsController.getAccountById)

module.exports = router; 