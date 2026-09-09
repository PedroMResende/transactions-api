const bcrypt = require('bcrypt');

const pool = require('../database/connection');



async function getUsers(request,response) {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users'); 

        return response.status(200).json(result.rows);
    } catch (err) {
        console.error(err); 

        return response.status(500).json({msg: 'Erro interno na API' })
    }
}

async function createUser(request, response) {
    try {
        const {name, email, password} = request.body; 
    
        const hashedPassword = await bcrypt.hash(password, 10); 
    
        const userCreated = await pool.query(
            `
            INSERT INTO users(name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at
            `,
            [name, email, hashedPassword]
        )

        return response.status(201).json(userCreated.rows[0]);
    } catch (err) {
        console.error(err); 

        return response.status(500).json({msg: 'Erro interno na API'});
    }
}

async function getUserById(request, response, next) {
    try {
        const {id} = request.params ; 

        const userFounded = await pool.query(
            `
            SELECT id, name, email, role, created_at 
            FROM users
            WHERE id = $1
            `, 
            [id]
        );

        if(userFounded.rows.length === 0) return response.status(404).json({msg: 'Usuário não encontrado'});

        request.user = userFounded.rows[0];
        
        next();

    } catch (err) {
        console.error(err) ; 
        return response.status(500).json({msg: "Erro interno na API"})
        
    }
};

function showUser(request, response) { 
        response.status(200).json(request.user);
}; 

async function updateUser(request, response) {
    try {
        
        
        const {newName, newEmail, newPassword} = request.body; 

        const newHashedPassword = await bcrypt.hash(newPassword, 10); 

        const updatedUser = await pool.query(
            `
            UPDATE users
            SET 
                name = $1, 
                email = $2, 
                password = $3
            WHERE id = $4
            RETURNING id, name, email
            `,
            [newName, newEmail, newHashedPassword, request.user.id]
        )

        return response.status(200).json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err); 
        return response.status(500).json({msg: 'Erro interno na API'})
    }
}; 

async function deleteUser(request, response) {
    try {
        await pool.query(
            `
            DELETE 
            FROM users 
            WHERE id = $1
            `, 
            [request.user.id]
        ); 

        return response.status(204).end()
    } catch (err) {
        console.error(err); 

        return response.status(500).json({msg: 'Erro interno na API'})
    }
    
}




module.exports = {getUsers, createUser, getUserById,showUser, updateUser, deleteUser}