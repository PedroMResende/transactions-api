const bcrypt = require('bcrypt'); 
const pool = require('../database/connection');

const authMiddleware = require('../middlewares/authMiddleware'); 


async function login(request, response) {

    const {email, password} = request.body; 

    const result = await pool.query(
        `
        SELECT id, name, email, password, role
        FROM users 
        WHERE email = $1
        `, 
        [email]
    ); 

    if(result.rows.length === 0) {
        return response.status(401).json({msg: 'Email ou senha inválidos'})
    };

    const user = result.rows[0]; 

    const passwordMatch = await bcrypt.compare(
        password, 
        user.password
    ); 

    if(!passwordMatch) {
        return response.status(401).json({msg: 'Email ou senha inválidos'}); 
    };

    const payload = {
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role
    };

    const token = authMiddleware.generateToken(payload); 

    return response.status(200).json({token: `${token}`});
}


module.exports = {login}