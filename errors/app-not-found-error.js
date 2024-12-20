const AppError = require('./app-error');

class AppNotFoundError extends AppError {
    constructor(message, obj) {
        super(message);
        this.info = obj;
        this.statusCode = 404; // Or the appropriate status code
    }
}

module.exports = AppNotFoundError;