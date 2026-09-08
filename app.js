const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

const usersRouter = require('./routes/users'); 


app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/users', usersRouter)

module.exports = app;
