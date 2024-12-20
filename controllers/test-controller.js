const express = require('express');

const AppError = require('../errors/app-error');
const AppCustomError = require('../errors/app-custom-error');
const AppNotFoundError = require('../errors/app-not-found-error');

const router = express.Router();

router.get('/error-1/:id',  testError1);
router.get('/error-2',  testError2);

// next should be add in parameter list due to next has used in catch block
function testError1(req, res , next) {
    const { id } = req.params;

    const objCustom = {
        code: 1,
        description: "CUSTOM ERROR"
    };

    const objNotFound = {
        code: 1,
        description: "NOT FOUND ERROR"
    };

    if (id == 0) {
        throw new AppError('MANUAL ERROR - App error occured');
    }else if(id == 1)  {
        throw new AppCustomError('MANUAL ERROR - App customer error occured', objCustom);
    }else if(id == 2) {
        throw new AppNotFoundError('MANUAL ERROR - App not found error occured', objNotFound);
    }
   
    try {
        throw new Error('MANUAL ERROR - throwed by try block');
    } catch (error) {
        //next needs to be in method parameters
        next(new AppError('MANUAL ERROR - manual try catch error occured'));  
    }
}

// JUST A SAMPLE TO SHOW HOW TO HANDLE IT IN TRY - CATCH
async function testError2(req, res, next) {
    try {

    } catch (error) {
        next(new AppError('App error throwed by CATCH{} block'));
    }
}

module.exports = router; 