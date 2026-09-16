const supertest = require('supertest'); 
const app = require('../app'); 
const request = supertest(app); 
const bcrypt = require('bcrypt'); 

const pool = require('../database/connection');



let adminId; 
let userId; 
let anotherUserId; 

let adminToken ; 
let userToken ; 
let anotherUserToken ;

let userAccountId;
let adminAccountId;


const usersUrl = '/users'; 
const accountsUrl = '/accounts'; 
const loginUrl = '/auth/login';




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

}); 

describe('ACCOUNTS ROUTE TEST', () => { 

        test('POST /accounts (NO TOKEN) |SHOULD RETURNS 401|', async() => { 

            const response = await request.post(accountsUrl); 

            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.msg).toBe('Não autorizado');
        }); 

        test('POST /accounts (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

            const response = await request.post(accountsUrl)
            .set('Authorization', 'Bearer 123456789')

            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.msg).toBe('Token inválido');
        });

        test('POST /accounts (FALSE TOKEN) |SHOULD RETURNS 401|', async() => { 

            const response = await request.post(accountsUrl)
            .set('Authorization', `Basic ${userToken}`); 

            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.msg).toBe('Tipo de token inválido');
        }); 

        test('POST /accounts (USER SUCCESS) |SHOULD RETURNS 201|', async() => { 

            const response = await request.post(accountsUrl)
            .set('Authorization', `Bearer ${userToken}`); 

            expect(response.status).toBe(201); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.showResult.id).toBeDefined(); 
            expect(response.body.showResult.balance).toBe("0.00");

            userAccountId = response.body.showResult.id; 
        });


        test('POST /accounts (ADMIN SUCCESS) |SOULD RETURNS 201|', async() => { 

            const response = await request.post(accountsUrl)
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(201); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.showResult.id).toBeDefined(); 
            expect(response.body.showResult.balance).toBe("0.00");

            adminAccountId = response.body.showResult.id; 
        }); 

        test('GET /accounts (NO TOKEN) |SHOULD RETURNS 401|', async() => { 
            
            const response = await request.get(accountsUrl)
            
            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.msg).toBe('Não autorizado');
        }); 

        test('GET /accounts (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

            const response = await request.get(accountsUrl)
            .set('Authorization', 'Bearer 123456789'); 

            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Token inválido');
        }); 

        test('GET /accounts (BASIC TOKEN) |SHOULD RETURNS 401|', async() => { 

            const response = await request.get(accountsUrl)
            .set('Authorization', `Basic ${adminToken}`); 

            expect(response.status).toBe(401); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body.msg).toBe('Tipo de token inválido');
        }); 

        test('GET /accounts (USER GET YOUR ACCOUNT) |SHOULD RETURNS 200|', async() => { 

            const response = await request.get(accountsUrl)
            .set('Authorization', `Bearer ${userToken}`); 

            expect(response.status).toBe(200); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(response.body[0].id).toBeDefined(); 
            expect(response.body[0].user_id).toBe(userId); 
            expect(response.body[0].balance).toBe('0.00');
        }); 

        test('GET /accounts (ADMIN CONSULT ACCOUNTS |SHOULD RETURNS 200|', async() => { 

            const response = await request.get(accountsUrl)
            .set('Authorization', `Bearer ${adminToken}`); 

            expect(response.status).toBe(200); 
            expect(response.headers['content-type']).toMatch(/json/); 
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].id).toBeDefined(); 
        }); 

        test('GET /accounts (INEXISTENT ACCOUNT |SHOULD RETURNS 404|', async() => { 

            const response = await request.get(accountsUrl)
            .set('Authorization', `Bearer ${anotherUserToken}`);

            expect(response.status).toBe(404);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Conta não encontrada');
        }); 

        test('GET /accounts/:id (NO TOKEN) |SHOULD RETURNS 401|', async() => {

            const response = await request.get(`${accountsUrl}/${userAccountId}`);

            expect(response.status).toBe(401);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Não autorizado');
        });

        test('GET /accounts/:id (INVALID TOKEN) |SHOULD RETURNS 401|', async() => {

            const response = await request.get(`${accountsUrl}/${userAccountId}`)
            .set('Authorization', 'Bearer 123456789');

            expect(response.status).toBe(401);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Token inválido');
        });

        test('GET /accounts/:id (BASIC TOKEN) |SHOULD RETURNS 401|', async() => {

            const response = await request.get(`${accountsUrl}/${userAccountId}`)
            .set('Authorization', `Basic ${userToken}`);

            expect(response.status).toBe(401);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Tipo de token inválido');
        });

        test('GET /accounts/:id (USER GET YOUR ACCOUNT) |SHOULD RETURNS 200|', async() => {

            const response = await request.get(`${accountsUrl}/${userAccountId}`)
            .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.id).toBe(userAccountId);
            expect(response.body.user_id).toBe(userId);
            expect(response.body.balance).toBe('0.00');
        });

        test('GET /accounts/:id (USER GET ANOTHER USER ACCOUNT) |SHOULD RETURNS 403|', async() => {

            const response = await request.get(`${accountsUrl}/${adminAccountId}`)
            .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Acesso negado, sem permissão');
        });

        test('GET /accounts/:id (ADMIN GET ANOTHER USER ACCOUNT) |SHOULD RETURNS 200|', async() => {

            const response = await request.get(`${accountsUrl}/${userAccountId}`)
            .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.id).toBe(userAccountId);
            expect(response.body.user_id).toBe(userId);
            expect(response.body.balance).toBe('0.00');
        });

        test('GET /accounts/:id (INEXISTENT ACCOUNT) |SHOULD RETURNS 404|', async() => {

            const response = await request.get(`${accountsUrl}/99999`)
            .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(404);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body.msg).toBe('Conta não encontrada');
        });

})


afterAll(async() => {

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
    )
});