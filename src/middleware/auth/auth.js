const jwt = require('jsonwebtoken');
const { jwtSecret } = require ('../../config');

const checkIfLoggedIn = () => async (req,res,next) => {
    try{
        const token = req.headers.authorization?.split(" ")[1];
        req.user = jwt.verify(token, jwtSecret);
        return next();
    }catch(err){
        console.log(err)
        res.status(500).send({err:'Something wrong with the server. Please try again later'})
    }
}

module.exports = checkIfLoggedIn;