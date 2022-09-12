const express = require('express');
const {mysqlConfig, jwtSecret} = require('../../config');
const mysql = require('mysql2/promise');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validation = require('../../middleware/validation/validation');
const checkIfLoggedIn = require('../../middleware/auth/auth')
const {registerValidation, loginValidation} = require('../../middleware/validation/validationSchemas/usersValidation');
const { check } = require('prettier');


router.post('/register', validation(registerValidation), async(req,res)=>{
    console.log(req.body);
    try{
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`INSERT INTO users (email, password)
        VALUES(${mysql.escape(req.body.email)}, ${mysql.escape(hashedPassword)})`);
        await con.end();
        if(!data.insertId){
            return res.status(500).send({err:'something wrong with the server. Please try again later'});
        }
        return res.send({msg:'registration completed'});
    }catch(err){
        console.log(err);
        if(err.errno ===  1062){
            return res.status(400).send({err:'user already exists'});
        }
        return res.status(500).send({err:'something wrong with the server.Please try again later'});
    }
})

router.post('/login', validation(loginValidation), async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT id, password FROM users WHERE email=${mysql.escape(req.body.email)}`);
        await con.end();
        if(data.length === 0){
            return res.status(400).send({err:'Incorrect details provided'});
        }
         const checkHash = bcrypt.compareSync(req.body.password, data[0].password);
        if(checkHash){
            const token = jwt.sign(data[0].id, jwtSecret);
            return res.send(token)
        }
        return res.status(400).send({err:'wrong password'})
    }catch(err){
        console.log(err);
        res.status(500).send({msg:'something wrong with the server.Please try again later'});
    }
});

router.get('/details', checkIfLoggedIn(), async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT  id, first_name, last_name, city, address,default_status, post_code, mobile FROM users_addresses WHERE user_id=${mysql.escape(req.user)}`)
        await con.end()
        console.log(data);
        if(data.length === 0){
            return res.status(500).send({err:'no data found'})
        }
        return res.send(data);
    }catch(err){
        console.log(err)
        res.send({err:'something wrong with the server. Please try again later'})
    }
})

router.post('/details/defaultaddress', checkIfLoggedIn(), async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`UPDATE users_addresses SET default_status=${mysql.escape(req.body.status)} where id=${mysql.escape(req.body.id)} AND user_id=${req.user}`);
        await con.end();
        console.log(data);
        if(data.affectedRows){
           return res.send({msg:'default address changed'})
        }
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }catch(err){
        console.log(err);
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
});

router.delete('/deleteAddress/:id', checkIfLoggedIn(), async (req,res)=>{
    try{
        console.log(req.params);
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`DELETE FROM users_addresses WHERE id=${mysql.escape(req.params.id)} AND user_id=${req.user}`);
        await con.end();
        if(data.affectedRows >0){
            return res.send({id: req.params.id})
        }
        

    }catch(err){
        console.log(err);
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
})

router.post('/postAddress', checkIfLoggedIn(), async(req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`INSERT INTO users_addresses (user_id, first_name, last_name, mobile, address, city, post_code)
        VALUES(${mysql.escape(req.user)}, ${mysql.escape(req.body.first_name)}, ${mysql.escape(req.body.last_name)}, ${mysql.escape(req.body.mobile)}, ${mysql.escape(req.body.address)},${mysql.escape(req.body.city)}, ${mysql.escape(req.body.post_code)} )`)
        await con.end();
        if(!data.insertId){
           return res.status(500).send({err:'something wrong with the server.Pleae try again later'})
        }
        return res.send({...req.body, id: data.insertId})
    }catch(err){
        console.log(err)
        return res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
})


module.exports = router