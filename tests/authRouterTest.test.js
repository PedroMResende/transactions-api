const supertest = require('supertest'); 
const app = require('../app'); 
const request = supertest(app); 
const bcrypt = require('bcrypt')

const pool = require('../database/connection'); 

const usersUrl = '/users';
const loginUrl = '/auth/login'; 


let adminId ; 
let userId ; 
let adminToken ; 
let userToken ; 

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

    const userCreated = await request.post(usersUrl)
    .send(
        {
            name: 'João das Neves', 
            email: 'joaodasneves@email.com.br', 
            password: 'joaodasneves123'
        }
    ); 

    userId = userCreated.body.id; 

}); 

describe('AUTH ROUTER TESTS', () => { 

    test('POST /auth/login (LIKE ADMIN) |SHOULD RETURNS 200| ', async() => { 

        const response = await request.post(loginUrl)
        .send(
            {
                email: 'adminteste@email.com.br', 
                password: 'adminteste123'
            }
        ); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.token).toBeDefined(); 

        adminToken = response.body.token; 
    }); 

    test('POST /auth/login (LIKE COMMON USER) |SHOULD RETURNS 200| ', async() => { 

        const response= await request.post(loginUrl)
        .send(
            {
                email: 'joaodasneves@email.com.br', 
                password: 'joaodasneves123'
            }
        ); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.token).toBeDefined(); 

        userToken = response.body.token; 
    }); 

    test('POST /auth/login ( WRONG EMAIL ) |SHOULD RETURNS 401|', async() => {

        const response = await request.post(loginUrl)
        .send(
            {
                email: 'josedasilva@email.com.br', 
                password: 'josepereira'
            }
        ); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Email ou senha inválidos'); 
    }); 

    test('POST /auth/login ( WRONG PASSWROD ) |SHOULD RETURNS 401| ', async() => { 

        const response = await request.post(loginUrl)
        .send(
            {
                email: 'joaodasneves@email.com.br', 
                password: 'wrongpassword'
            }
        ); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Email ou senha inválidos');
    });

    test('POST /auth/login ( WRONG FORMAT EMAIL ) |SHOULD RETURNS 400| ', async() => { 
        
        const response = await request.post(loginUrl)
        .send(
            {
                email: 'testeemailerrado', 
                password: 'admin123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /auth/login (WRONG FORMAT PASSWORD) |SHOULD RETURNS 400| ', async() => { 

        const response = await request.post(loginUrl)
        .send(
            {
                email: 'adminteste@email.com.br', 
                password: 'admin'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /auth/login (NO EMAIL) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(loginUrl)
        .send(
            {
                email : ' ', 
                password: 'admin123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /auth/login (NO PASSWORD) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(loginUrl)
        .send(
            {
                email: 'joaodasneves@email.com.br', 
                password: ' '
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /auth/login (NO BODY) |SHOULD RETURNS 400|', async() => { 

        const response = await request.post(loginUrl); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    })
}); 


afterAll(async() => { 
    await pool.query(
        `
        DELETE FROM users 
        WHERE email IN ('adminteste@email.com.br', 'joaodasneves@email.com.br')      
        `
    )
})