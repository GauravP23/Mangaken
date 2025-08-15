"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const axios_1 = __importDefault(require("axios")); // To check for AxiosError
const errorHandler = (err, req, res, next) => {
    console.error("ERROR HANDLER CAUGHT:", err); // Log the full error for debugging
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = undefined;
    if (axios_1.default.isAxiosError(err) && err.response) {
        // Error from MangaDex API
        statusCode = err.response.status;
        const mangaDexErrorData = err.response.data;
        if (mangaDexErrorData && mangaDexErrorData.errors && mangaDexErrorData.errors.length > 0) {
            message = mangaDexErrorData.errors.map(e => `${e.title}: ${e.detail}`).join(', ');
            errors = mangaDexErrorData.errors;
        }
        else {
            message = err.response.statusText || 'Error connecting to MangaDex API';
        }
    }
    else if (err.statusCode) {
        // Custom error with statusCode property
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err.message) {
        // Generic error
        message = err.message;
    }
    res.status(statusCode).json(Object.assign({ status: 'error', message }, (errors && { errors })));
};
exports.errorHandler = errorHandler;
