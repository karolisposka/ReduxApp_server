const express = require('express');
const {mysqlConfig} = require('../../config');
const mysql = require('mysql2/promise');
const router = express.Router();

router.post('/get', async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const data = con.execute(`SELECT * FROM products Where id={``}`)

    }catch(err){
        console.log(err)
        res.status(500).send({err: 'Something wrong with the server.Please try again later'})
    }
})


module.exports = router;