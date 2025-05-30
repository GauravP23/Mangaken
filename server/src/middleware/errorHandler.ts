import { Request, Response, NextFunction } from 'express';
import axios from 'axios'; // To check for AxiosError

interface MangaDexError {
    id: string;
    status: number;
    title: string;
    detail: string;
}

interface MangaDexErrorResponse {
    result: 'error';
    errors: MangaDexError[];
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("ERROR HANDLER CAUGHT:", err); // Log the full error for debugging

    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: MangaDexError[] | undefined = undefined;

    if (axios.isAxiosError(err) && err.response) {
        // Error from MangaDex API
        statusCode = err.response.status;
        const mangaDexErrorData = err.response.data as MangaDexErrorResponse;
        if (mangaDexErrorData && mangaDexErrorData.errors && mangaDexErrorData.errors.length > 0) {
            message = mangaDexErrorData.errors.map(e => `${e.title}: ${e.detail}`).join(', ');
            errors = mangaDexErrorData.errors;
        } else {
            message = err.response.statusText || 'Error connecting to MangaDex API';
        }
    } else if (err.statusCode) {
        // Custom error with statusCode property
        statusCode = err.statusCode;
        message = err.message;
    } else if (err.message) {
        // Generic error
        message = err.message;
    }

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(errors && { errors }), // Conditionally add MangaDex specific errors
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Optionally include stack in dev
    });
};