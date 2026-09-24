const express = require('express'); 
const router = express.Router(); 

const transactionsController = require('../controllers/transactionsController');

const validate = require('../middlewares/validate');
const {verifyToken} = require('../middlewares/authMiddleware');
const {depositSchema, withdrawSchema, transferSchema} = require('../validators/transactionValidator'); 
const {checkInfos} = require('../middlewares/roleMiddleware')


router.get('/', verifyToken, transactionsController.getTransactions); 
router.post('/deposit', verifyToken,    validate(depositSchema) , checkInfos, transactionsController.deposit);  
router.post('/withdraw', verifyToken, validate(withdrawSchema), checkInfos, transactionsController.withdraw); 
router.post('/transfer', verifyToken, validate(transferSchema), checkInfos, transactionsController.transfer)







module.exports = router