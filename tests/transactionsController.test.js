const supertest = require('supertest'); 
const app = require('../app'); 
const request = supertest(app); 

const bcrypt = require('bcrypt'); 
const pool = require('../database/connection');
const { transfer } = require('../controllers/transactionsController');


const usersUrl = '/users';
const loginUrl = '/auth/login';
const accountsUrl = '/accounts';
const depositUrl = '/transactions/deposit';
const withdrawUrl = '/transactions/withdraw'; 
const transferUrl = '/transactions/transfer'; 

let adminToken; 
let userToken ; 
let anotherUserToken;

let adminId ; 
let userId ; 
let anotherUserId ; 

let userAccountId ; 
let anotherUserAccountId ; 
let adminAccountId ; 


beforeAll(async() => { 

    const hashedAdminPassword = await bcrypt.hash('adminteste123', 10); 

    const adminCreated = await pool.query(
        `
        INSERT INTO users (name, email, password, role) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
        `, 
        ['Admin Teste', 'adminteste@email.com.br', hashedAdminPassword, 'admin']
    ); 

    adminId = adminCreated.rows[0].id; 

    const resAdminCreated = await request.post(loginUrl)
    .send(
        {
            email: 'adminteste@email.com.br', 
            password: 'adminteste123'
        }
    ); 

    adminToken = resAdminCreated.body.token; 

    const resAdminAccountCreated = await request.post(accountsUrl)
    .set('Authorization', `Bearer ${adminToken}`);

    adminAccountId = resAdminAccountCreated.body.showResult.id; 


    const userCreated = await request.post(usersUrl)
    .send(
        {
            name: 'João das Neves ', 
            email: 'joaodasneves@email.com.br', 
            password: 'joaodasneves123'
        }
    ); 

    userId = userCreated.body.id; 

    
    const resUserCreated = await request.post(loginUrl)
    .send(
        {
            email: 'joaodasneves@email.com.br', 
            password: 'joaodasneves123'
        }
    ); 

    userToken = resUserCreated.body.token; 

    const resUserAccountCreated = await request.post(accountsUrl)
    .set('Authorization', ` Bearer ${userToken}` ); 

    userAccountId = resUserAccountCreated.body.showResult.id; 


    const anotherUserCreated = await request.post(usersUrl) 
    .send(
        {
            name: 'Valentim Terra', 
            email: 'valentimterra@email.com.br', 
            password: 'valentim123'
        }
    ); 

    anotherUserId = anotherUserCreated.body.id; 

    const resAnotherUserCreated = await request.post(loginUrl)
    .send(
        {
            email: 'valentimterra@email.com.br', 
            password: 'valentim123'
        }
    ); 

    anotherUserToken = resAnotherUserCreated.body.token; 

    
    const resAnotherUserAccountCreated = await request.post(accountsUrl)
    .set('Authorization', `Bearer ${anotherUserToken}`); 

    anotherUserAccountId = resAnotherUserAccountCreated.body.showResult.id; 

}); 

