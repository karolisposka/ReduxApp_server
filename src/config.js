require('dotenv').config();

module.exports = {
    port: process.env.PORT, 
    bucketName: process.env.BUCKET_NAME,
    S3Config:{
        credentials:{
            accessKeyId: process.env.BUCKET_ACCESS_KEY,
            secretAccessKey: process.env.BUCKET_SECRET
        },
        region: process.env.BUCKET_REGION,
    },
    mysqlConfig: {
        port: process.env.DB_PORT,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        user: process.env.DB_USERNAME
    },
    jwtSecret: process.env.JWT_SECRET,
    stripeSecret: process.env.STRIPE_END_POINT_SECRET,
}