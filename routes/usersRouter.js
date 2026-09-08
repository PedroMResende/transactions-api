const express = require('express'); 

const router = express.Router(); 
const usersController = require('../controllers/usersController');

const validate = require('../middlewares/validate');
const {verifyToken} = require('../middlewares/authMiddleware'); 
const {authorizedRoles, justAdminRoles} = require('../middlewares/roleMiddleware'); 

const {createUserSchema, updateUserSchema} = require('../validators/userValidator'); 


router.post('/', validate(createUserSchema), usersController.createUser);

router.get('/', verifyToken, justAdminRoles, usersController.getUsers ); 
router.get('/:id', verifyToken, authorizedRoles, usersController.getUserById, usersController.showUser); 

router.put('/:id', verifyToken, authorizedRoles, usersController.getUserById, validate(updateUserSchema), usersController.updateUser);

router.delete('/:id', verifyToken, authorizedRoles, usersController.getUserById, usersController.deleteUser); 

module.exports = router ; 