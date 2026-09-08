const express = require('express'); 

const router = express.Router(); 
const usersController = require('../controllers/usersController');


router.post('/', usersController.createUser);

router.get('/', usersController.getUsers ); 
router.get('/:id', usersController.getUserById, usersController.showUser); 

router.put('/:id', usersController.getUserById, usersController.updateUser);

router.delete('/:id', usersController.getUserById, usersController.deleteUser); 

module.exports = router ; 