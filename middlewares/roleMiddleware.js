
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




module.exports = {authorizedRoles, justAdminRoles}