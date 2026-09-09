const pool = require('../database/connection')

async function createAccount (request, response) {
    try {

        const result = await pool.query(
            `
            INSERT INTO accounts (user_id)
            VALUES ($1)
            RETURNING *
            `,
            [request.payload.id]
        ); 

        showResult = result.rows[0]; 

        return response.status(201).json(
            {
                msg: "Conta criada com sucesso ", showResult
            }
        )
    } catch(err) {
        console.error(err); 
        return response.status(500).json(
            {
                msg: 'Erro interno na API'
            }
        )
    }
}; 

async function getAccounts (request, response) {

    try {
        if(request.payload.role === 'admin') {
    
            const resultAdmin = await pool.query(
                `
                SELECT * 
                FROM accounts
                `
            ); 
    
            return response.status(200).json(resultAdmin.rows);
        };
    
        const resultUser = await pool.query(
            `
            SELECT * 
            FROM accounts
            WHERE user_id = $1
            `, 
            [request.payload.id] 
        ); 
    
        if (resultUser.rows.length === 0 ) {
            return response.status(404).json(
                {
                    msg: 'Conta não encontrada'
                }
            )
        }; 
    
        return response.status(200).json(resultUser.rows); 

    } catch(err) {
        console.error(err); 
        return response.status(500).json(
            {
                msg: 'Erro interno na API'
            }
        )
    }
}; 

async function tryGetAccountById (request, response, next) {

    try {
        const {id} = request.params ; 
    
        const result = await pool.query(
            `
            SELECT * 
            FROM accounts 
            WHERE id = $1
            `, 
            [id]
        ); 
    
        if(result.rows.length === 0) {
            return response.status(404).json(
                {
                    msg: "Conta não encontrada"
                }
            )
        }
        if(request.payload.role === 'admin') {
            return next(); 
        };
    
    
        if(request.payload.id === result.rows[0].user_id) {
            return next(); 
        }; 
    
        return response.status(403).json(
            {
                msg: "Acesso negado, sem permissão"
            }
        )
    } catch(err) {
        console.error(err); 

        return response.status(500).json(
            {
                msg: "Erro interno na API"
            }
        )
    }
};


async function getAccountById(request, response) {
    try {
        const result = await pool.query(
            `
            SELECT * 
            FROM accounts
            WHERE id = $1
            `, 
            [request.params.id]
        )
        return response.status(200).json(result.rows[0])

    } catch(err) {
        console.error(err); 
        return response.status(500).json(
            {
                msg: "Erro interno na API"
            }
        )
    }

}

module.exports = {createAccount, getAccounts, tryGetAccountById, getAccountById}; 