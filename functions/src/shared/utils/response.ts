import { Response } from 'express';
import { ApiResponse } from '../types/models';

/**
 * Send a success response
 * @param res Express response object
 * @param data Data to send in the response
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param res Express response object
 * @param error Error message or object
 * @param statusCode HTTP status code (default: 400)
 */
export const sendError = (
  res: Response,
  error: string | Error,
  statusCode = 400
): Response => {
  const errorMessage = error instanceof Error ? error.message : error;
  const response: ApiResponse<null> = {
    success: false,
    error: errorMessage,
  };
  return res.status(statusCode).json(response);
};
