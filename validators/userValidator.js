const {z} = require('zod'); 

const createUserSchema = z.object(
    {
        name: z.string().min(3),
        email: z.email(),
        password: z.string().min(6)
    }
)

const updateUserSchema = z.object(
    {
        newName: z.string().min(),
        newEmail: z.email(), 
        newPassword: z.string().min(6)
    }
); 

const loginUserValidator = z.object(
    {
        email: z.email(), 
        password: z.string().min(6),
    }
); 



module.exports = {createUserSchema, updateUserSchema, loginUserValidator}; 