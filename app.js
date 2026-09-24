const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config(); 

const app = express();

const usersRouter = require('./routes/usersRouter'); 
const authRouter = require('./routes/authRouter'); 
const accountsRouter = require('./routes/accountsRouter'); 
const transactionsRouter = require('./routes/transactionsRouter');


app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/users', usersRouter); 
app.use('/auth', authRouter); 
app.use('/accounts', accountsRouter); 
app.use('/transactions', transactionsRouter); 

module.exports = app;
