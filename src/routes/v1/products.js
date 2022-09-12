const express = require('express');
const {mysqlConfig} = require('../../config');
const mysql = require('mysql2/promise');
const router = express.Router();

router.get('/get', async(req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT * FROM products`);
        await con.end();
        if(data.length > 0){
           return res.send(data);
        }
        return res.send({err:'No data found'});
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
});

router.get('/get/:category', async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig)
        const [data] = await con.execute(`SELECT * FROM products WHERE category=${mysql.escape(req.params.category)}`)
        await con.end();
        if(data.length > 0){
          return  res.send(data)
        }
        return res.status(500).send({err:'something wrong with the server. Pleae try again later'})
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