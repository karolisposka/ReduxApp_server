const express = require('express');
const {mysqlConfig, jwtSecret} = require('../../config');
const mysql = require('mysql2/promise');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validation = require('../../middleware/validation/validation');
const checkIfLoggedIn = require('../../middleware/auth/auth')
const {registerValidation, loginValidation, changePassword} = require('../../middleware/validation/validationSchemas/usersValidation');


router.post('/register', validation(registerValidation), async(req,res)=>{
    try{
        const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
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


router.post('/changePassword', validation(changePassword), checkIfLoggedIn(), async(req,res)=>{
    try{
        console.log(req.body);
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT password FROM users WHERE id=${req.user}`)
        console.log(data[0].password)
        if(data.length === 0){
            return res.status(500).send({err:'Something wrong with the server.Please try again later'})
        }
        const hashCheck = bcrypt.compareSync( req.body.currentPassword, data[0].password); 
        
        console.log(hashCheck)
        if(hashCheck){
            const hashNewPassword =  bcrypt.hashSync(req.body.newPassword, 10);
           const [data2] = await con.execute(`UPDATE users SET password= ${mysql.escape(hashNewPassword)}`);
           console.log(data2)
           await con.end();
           if(data2.affectedRows > 0){
            return res.send({msg:'Password successfully changed'});
           }
           else{
            res.status(500).send({err:'Something wrong with the server.Please try again later'});
           }
        }else{
            res.status(500).send({err:'Current password is incorrect'})
        }
    }catch(err){
        console.log(err)
        return res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
})

router.get('/details', checkIfLoggedIn(), async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT  id, first_name, last_name, city, address,default_status, post_code, mobile FROM users_addresses WHERE user_id=${mysql.escape(req.user)}`)
        await con.end()
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
        if(data.affectedRows){
           return res.send(req.body)
        }
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }catch(err){
        console.log(err);
        return res.status(500).send({err:'something wrong with the server. Please try again later'})
    }
});

router.delete('/deleteAddress/:id', checkIfLoggedIn(), async (req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`DELETE FROM users_addresses WHERE id=${mysql.escape(req.params.id)} AND user_id=${req.user}`);
        await con.end();
        if(data.affectedRows >0){
            return res.send({id: req.params.id});
        }
        return res.status(500).send({err:'something wrong with the server. Please try again later'});
    }catch(err){
        console.log(err);
        return res.status(500).send({err:'something wrong with the server. Please try again later'});
    }
})


//reikia backo validacijos. 
router.post('/postAddress', checkIfLoggedIn(), async(req,res) =>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`INSERT INTO users_addresses (user_id, first_name, last_name, mobile, address, city, post_code)
        VALUES(${mysql.escape(req.user)}, ${mysql.escape(req.body.first_name)}, ${mysql.escape(req.body.last_name)}, ${mysql.escape(req.body.mobile)}, ${mysql.escape(req.body.address)},${mysql.escape(req.body.city)}, ${mysql.escape(req.body.post_code)} )`);
        await con.end();
        if(!data.insertId){
           return res.status(500).send({err:'something wrong with the server.Pleae try again later'});
        }
        return res.send({...req.body, id: data.insertId, default_status: 0})
    }catch(err){
        console.log(err)
        return res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
})


module.exports = router