


function validate(schema) {
    return (request, response, next) => { 
        try {
            schema.parse(request.body); 

            next();
        } catch(err) {
            return response.status(400).json(
                {
                    msg: "Dados inválidos"
                }
            )
        }
    }
}

module.exports = validate