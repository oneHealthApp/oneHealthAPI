import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * JWT Middleware that handles /o/, /r/, /c/ path rules.
 */
export const jwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const path = req.path;

  // ✅ Case 1: /o/ — open route (no auth required)
  if (path.includes("/o/")) {
    next();
    return;
  }

  // ✅ Case 2 & 3: /r/ and /c/ — token required
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    errorResponse(res, "Authorization token missing or malformed", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;

    // ✅ Case 3: /c/ — roles required
    if (path.includes("/c/")) {
      if (!decoded.roles || !Array.isArray(decoded.roles)) {
        errorResponse(res, "Roles missing in token for /c/ route", 403);
        return;
      }
    }

    // ✅ Case 2: /r/ — token is enough (no roles check)
    return next();
  } catch (err) {
    errorResponse(res, "Invalid or expired token", 401);
    return;
  }
};
