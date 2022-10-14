const express = require('express');
const {mysqlConfig, jwtSecret} = require('../../config'); 
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken')
const router = express.Router();
const stripe = require('stripe')('sk_test_51Lj8yFFPSbztWufZlFEDoK9gX7PnXiKsQHJVoKmUFk3xnqbH4bskMV0fLZY1PwilkS2lcSx5mC87LiqFhUNOHXk500rCHeQmEL');




router.post('/checkout', async(req,res)=>{
    try{
        let userId
        const { products, userKey, delivery } = req.body;
        if(userKey){
            userId = jwt.verify(userKey, jwtSecret)
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${process.env.SERVER_URL}/success`,
            cancel_url: `${process.env.SERVER_URL}/`,
            line_items: products.map(product => {
                return {
                    price_data: {
                        currency: 'EUR',
                        product_data:{
                            name: product.title,

                        },
                        unit_amount: product.price*100
                    },
                    quantity: product.quantity
                }
            })
           
        });
        if(session){
            const con = await mysql.createConnection(mysqlConfig);
            const time = new Date().getTime();
            const [data] = await con.execute(`INSERT INTO pendingOrders (session_id, user_id, amount, shipping, created_at)
            VALUES(${mysql.escape(session.id)}, ${mysql.escape(userId)}, ${mysql.escape(session.amount_total)}, ${mysql.escape(delivery)}, ${mysql.escape(time)})`);
            products.forEach(async product => {
               return test = await con.execute(`INSERT INTO orderProducts (session_id, title, description, quantity, price, user_id)
               VALUES(${mysql.escape(session.id)}, ${mysql.escape(product.title)}, ${mysql.escape(product.description)}, ${mysql.escape(product.quantity)}, ${mysql.escape(product.price)},${mysql.escape(userId)})`)
               
           })
           if(data.affectedRows){
            return res.send(session.url)
           } else{
            return res.status(500).send(session.cancel_url)
           }
           
        }
        
    }catch(err){
        console.log(err);
        res.status(500).send({err:'something wrong with the server. Please try again later'})
    }    
})




module.exports = router;