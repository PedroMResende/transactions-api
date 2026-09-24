-- USER

CREATE TYPE user_role AS ENUM ('user', 'admin');


CREATE TABLE users (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(150) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, 
    role user_role NOT NULL DEFAULT 'user', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ACCOUNTS

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY, 
    user_id INTEGER NOT NULL,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0.00, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

    FOREIGN KEY (user_id) REFERENCES users(id) 
); 

-- TRANSACTIONS

CREATE TYPE transaction_type AS ENUM ('deposit', 'withdraw', 'transfer');


CREATE TABLE transactions (
    id SERIAL PRIMARY KEY, 
    account_id INTEGER NOT NULL, 
    type transaction_type NOT NULL, 
    amount NUMERIC(12,2) NOT NULL, 
    related_account_id INTEGER, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (related_account_id) REFERENCES accounts(id),
    
    CHECK (amount > 0)
);



