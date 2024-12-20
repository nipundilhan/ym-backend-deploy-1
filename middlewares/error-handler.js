function errorHandler(err, req, res, next) {

    //console.error(err.stack);
    console.log(err.message);

    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        message: err.message
    };

    //if info(object) present set it to the response . info can be any time of object - normal , nested or list of objects
    if (err.info) {
        response.info = err.info;
    }

    res.status(statusCode).json(response);
}

module.exports = errorHandler;