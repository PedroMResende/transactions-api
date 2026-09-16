const supertest = require('supertest'); 
const app = require('../app'); 
const request = supertest(app); 
const bcrypt = require('bcrypt');

const pool = require('../database/connection');

let adminToken; 
let userToken; 

let adminId; 
let userId; 
let deleteUserId;
let deleteUserToken;

const loginUrl = '/auth/login'; 
const usersUrl = '/users'; 

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

    adminId = adminCreated.rows[0].id ; 
    console.log('TA CHEGANDO AQUI')

    const resAdminCreated = await request.post(loginUrl)
    .send(
        {
            email: 'adminteste@email.com.br', 
            password: 'adminteste123'
        }
    );
    
    adminToken = resAdminCreated.body.token ; 

    const hashedUserPassword = await bcrypt.hash('joaodasneves123', 10)

    const userCreated = await pool.query(
        `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
        `, 
        ['João das Neves', 'joaodasneves@email.com.br', hashedUserPassword, 'user']
    ); 

    userId = userCreated.rows[0].id ; 

    const resUserCreated = await request.post(loginUrl)
    .send(
        {
            email: 'joaodasneves@email.com.br', 
            password: 'joaodasneves123'
        }
    ); 

    userToken = resUserCreated.body.token ;

}); 

describe('USERS ROUTER TEST', () => { 

    test('POST /users | SHOULD RETURNS 201 |', async() => { 

        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Valentim Terra', 
                email: 'valentimterra@email.com.br', 
                password: 'valentimterra123'
            }
        ); 

        expect(response.status).toBe(201); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.name).toBe('Valentim Terra'); 
        expect(response.body.email).toBe('valentimterra@email.com.br'); 
        expect(response.body.id).toBeDefined(); 
        expect(response.body.created_at).toBeDefined();
    }); 

    test('POST /users (NO NAME) |SHOULD RETURNS 400| ', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: ' ', 
                email: 'valentimterra@email.com.br', 
                password: 'valentimterra123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos');
    }); 

    test('POST /users (SHORT NAME) |SHOULD RETURNS 400|', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Ts', 
                email : 'valentimterra@email.com.br', 
                password: 'valentimterra123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    
    test('POST /users (NO EMAIL) |SHOULD RETURNS 400|', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Valentim Terra', 
                email : ' ', 
                password: 'valentimterra123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    test('POST /users (WRONG FORMAT EMAIL) |SHOULD RETURNS 400|', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Valentim Terra', 
                email : 'pedroresende', 
                password: 'valentimterra123'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });

    test('POST /users (NO PASSWORD) |SHOULD RETURNS 400|', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Valentim Terra', 
                email : 'valentimterra@email.com.br', 
                password: ' '
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });
    
    test('POST /users (SHORT PASSWORD) |SHOULD RETURNS 400|', async() => { 
        
        const response = await request.post(usersUrl)
        .send(
            {
                name: 'Valentim Terra', 
                email : 'valentimterra@email.com.br', 
                password: 'abs'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    }); 

    test('POST /users (NO BODY) |SHOULD RETURNS 400| ', async() => { 

        const response = await request.post(usersUrl); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });

    test(' POST /users (DUPLICATED USER)', async() => { 

        const response = await request.post(usersUrl)
        .send(
            {
                name: 'João das Neves', 
                email: 'joaodasneves@email.com.br', 
                password: 'joaodasneves123'
            }
        ); 

        expect(response.status).toBe(409); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Usuário já cadastrado');  
    }); 

    test(' GET /users (NO TOKEN) |SHOULD RETURNS 401|', async() => { 
        
        const response = await request.get(usersUrl)

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Não autorizado');
    }); 

    test('GET /users (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 
        
        const response = await request.get(usersUrl)
        .set('Authorization', 'Bearer 123456789'); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Token inválido'); 
    }); 

    test('GET /users (FALSE TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.get(usersUrl)
        .set('Authorization', `Basic ${adminToken}`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    }); 

    test('GET /users (USER TOKEN) |SHOULD RETURNS 403|', async() => { 

        const response = await request.get(usersUrl)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Acesso negado, sem permissão');
    }); 

    test('GET /users |SHOULD RETURNS 200|', async() => { 

        const response = await request.get(usersUrl)
        .set('Authorization', `Bearer ${adminToken}`); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body[0].password).toBeUndefined(); 
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /users/:id (NO TOKEN) |SHOULD RETURNS 401|', async() => {

        const response = await request.get(`${usersUrl}/${userId}`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Não autorizado'); 
    }); 

    test('GET /users/:id (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.get(`${usersUrl}/${userId}`)
        .set('Authorization', 'Bearer 123456789'); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Token inválido'); 
    }); 

    test('GET /users/:id (FALSE TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.get(`${usersUrl}/${userId}`)
        .set('Authorization', `Basic ${userToken}`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    }); 

    test('GET /users/:id (OWNER LOGIN) |SHOULD RETURNS 200|', async() => { 

        const response = await request.get(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.password).toBeUndefined(); 
        expect(response.body.id).toBeDefined(); 
        expect(response.body.name).toBe('João das Neves'); 
        expect(response.body.email).toBe('joaodasneves@email.com.br'); 
        expect(response.body.role).toBe('user'); 
    }); 

    test('GET /users/:id (USER ACCESS OTHER) |SHOULD RETURNS 403|', async() => { 

        const response = await request.get(`${usersUrl}/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.msg).toBe('Acesso negado, sem permissão'); 
    }); 

    test('GET /users/:id (ADMIN ACCESS OTHER) |SHOULD RETURNS 200|', async() => {

        const response = await request.get(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`); 

        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.password).toBeUndefined(); 
        expect(response.body.id).toBeDefined(); 
        expect(response.body.name).toBe('João das Neves'); 
        expect(response.body.email).toBe('joaodasneves@email.com.br'); 
        expect(response.body.role).toBe('user');       
    }); 

    test('GET /users/:id (INEXISTENT ID) |SHOULD RETURNS 404|', async() => { 

        const response = await request.get(`${usersUrl}/99999`)
        .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Usuário não encontrado'); 
    }); 

    test('PUT /users/:id (NO TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`); 

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Não autorizado'); 
    }); 

    test('PUT /users/:id (INVALID TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', 'Bearer 123456789')

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Token inválido');
    });

    test('PUT /users/:id (FALSE TOKEN) |SHOULD RETURNS 401|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', `Basic ${userToken}`)

        expect(response.status).toBe(401); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Tipo de token inválido'); 
    }); 

    test('PUT /users/:id (OWNER ACCOUNT ACCESS) |SHOULD RETURNS 200|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                name: 'João das Neves atualizado', 
                email: 'joaodasnevesatualizado@email.com.br'
            }
        ); 

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.name).toBe('João das Neves atualizado'); 
        expect(response.body.email).toBe('joaodasnevesatualizado@email.com.br');
    }); 

    test('PUT /users/:id (USER TRY ACCESS OTHER ACCOUNT |SHOULD RETURNS 403', async() => { 

        const response = await request.put(`${usersUrl}/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`); 

        expect(response.status).toBe(403); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Acesso negado, sem permissão')
    }); 

    test('PUT /users/:id (ADMIN TRY ACCESS) |SHOULD RETURNS 200|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(
            {
                name: 'João das Neves Atualizado por Admin', 
                email: 'joaodasnevesatualizadoporadmin@email.com.br'
            }
        );
        expect(response.status).toBe(200); 
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body.name).toBe('João das Neves Atualizado por Admin'); 
        expect(response.body.email).toBe('joaodasnevesatualizadoporadmin@email.com.br')
    });

    test('PUT /users/:id (INEXISTENT ID) |SHOULD RETURNS 404', async() => { 

        const response = await request.put(`${usersUrl}/99999`)
        .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Usuário não encontrado'); 
    });

    test('PUT /users/:id (INVALID BODY NAME) |SHOULD RETURNS 400|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                name: 'Jo',
                email: 'emailatualizado@email.com.br'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });

    test('PUT /users/:id (INVALID BODY EMAIL) |SHOULD RETURNS 400|', async() => { 

        const response = await request.put(`${usersUrl}/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(
            {
                name: 'João das Neves Atualizado',
                email: 'email-atualizado'
            }
        ); 

        expect(response.status).toBe(400); 
        expect(response.headers['content-type']).toMatch(/json/); 
        expect(response.body.msg).toBe('Dados inválidos'); 
    });

    test('DELETE /users/:id (NO TOKEN) |SHOULD RETURNS 401|', async() => {

    const response = await request.delete(`${usersUrl}/${userId}`);
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.msg).toBe('Não autorizado');
});

test('DELETE /users/:id (INVALID TOKEN) |SHOULD RETURNS 401|', async() => {

    const response = await request.delete(`${usersUrl}/${userId}`)
    .set('Authorization', 'Bearer 123456789');
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.msg).toBe('Token inválido');
});

test('DELETE /users/:id (FALSE TOKEN) |SHOULD RETURNS 401|', async() => {

    const response = await request.delete(`${usersUrl}/${userId}`)
    .set('Authorization', `Basic ${userToken}`);
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.msg).toBe('Tipo de token inválido');

});

test('DELETE /users/:id (USER TRY ACCESS OTHER ACCOUNT) |SHOULD RETURNS 403|', async() => {

    const response = await request.delete(`${usersUrl}/${adminId}`)
    .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.msg).toBe('Acesso negado, sem permissão');

});

test('DELETE /users/:id (INEXISTENT ID) |SHOULD RETURNS 404|', async() => {

    const response = await request.delete(`${usersUrl}/99999`)
    .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.msg).toBe('Usuário não encontrado');

});

test('DELETE /users/:id (ADMIN ACCESS) |SHOULD RETURNS 204|', async() => {

    const response = await request.delete(`${usersUrl}/${userId}`)
    .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(204);
});

}); 


afterAll(async() => {

    await pool.query(
        `
        DELETE FROM users
        WHERE id IN ($1, $2)
        OR email = $3
        `,
        [adminId, userId, 'valentimterra@email.com.br']
    );
});