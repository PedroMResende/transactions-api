module.exports = async() => { 

    const pool = require('../database/connection'); 

    await pool.end(); 

    console.log('Pool do postgres enecerrado com sucesso.')
}