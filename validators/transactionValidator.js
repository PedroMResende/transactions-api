const {z} = require('zod'); 

const depositSchema = z.object(
    {
        account_id: z.number().int().positive(),
        amount: z.number().positive()
    }
); 

const withdrawSchema = z.object(
    {
        account_id: z.number().int().positive(), 
        amount: z.number().positive()
    }
); 

const transferSchema = z.object(
    {
        account_id : z.number().int().positive(), 
        related_account_id : z.number().int().positive(), 
        amount: z.number().positive()
    }
)

module.exports = {depositSchema, withdrawSchema, transferSchema}; 