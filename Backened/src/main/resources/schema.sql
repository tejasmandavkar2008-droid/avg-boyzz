-- PostgreSQL Table Definitions

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER'
);

-- 2. Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    type VARCHAR(50),
    current_price DOUBLE PRECISION,
    expected_return DOUBLE PRECISION,
    risk VARCHAR(50),
    liquidity_score DOUBLE PRECISION
);
