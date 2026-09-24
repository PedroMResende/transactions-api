const pool = require('../database/connection'); 


async function getTransactions (request, response) { 

    try {

        const foundedTransactions = await pool.query(
            `
            SELECT t.*, 
            CASE 
                WHEN t.related_account_id = a.id THEN 'in'
                WHEN t.account_id = a.id THEN 'out'
                END AS direction
            FROM transactions t 
            JOIN accounts a 
                ON a.user_id = $1
                AND (
                    a.id = t.account_id 
                    OR a.id = t.related_account_id
                )
            ORDER BY t.created_at DESC 
            `, 
            [request.payload.id]
        ); 

        return response.status(200).json(foundedTransactions.rows)
    } catch (err) {

        console.error(err); 
        return response.status(500).json(
            {
                msg: 'Erro interno na API'
            }
        )
    }

// SELECT t.* 
// FROM transactions t 
// JOIN accounts a ON a.id = t.account_id
// WHERE a.user_id = $1 
// 
// 
// 
// 
// 

}
async function deposit(request, response) {

    const client = await pool.connect();

    try {

        const { account_id, amount } = request.body;

        await client.query('BEGIN');
        const accountUpdated = await client.query(
            `
            UPDATE accounts 
            SET balance = balance + $1
            WHERE id = $2
            RETURNING balance
            `,
            [amount, account_id]
        );

        await client.query(
            `
            INSERT INTO transactions (account_id, type, amount)
            VALUES ($1, $2, $3)
            `,
            [account_id, 'deposit', amount]
        );
        
        await client.query('COMMIT');

        const resAccount = accountUpdated.rows[0];

        return response.status(201).json({
            balance: resAccount.balance
        });

    } catch(err) {

        await client.query('ROLLBACK');
        console.log(err);
        return response.status(500).json({
            msg: 'Erro interno na API'
        });
    } finally {
        
        client.release();
    }

}; 

async function withdraw( request, response ) {

    const client = await pool.connect(); 

    try {

        const {account_id, amount} = request.body; 

        await client.query('BEGIN'); 

        const accountUpdated = await client.query(
            `
            UPDATE accounts
            SET balance = balance - $1 
            WHERE id = $2
            AND balance >= $1
            RETURNING balance
            `, 
            [amount, account_id]
        ); 

        if (accountUpdated.rows.length === 0) {

            await client.query('ROLLBACK'); 

            return response.status(400).json(
                {
                    msg: 'Saldo insuficiente'
                }
            )
        }; 

    
        await client.query(
            `
            INSERT INTO transactions (account_id, type, amount)
            VALUES ($1, $2, $3)
            `, 
            [account_id, 'withdraw', amount]
        ); 

    

        await client.query('COMMIT');

        const resAccount = accountUpdated.rows[0]; 

        return response.status(201).json(
            {
                balance: resAccount.balance 
            }
        )
    } catch(err) {

        await client.query('ROLLBACK'); 

        console.log(err); 
        return response.status(500).json(
            {
                msg: 'Erro interno na API'
            }
        );
        
    } finally {

        client.release(); 
    }
}

async function transfer (request, response) { 

    const client = await pool.connect(); 

    try {

        const {account_id, related_account_id, amount} = request.body; 

        await client.query('BEGIN'); 

        const originAccountUpdated = await client.query(
            `
            UPDATE accounts 
            SET balance = balance - $1 
            WHERE id = $2 
            AND balance >= $1
            RETURNING balance
            `, 
            [amount, account_id]
        );

        if(originAccountUpdated.rows.length === 0) {

            await client.query('ROLLBACK'); 

            return response.status(400).json(
                {
                    msg: 'Saldo insuficiente'
                }
            )
        }; 

        const finalAccountUpdated = await client.query(
            `
            UPDATE accounts 
            SET balance = balance + $1
            WHERE id = $2
            RETURNING balance
            `,
            [amount, related_account_id]
        ); 

        if(finalAccountUpdated.rows.length === 0) {

            await client.query('ROLLBACK'); 

            return response.status(404).json(
                {
                    msg: 'Conta destino não encontrada'
                }
            )
        }; 

        await client.query(
            `
            INSERT INTO transactions (account_id, type, amount, related_account_id)
            VALUES ($1, $2, $3, $4)
            `, 
            [account_id, 'transfer', amount, related_account_id]
        ); 

        await client.query('COMMIT'); 

        const resOriginAccountUpdated = originAccountUpdated.rows[0]; 

        const resFinalAccountUpdated = finalAccountUpdated.rows[0];

        return response.status(201).json(
            {
                origin_balance: resOriginAccountUpdated.balance, 
                final_balance: resFinalAccountUpdated.balance
            }
        )
    } catch(err) { 

        await client.query('ROLLBACK'); 

        console.error(err); 

        return response.status(500).json(
            {
                msg: 'Erro interno na API'
            }
        )
    } finally { 

        client.release(); 
    }
}



module.exports = { 
    deposit, 
    withdraw,
    transfer, 
    getTransactions
};

