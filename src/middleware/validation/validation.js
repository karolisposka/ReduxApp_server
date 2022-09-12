const validation = (schema) => async (req,res,next) =>{
    try{
        req.body = await schema.validateAsync(req.body);
        return next();
    }catch(err){
        console.log(err);
        return res.status(400).send({err:'wrong data passed'});
    }
}


module.exports = validation;