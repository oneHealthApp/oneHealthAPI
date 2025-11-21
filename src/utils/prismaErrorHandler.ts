import { Prisma } from '@prisma/client';

interface ErrorResponse {
  code: number;
  message: string;
}

type PrismaErrorHandlers = {
  PrismaClientKnownRequestError: (
    error: Prisma.PrismaClientKnownRequestError,
  ) => ErrorResponse;
  PrismaClientValidationError: (
    error: Prisma.PrismaClientValidationError,
  ) => ErrorResponse;
  PrismaClientUnknownRequestError: (
    error: Prisma.PrismaClientUnknownRequestError,
  ) => ErrorResponse;
  PrismaClientInitializationError: (
    error: Prisma.PrismaClientInitializationError,
  ) => ErrorResponse;
  PrismaClientRustPanicError: (
    error: Prisma.PrismaClientRustPanicError,
  ) => ErrorResponse;
};

const PrismaErrorMap: PrismaErrorHandlers = {
  PrismaClientKnownRequestError: (
    error: Prisma.PrismaClientKnownRequestError,
  ) => {
    switch (error.code) {
      case 'P2000':
        return {
          code: 1000,
          message: 'Input value is too long for the field.',
        };
      case 'P2001':
        return { code: 1001, message: 'Record not found for the given query.' };
      case 'P2002':
        return {
          code: 1002,
          message: `Unique constraint failed on field: ${error.meta?.target}`,
        };
      case 'P2003':
        return {
          code: 1003,
          message: `Foreign key constraint failed on the field : ${error.meta?.field_name}`,
        };
      case 'P2004':
        return {
          code: 1004,
          message: 'Database constraint violation during transaction.',
        };
      case 'P2005':
        return { code: 1005, message: 'Invalid value stored for the field.' };
      case 'P2006':
        return { code: 1006, message: 'Missing required value for a field.' };
      case 'P2007':
        return { code: 1007, message: 'Data validation error.' };
      case 'P2008':
        return { code: 1008, message: 'Failed to parse database query.' };
      case 'P2009':
        return {
          code: 1009,
          message: 'Query execution failed due to invalid input.',
        };
      case 'P2010':
        return {
          code: 1010,
          message: 'Raw query failed. Check the query syntax.',
        };
      case 'P2011':
        return {
          code: 1011,
          message: 'Null constraint violation on non-nullable field.',
        };
      case 'P2012':
        return {
          code: 1012,
          message: 'Missing required argument for database operation.',
        };
      case 'P2013':
        return {
          code: 1013,
          message: 'Missing required relational condition.',
        };
      case 'P2014':
        return {
          code: 1014,
          message: 'Multiple records found, expected only one.',
        };
      case 'P2015':
        return { code: 1015, message: 'Related record not found.' };
      case 'P2016':
        return { code: 1016, message: 'Query interpretation error.' };
      case 'P2017':
        return {
          code: 1017,
          message: 'Records required for relation not found.',
        };
      case 'P2018':
        return { code: 1018, message: 'Invalid record reference encountered.' };
      case 'P2019':
        return { code: 1019, message: 'Input value out of expected range.' };
      case 'P2020':
        return {
          code: 1020,
          message: 'Value out of allowed range for the column.',
        };
      case 'P2021':
        return { code: 1021, message: 'Table does not exist in the database.' };
      case 'P2022':
        return {
          code: 1022,
          message: 'Column does not exist in the database.',
        };
      case 'P2023':
        return {
          code: 1023,
          message: 'Inconsistent database schema detected.',
        };
      case 'P2024':
        return { code: 1024, message: 'Transaction failed due to a deadlock.' };
      case 'P2025':
        return {
          code: 1025,
          message: 'Record not found for update/delete operation.',
        };
      case 'P2026':
        return { code: 1026, message: 'Unsupported database feature.' };
      case 'P2027':
        return { code: 1027, message: 'Multiple databases are not supported.' };
      case 'P2028':
        return {
          code: 1028,
          message: 'Transaction timeout. Retry the operation.',
        };
      case 'P2030':
        return { code: 1030, message: 'Invalid JSON value in database field.' };
      case 'P2031':
        return { code: 1031, message: 'Transaction conflict detected.' };
      case 'P2033':
        return {
          code: 1033,
          message: 'Incorrect number of parameters supplied for raw query.',
        };
      default:
        return { code: 1999, message: 'Unhandled Prisma known request error.' };
    }
  },
  PrismaClientValidationError: () => ({
    code: 1100,
    message: 'Validation error on provided input data.',
  }),
  PrismaClientUnknownRequestError: () => ({
    code: 1101,
    message: 'Unknown error occurred during Prisma request.',
  }),
  PrismaClientInitializationError: () => ({
    code: 1102,
    message: 'Failed to initialize database connection.',
  }),
  PrismaClientRustPanicError: () => ({
    code: 1103,
    message: 'Critical error in Prisma engine. Restart recommended.',
  }),
};

export function handlePrismaError(error: unknown): ErrorResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return PrismaErrorMap.PrismaClientKnownRequestError(error);
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return PrismaErrorMap.PrismaClientValidationError(error);
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return PrismaErrorMap.PrismaClientUnknownRequestError(error);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return PrismaErrorMap.PrismaClientInitializationError(error);
  }
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return PrismaErrorMap.PrismaClientRustPanicError(error);
  }

  // Default fallback for unknown errors
  return { code: 1999, message: 'An unexpected server error occurred.' };
}
