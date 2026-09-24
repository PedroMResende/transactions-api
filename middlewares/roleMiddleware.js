const pool = require('../database/connection'); 


function justAdminRoles(request, response, next) {

    if(request.payload.role === 'admin') {
        return next(); 
    }; 

    return response.status(403).json({msg: 'Acesso negado, sem permissão'})
}

function authorizedRoles(request, response, next) {

    if(request.payload.role === 'admin') {
        return next(); 
    }; 

    const {id} = request.params ; 

    if(request.payload.id !== Number(id)) {
        return response.status(403).json(
            {
                msg: "Acesso negado, sem permissão"
            }
        )
    }; 

    next(); 
};

async function checkInfos (request, response, next) { 


    const {account_id} = request.body; 
    
    const accountFounded = await pool.query(
        `
        SELECT * 
        FROM accounts
        WHERE id = $1
        `, 
        [account_id]
    ); 

    if(accountFounded.rows.length === 0) {
        return response.status(404).json({msg: 'Conta não encontrada'})
    };

    const account = accountFounded.rows[0]; 

    if(account.user_id !== request.payload.id) {
        return response.status(403).json(
            {
                msg: 'Acesso negado, sem permissão'
            }
        )
    }

    return next(); 
}




module.exports = {authorizedRoles, justAdminRoles, checkInfos}