import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: process.env.SWAGGER_TITLE || 'OneHealth API',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation for OneHealth platform',
    contact: {
      name: 'OneHealth Support',
      email: 'support@onehealth.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in the format: Bearer <token>',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          status: {
            type: 'number',
            description: 'HTTP status code',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
          },
          username: {
            type: 'string',
            description: 'Username',
          },
          emailId: {
            type: 'string',
            format: 'email',
            description: 'Email address',
          },
          mobileNumber: {
            type: 'string',
            description: 'Mobile number',
          },
          fullName: {
            type: 'string',
            description: 'Full name',
          },
          emailVerified: {
            type: 'boolean',
            description: 'Email verification status',
          },
          mobileValidationStatus: {
            type: 'boolean',
            description: 'Mobile verification status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
          expiresIn: {
            type: 'number',
            description: 'Token expiry in seconds',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and registration endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Roles',
      description: 'Role management endpoints',
    },
    {
      name: 'Menu',
      description: 'Menu management endpoints',
    },
    {
      name: 'Patients',
      description: 'Patient management endpoints for humans, pets, and livestock',
    },
    {
      name: 'Visits',
      description: 'Patient visit management endpoints including diagnoses, prescriptions, and lab orders',
    },
    {
      name: 'Clinics',
      description: 'Clinic management endpoints for healthcare facilities',
    },
    {
      name: 'Master Data',
      description: 'Master data management endpoints for diseases, patient types, and reference data',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/modules/**/*.controller.ts',
    './src/common/**/*.controller.ts',
    './src/modules/**/*.routes.ts',
    './src/common/**/*.routes.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OneHealth API Documentation',
  customfavIcon: '/assets/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
  },
};

export { swaggerUi };