const express = require('express'); 

const router = express.Router(); 
const usersController = require('../controllers/usersController');

const validate = require('../middlewares/validate');

const {createUserSchema, updateUserSchema} = require('../validators/userValidator'); 


router.post('/', validate(createUserSchema), usersController.createUser);

router.get('/', usersController.getUsers ); 
router.get('/:id', usersController.getUserById, usersController.showUser); 

router.put('/:id', usersController.getUserById, validate(updateUserSchema), usersController.updateUser);

router.delete('/:id', usersController.getUserById, usersController.deleteUser); 

module.exports = router ; 