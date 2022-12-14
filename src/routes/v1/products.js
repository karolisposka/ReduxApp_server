const express = require('express');
const mysql = require('mysql2/promise');
const multer = require("multer");
const crypto = require('crypto');
const sharp = require('sharp');
const {mysqlConfig, S3Config, bucketName} = require('../../config');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const {S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const e = require('express');
const s3 = new S3Client(S3Config)

router.get('/get', async(req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT products.*, products_prices.small, products_prices.big FROM products LEFT JOIN products_prices ON products.id = products_prices.product_id`);
        await con.end();
        if(data.length > 0){
            for(const product of data){
                const getObjectParams={
                    Bucket: bucketName,
                    Key: product.image,
                }
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                product.imageurl = url
            }
            return res.send(data);
        }else{
            return res.send({err:'No data found'});
        }
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
});

router.get('/product/:title', async(req,res)=>{
    try{
    
        const con = await mysql.createConnection(mysqlConfig)
        const [data] = await con.execute(`SELECT * FROM products where title=${mysql.escape(req.params.title)}`)
        console.log(data)
        await con.end();
        res.send(data);
    }catch(err){
        console.log(err)
    }
})

router.get('/additives', async (req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT * FROM additives`);
        await con.end()
        if(data.length >0){
            for(const product of data){
                const getObjectParams={
                        Bucket: bucketName,
                        Key: product.picture,
                    }
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                product.image = url
            }
           return res.send(data)
        }
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
});

router.post('/postProduct', upload.single('file'), async (req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const buffer =  await sharp(req.file.buffer).resize({height:600, width:600, fit:'contain'}).toBuffer()
        const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
        const imageName = randomImageName()

        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: buffer,
            ContentType: req.file.mimetype
        };
        const command = new PutObjectCommand(params);
        const imageUpload = await s3.send(command);
        if(imageUpload.ETag){
            if(req.body.category === 'priedai'){
                const [data] = await con.execute(`INSERT INTO additives (picture, title, price)
                VALUES('${imageName}', ${mysql.escape(req.body.title)}, ${mysql.escape(req.body.price)})`)
                await con.end();
                if(data.insertId){
                    await con.end();
                    return res.send({msg:'successfully addded'})
                }
                await con.end();
                return res.status(500).send({err:'something wrong with the server.Please try again later'})
            }
            
            if(!req.body.bigPrice){
                const [data] = await con.execute(`INSERT INTO products (title, image, category)
                VALUES( ${mysql.escape(req.body.title)}, '${imageName}', ${mysql.escape(req.body.category)})`);
                if(data.insertId){
                    const [data2] = await con.execute(`INSERT INTO products_prices (product_id, small) VALUES(${data.insertId},${mysql.escape(req.body.price)})`)
                    await con.end();
                    if(data2.insertId){
                        return res.send({msg:'successfully added'})
                    }
                }
               
                if(data.insertId){
                    return res.send({msg:'successfully addded'})
                }
                return res.status(500).send({err:'something wrong with the server.Please try again later'})
            }
            const [data] = await con.execute(`INSERT INTO products (title, description, image, category)
            VALUES(${mysql.escape(req.body.title)}, ${mysql.escape(req.body.description)},${mysql.escape(imageName)}, ${mysql.escape(req.body.category)})`);
            if(data.insertId){
                const [data2] = await con.execute(`INSERT INTO products_prices (product_id, small, big)
                VALUES(${mysql.escape(data.insertId)}, ${mysql.escape(req.body.price)}, ${mysql.escape(req.body.bigPrice)})`)
                await con.end();
                if(data2.insertId){
                    return res.send({msg:'product successfully added'})
                } else{
                    return res.status(500).send({err:'something wrong with the server.Please try again later'})
                }
            }else{
                await con.end();
                return res.status(500).send({err:'something wrong with the server.Please try again later'})
            }
        }else{
            return res.status(500).send({err:'something wrong with the server.Please try again later'});
        }
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
})

router.get('/get/:category', async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig)
        const [data] = await con.execute(`SELECT products.id, products.title, products.description, products.category, products.image, products_prices.small, products_prices.big FROM products LEFT JOIN products_prices ON products.id = products_prices.product_id WHERE category=${mysql.escape(req.params.category)}`)
        await con.end();
        if(data.length > 0){
            for(const product of data){
                const getObjectParams={
                        Bucket: bucketName,
                        Key: product.image,
                    }
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                product.imageurl = url
            }
          return  res.send(data)
        }else{
            return res.status(500).send({err:'something wrong with the server. Please try again later'})
        }    
    }catch(err){
        console.log(err)
         return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
})

router.get('/get/search/:input', async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT * FROM products WHERE title LIKE ${mysql.escape('%'+req.params.input+'%')} OR description LIKE ${mysql.escape('%'+req.params.input+'%')}`)
        await con.end();
        if(data.length > 0){
           return res.send(data)
        }
        return res.status(500).send({err:'something wrong with the server.Please try again later'})

    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
});


router.get('/categories', async(req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute('SELECT category FROM products');
        await con.end();
        if(data.length > 0) {
            const uniqueCategories = data.map((item) => item.category)
            .filter((value, index, self) => self.indexOf(value) === index)
           return res.send(uniqueCategories)
        }
        return res.status(500).send({err:'No categories found'})
    }catch(err){
        console.log(err);
       return  res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
});




module.exports = router;