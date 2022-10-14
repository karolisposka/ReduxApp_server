const express = require('express');
const {mysqlConfig } = require('../../config'); 
const mysql = require('mysql2/promise');
const router = express.Router();
const checkIfLoggedIn =require('../../middleware/auth/auth')


//admin routes

router.get('/get', async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [orders] = await con.execute(`SELECT * FROM orders`);
        const [orderProducts] = await con.execute(`SELECT * FROM orderProducts `)
        await con.end()
        if(orders && orderProducts) {
            const mappedData = orders.map(order => {
                return {
                    ...order,
                    products: orderProducts.filter((product) => order.session_id.includes(product.session_id)),
                
                }
            })    
            res.send(mappedData)
        }
    }catch(err){
        console.log(err)
        res.status(500).send({err: 'Something wrong with the server.Please try again later'})
    }
})

router.post('/verify', async (req,res) => {
    try{
        const con = await mysql.createConnection(mysqlConfig)
        const [data] = await con.execute(`SELECT * FROM pendingOrders WHERE session_id=${mysql.escape(req.body.event)}`)
        if(data){
            const [deleteItem] = await con.execute(`DELETE FROM pendingOrders WHERE session_id=${mysql.escape(req.body.event)}`)
            if(deleteItem){
                const [insertData] = await con.execute(`INSERT INTO orders (session_id, user_id, amount, created_at, shipping)
                VALUES(${mysql.escape(data[0].session_id)}, ${mysql.escape(data[0].user_id)}, ${mysql.escape(data[0].amount)}, ${mysql.escape(data[0].created_at)}, ${mysql.escape(data[0].shipping)})`)
            }
         }
        res.send({data: 'verified'})
    }catch(err){
        console.log(err)
    }
})

router.post('/change', async(req,res) =>{
  
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`UPDATE orders SET status=1, completed_at=${mysql.escape(req.body.completed_at)} WHERE session_id=${mysql.escape(req.body.id)}`);
        await con.end()
        if(!data.affectedRows){
          return res.status(500).send({err:'something wrong with the server.Please try again later'})
        }
        return res.send(req.body.id.toString())
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server.Please try again later'})
    }
})

//userOrders routes

router.get('/userOrders', checkIfLoggedIn(), async(req,res) =>{
    try{
        const today = new Date().getTime();
        const yesturday = today - 86400000/24/2;
        
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT * FROM orders WHERE user_id = ${req.user} AND created_at BETWEEN ${yesturday} AND ${today}`);
        const [orderProducts] = await con.execute(`SELECT * FROM orderProducts WHERE user_id=${req.user}`)
        await con.end()
        if(data && orderProducts) {
            const mappedData = data.map(order => {
                return {
                    ...order,
                    products: orderProducts.filter((product) => order.session_id.includes(product.session_id)),
                
                }
            })  
            return res.send(mappedData)  
        }
        return res.status(500).send({err:'Something wrong with the server.Please try again later'})
    }catch(err){
        console.log(err)
        res.status(500).send({err:'Something wrong with the server.Please try again later'})
    }
})

router.get('/historicUserOrders', checkIfLoggedIn(), async(req,res)=>{
    try{
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT * FROM orders WHERE user_id = ${req.user} AND status=${mysql.escape(1)}`);
        const [orderProducts] = await con.execute(`SELECT * FROM orderProducts WHERE user_id=${req.user}`)
        await con.end()
        if(data && orderProducts) {
            const mappedData = data.map(order => {
                return {
                    ...order,
                    products: orderProducts.filter((product) => order.session_id.includes(product.session_id)),
                
                }
            })  
            return res.send(mappedData)  
        }
        return res.status(500).send({err:'Something wrong with the server.Please try again later'})
    }catch(err){
        console.log(err)
        res.status(500).send({err:'Something wrong with the server.Please try again later'})
    }
})



module.exports = router;