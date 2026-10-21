const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config(); 

const app = express();

const usersRouter = require('./routes/usersRouter'); 
const authRouter = require('./routes/authRouter'); 
const accountsRouter = require('./routes/accountsRouter'); 
const transactionsRouter = require('./routes/transactionsRouter');
const apiDocsRouter = require('./routes/apiDocs');


app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api-docs', apiDocsRouter)
app.use('/users', usersRouter); 
app.use('/auth', authRouter); 
app.use('/accounts', accountsRouter); 
app.use('/transactions', transactionsRouter); 

module.exports = app;
