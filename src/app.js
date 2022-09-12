const express = require('express');
const cors = require('cors');
const {port}  = require('./config'); 
const app = express();
app.use(cors());
app.use(express.json());
const productsRoute = require('./routes/v1/products');
const cartRoute = require('./routes/v1/cart');
const usersRoute = require('./routes/v1/users');

app.get('/', (req,res) =>{
    res.send({msg:'server is running'});
});

app.use('/v1/products', productsRoute);
app.use('/v1/cart', cartRoute);
app.use('/v1/users', usersRoute);

app.get('*', (req, res) =>{
    res.send({msg:'server is running'});
});


app.listen(port,  ()=>{
    console.log(`server is running on port ${port}`);
})