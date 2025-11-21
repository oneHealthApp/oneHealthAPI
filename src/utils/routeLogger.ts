// Description: A utility to log all registered routes in an Express application in a clean table format.

import { Application } from "express";

/**
 * Logs all routes registered in the Express application in a clean table format.
 */
export function logRoutes(app: Application): void {
  const table: { Method: string; Path: string }[] = [];

  const processStack = (stack: any[], basePath: string = "") => {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Direct route on app
        const route = middleware.route;
        const methods = Object.keys(route.methods)
          .map((m) => m.toUpperCase())
          .join(", ");
        table.push({ Method: methods, Path: `${basePath}${route.path}` });
      } else if (middleware.name === "router" && middleware.handle.stack) {
        // Nested router
        const rawBase = middleware.regexp?.source || "";
        const nestedBasePath = rawBase
          .replace("^\\/", "/")
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/")
          .replace(/[\^$]/g, "")
          .replace("/?(?=/|)", "") 
          .replace(/\/$/, "") // Remove trailing slash
          .trim();
        processStack(middleware.handle.stack, `${basePath}${nestedBasePath}`);
      }
    });
  };

  processStack(app._router.stack);

  console.log("\n📘 Registered API Routes:\n");
  console.table(table);
}