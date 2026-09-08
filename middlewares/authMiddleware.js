const jwt = require('jsonwebtoken'); 

function generateToken(payload) {
    try {
        return jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            {expiresIn : process.env.JWT_EXPIRES}
        )
    } catch(err) {
        throw Error('ERRO AO GERAR O TOKEN')
    }
}; 

function verifyToken(request, response, next) { 
    const {authorization} = request.headers; 

    if(!authorization) {
        return response.status(401).json({msg: 'Não autorizado'});
    }; 

    const [tipo, token] = authorization.split(' '); 

    if(tipo !== "Bearer" || !token) {
        return response.status(401).json({ msg: 'Tipo de token inválido'}); 
    }; 

    try {
        request.payload = jwt.verify(token, process.env.JWT_SECRET); 
        next(); 
    } catch(err) {
        return response.status(401).json({msg: 'Token inválido'});
    }
}

function refreshToken(request, response) {
    try {
        const payload = {
            id: request.payload.id, 
            name: request.payload.name, 
            email: request.payload.email, 
            role: request.payload.role
        }; 

        const novoToken = generateToken(payload); 
        return response.status(200).json({msg: `Novo token gerado`, novoToken})
    } catch(err) {
        return response.status(500).json({msg: 'Erro interno da API'});
    }
}

module.exports = { generateToken, verifyToken, refreshToken}; 