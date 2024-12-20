const AppError = require('./app-error');

class AppCustomError extends AppError {
    constructor(message, obj) {
        super(message);
        this.info = obj;
        this.statusCode = 403; // Or the appropriate status code
    }
}

module.exports = AppCustomError;