describe('TRANSACTIONS ROUTE TESTS', () => {


    // DEPOSIT ROUTE --------------------------------------------------------------------------------------------------------------------
    test('POST/transactions/deposit (NO TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(depositUrl); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.msg).toBe('Não autorizado'); 
    }); 

    test('POST /transactions/deposit (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', 'Bearer 123456789'); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.msg).toBe('Token inválido'); 
    }); 

    test('POST /transactions/deposit (FALSE TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Basic ${userToken}`);

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    });


    test('POST /transactions/deposit (INEXISTENT ACCOUNT) |SHOULD RETURNS 404|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
            {
                account_id: 1234589, 
                amount: 400
            }
        ); 

        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.msg).toBe('Conta não encontrada'); 
    });

    test('POST /transactions/deposit (DENIED ACCESS) |SHOULD RETURNS 403|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: anotherUserAccountId, 
                amount: 500 
            }
        ); 

        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Acesso negado, sem permissão'); 
    });

    test('POST /transactions/deposit (NEGATIVE AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount : -500
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos')
    }); 

    test('POST /transactions/deposit (0 AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: 0
            }
        ); 


        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 


    test('POST /transactions/deposit (NO AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
        
            }
        ); 


        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    
    test('POST /transactions/deposit (NO AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                amount: 500
        
            }
        ); 


        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    
    test('POST /transactions/deposit (INVALID TYPE ACCOUNT_ID) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: 'abd', 
                amount: 500
        
            }
        ); 


        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    
    
    test('POST /transactions/deposit (INVALID AMOUNT TYPE) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: '500'
            }
        ); 
        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /transactions/deposit (SUCCESS) |SHOULD RETURNS 201|', async() => { 

        const response = await request.post(depositUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: 500 
            }
        ); 
        expect(response.status).toBe(201); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.balance).toBe("500.00"); 
    }); 

    test('GET /accounts/:id |SHOULD RETURNS 200|', async() => { 

        const response = await request.get(`/accounts/${userAccountId}`)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.id).toBeDefined(); 
        expect(response.body.user_id).toBe(userId); 
        expect(response.body.balance).toBe("500.00");
    });

    // WITHDRAW ROUTE --------------------------------------------------------------------------------------------------------------------


    




    test('POST /withdraw (NO TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(withdrawUrl); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Não autorizado');
    }); 

    test('POST /withdraw (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization', `Bearer 123456789`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Token inválido'); 
    });

    test('POST /withdraw (INVALID TYPE TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization', `Basic ${userToken}`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    }); 

    test('POST /withdraw (INEXISTENT ACCOUNT) |SHOULD RETURNS 404|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id:99999, 
                amount: 300
            }
        );

        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Conta não encontrada')
    }); 

    test('POST /withdraw (ANOTHER COUNT) |SHOULD RETURNS 403', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: anotherUserAccountId, 
                amount: 300
            }
        );
        
        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Acesso negado, sem permissão');
    });

    test('POST /withdraw (NEGATIVE AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: -200
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (ZERO AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: 0
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (NO AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (NO ACCOUNT_ID) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                amount: 300
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (INVALID ACCOUNT_ID) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: 'abc',
                amount: 300
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (INVALID AMOUNT) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId,
                amount: '400'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 
    
    test('POST /withdraw (INSUFICIENT BALANCE) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization',`Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId,
                amount: 600
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Saldo insuficiente'); 
    }); 

    test ('POST /withdraw |SHOULD RETURN 201|', async() => { 

        const response = await request.post(withdrawUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: 300
            }
        ); 

        expect(response.status).toBe(201); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.balance).toBe('200.00'); 
    }); 

    test('GET /accounts/:id |SHOULD RETURNS 200|', async() => { 

        const response = await request.get(`/accounts/${userAccountId}`)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.id).toBeDefined(); 
        expect(response.body.user_id).toBe(userId); 
        expect(response.body.balance).toBe("200.00");
    });

    test('GET /transactions (CHECK WITHDRAW TRANSACTION) |SHOULD RETURNS 200|', async() => {

    const response = await request.get('/transactions')
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);

        expect(response.body[0].account_id).toBe(userAccountId);
        expect(response.body[0].type).toBe('withdraw');
        expect(response.body[0].amount).toBe('300.00');
    });

    test('GET /transactions (CHECK TRANSACTION HISTORY) |SHOULD RETURNS 200|', async() => {

        const response = await request.get('/transactions')
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);

        expect(response.body.length).toBe(2);

        expect(response.body[0].type).toBe('withdraw');
        expect(response.body[0].account_id).toBe(userAccountId);
        expect(response.body[0].amount).toBe('300.00');

        expect(response.body[1].type).toBe('deposit');
        expect(response.body[1].account_id).toBe(userAccountId);
        expect(response.body[1].amount).toBe('500.00');
    });

    // TRANSFER ROUTE ------------------------------------------------------------------------------------------------------------------






    test('POST /transfer (NO TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(transferUrl)

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Não autorizado')
    }); 

    test('POST /transfer (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.post(transferUrl)
        .set('Authorization', 'Bearer 123456789'); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Token inválido'); 
    }); 

    test('POST /transfer (INVALID TYPE TOKEN) |SHOULD RETURNS 401|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Basic ${userToken}`)

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    }); 

    test('POST /transfer (NO account_id) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                related_account_id: anotherUserAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (NO related_account_id) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (NO amount) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (account_id -> format string) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: '10', 
                related_account_id: anotherUserAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (related_account_id -> format string) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: '10', 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (amount -> format string) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId, 
                amount: '100'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (account_id = 0 ) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: 0, 
                related_account_id: anotherUserAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (related_account_id zero) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: 0, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (amount zero) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId, 
                amount: 0
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (account_id < 0) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: -20, 
                related_account_id: anotherUserAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 

    test('POST /transfer (related_account_id < 0) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: -20, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 
    
    test('POST /transfer (amount < 0) |SHOULD RETURNS 400|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId, 
                amount: -20
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 

    test('POST /transfer (origin account inexistent) |SHOULD RETURNS 404|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: 99999, 
                related_account_id: anotherUserAccountId, 
                amount: 100
            }
        ); 

        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Conta não encontrada'); 
    }); 

    test('POST /transfer (another user account) |SHOULD RETURNS 403|', async() => { 

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: adminAccountId, 
                related_account_id: anotherUserAccountId,
                amount: 100
            }
        ); 

        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Acesso negado, sem permissão'); 
    }); 

    test('POST /transfer (inexistent final account) |SHOULD RETURNS 404|', async() => { 

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: 9999, 
                amount: 100
            }
        ); 
        
        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Conta destino não encontrada')
    }); 

    test('POST /transfer (insuficient balance) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId,
                amount:1000
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Saldo insuficiente'); 
    }); 

    test('POST /transfer (SUCESS) |SHOULD RETURNS 201|', async() => {

        const response = await request.post(transferUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                account_id: userAccountId, 
                related_account_id: anotherUserAccountId,
                amount : 100
            }
        ); 

        expect(response.status).toBe(201); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.origin_balance).toBe('100.00'); 
        expect(response.body.final_balance).toBe('100.00');
    }); 

    test('GET /transactions (sender) | SHOULD RETURN TRANSFER AS OUT', async() => {

        const response = await request.get('/transactions')
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body[0].type).toBe('transfer');
        expect(response.body[0].account_id).toBe(userAccountId);
        expect(response.body[0].related_account_id).toBe(anotherUserAccountId);
        expect(response.body[0].amount).toBe('100.00');
        expect(response.body[0].direction).toBe('out');
    });

    test('GET /transactions (receiver) | SHOULD RETURN TRANSFER AS IN', async() => {

        const response = await request.get('/transactions')
        .set('Authorization', `Bearer ${anotherUserToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body[0].type).toBe('transfer');
        expect(response.body[0].account_id).toBe(userAccountId);
        expect(response.body[0].related_account_id).toBe(anotherUserAccountId);
        expect(response.body[0].amount).toBe('100.00');
        expect(response.body[0].direction).toBe('in');
    });

    test('GET /transactions (transfer) | SHOULD RETURN CORRECT TRANSACTION DATA', async() => {

        const response = await request.get('/transactions')
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        const transferTransaction = response.body.find(
            transaction => transaction.type === 'transfer'
        );

        expect(transferTransaction).toBeDefined();
        expect(transferTransaction.account_id).toBe(userAccountId);
        expect(transferTransaction.related_account_id).toBe(anotherUserAccountId);
        expect(transferTransaction.amount).toBe('100.00');
    });



}); 

afterAll(async() => {

    await pool.query(

        `

        DELETE FROM transactions

        WHERE account_id IN (

            SELECT id

            FROM accounts

            WHERE user_id IN ($1, $2, $3)

        )

        `,

        [adminId, userId, anotherUserId]

    );

    await pool.query(

        `

        DELETE FROM accounts

        WHERE user_id IN ($1, $2, $3)

        `,

        [adminId, userId, anotherUserId]

    );

    await pool.query(

        `

        DELETE FROM users

        WHERE id IN ($1, $2, $3)

        `,

        [adminId, userId, anotherUserId]

    );

});