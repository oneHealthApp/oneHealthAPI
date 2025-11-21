import { Request, Response } from 'express';
import { handlePrismaError } from './prismaErrorHandler';
import { Prisma } from '@prisma/client';

/**
 * Determines if the provided data is considered empty.
 * Data is considered empty if it is null, undefined, an empty string,
 * an empty array, or an empty object (excluding arrays).
 */
function isDataEmpty(data: any): boolean {
  if (data === undefined || data === null) return true;
  if (typeof data === 'string' && data.trim() === '') return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data).length === 0
  )
    return true;
  return false;
}

/**
 * Returns a default success message based on the HTTP request method.
 */
function getDefaultSuccessMessage(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'Success';
    case 'POST':
      return 'Created';
    case 'PUT':
    case 'PATCH':
      return 'Updated';
    case 'DELETE':
      return 'Deleted';
    default:
      return 'Success';
  }
}

/**
 * Formats and sends a standardized success response.
 *
 * Logic:
 * - Uses the default status of 201(created) for POST and 200(ok/success) for other methods unless a status is provided.
 * - For GET, PUT, PATCH, or DELETE:
 *     • If data is empty and no custom message is provided, returns a 204 No Content (and no body is sent).
 *     • If a custom message is provided, it sends a JSON payload with a 200 response.
 *
 * @param res     Express Response object.
 * @param data    Response data.
 * @param status  (Optional) Explicit HTTP status code.
 * @param message (Optional) Custom message.
 * @returns       Express Response object.
 */
export const successResponse = (
  res: Response,
  data: any,
  status?: number,
  message?: string,
): Response => {
  const req = res.req as Request;
  const method = req.method.toUpperCase();

  // Default status codes: 201 for POST, otherwise 200
  let responseStatus = status || (method === 'POST' ? 201 : 200);

  // If data is empty AND no custom message is provided,
  // then for GET, PUT, PATCH, DELETE we adhere to the spec by sending a 204.
  if (
    isDataEmpty(data) &&
    !message &&
    ['GET', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    // Send a 204 No Content response with no body.
    return res.status(204).send();
  }

  // If a message is provided or data exists, construct the JSON payload.
  const responseMessage = message || getDefaultSuccessMessage(method);
  return res.status(responseStatus).json({
    success: true,
    data,
    message: responseMessage,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    requestId: (req as any).requestId || null,
  });
};

/**
 * Formats and sends a standardized error response.
 * Leverages the existing handlePrismaError for Prisma-specific errors.
 *
 * @param res     Express Response object.
 * @param error   Error details (string or Error object).
 * @param status  (Optional) HTTP status code, default is 500.
 * @param message (Optional) Custom error message.
 * @returns       Express Response object.
 */
export const errorResponse = (
  res: Response,
  error: any,
  status = 500,
  message = 'Error occurred',
): Response => {
  const req = res.req as Request;

  // Handle Prisma errors using the existing handler
  let formattedError = error;
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    formattedError = handlePrismaError(error);
    // Use the status code from the formatted error if it's a Prisma error
    status = formattedError.code > 1999 ? 500 : 400;
    if (formattedError.code === 1025) {
      // P2025 - Record not found
      status = 404;
    }
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error:
      typeof formattedError === 'string' || Array.isArray(formattedError)
        ? formattedError
        : { ...formattedError },
    message: JSON.stringify(formattedError.message) || JSON.stringify(message),
    statusCode: status,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    requestId: (req as any).requestId || null,
  };

  return res.status(status).json(errorResponse);
};

/**
 *
 *                                     HTTP Key Considerations
    GET Requests:
      200 OK: When data is successfully retrieved.
      204 No Content: When the request is valid but there is no content to send (e.g., a search endpoint with no results).

    POST Requests:
      201 Created: Should be returned when a resource is created. The response often includes the newly created resource or a URI reference.
      200 OK: Sometimes used if the POST action triggers an operation that isn’t strictly “resource creation.”

    PUT & PATCH Requests:
      200 OK: When returning the updated resource.
      204 No Content: When the operation is successful but you choose not to return the updated state in the response body.

    DELETE Requests:
      200 OK: When you want to return a confirmation message that details what was deleted.
      204 No Content: When there’s no need to return additional data, indicating successful deletion.

 */
