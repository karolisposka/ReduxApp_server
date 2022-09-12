require('dotenv').config();

module.exports = {
    port: process.env.PORT, 
    mysqlConfig: {
        port: process.env.DB_PORT,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        user: process.env.DB_USERNAME
    },
    jwtSecret: process.env.JWT_SECRET,
}