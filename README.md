# OneHealth API

A comprehensive healthcare management system API built with Node.js + Express + TypeScript, using Prisma ORM with PostgreSQL.

## Features

- **Type-safe**: Full TypeScript implementation with comprehensive type definitions
- **Database**: Prisma ORM with PostgreSQL for robust data management
- **Validation**: Joi validation middleware for all endpoints
- **Authentication**: JWT-based authentication with role-based access control
- **Architecture**: Clean MVC architecture with proper separation of concerns
- **Documentation**: Complete Swagger/OpenAPI documentation
- **Security**: bcrypt password hashing, request validation, and secure headers
- **Caching**: Redis for session management and performance optimization
- **Docker**: Production-ready containerization
- **Testing**: Comprehensive test scripts for all endpoints

## Healthcare Modules

- **Patient Management**: Complete patient registration and profile management
- **Visit Management**: Patient visits with vitals, diagnoses, and prescriptions
- **Doctor Management**: Healthcare provider registration with address support
- **Staff Management**: Administrative user creation with automatic Person records
- **Clinic Management**: Multi-tenant clinic administration
- **Role-Based Access**: Granular permissions for different user types
- **Menu Management**: Dynamic navigation and feature access control

## Quick Start

```bash
# Install dependencies
make install

# Set up database
npx prisma db push
npx prisma generate

# Create super admin user
npm run create-super-admin

# Start development server
make dev
```

## Docker Deployment

```bash
# Build and run with Docker Compose
make build
docker-compose up -d
```

## API Documentation

Visit Swagger documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Key Endpoints

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration

#### Patient Management
- `POST /patients` - Create patient
- `GET /patients` - List patients with pagination
- `POST /patients/visits` - Create patient visit
- `POST /patients/visits/details` - Add diagnoses and prescriptions to visit

#### Doctor Management
- `POST /clinics/doctors` - Create doctor with address

#### Staff Management
- `POST /users` - Create staff user (automatically creates Person record for STAFF role)

#### Visit Workflow
1. Create visit: `POST /patients/visits`
2. Add medical details: `POST /patients/visits/details`

## Test Scripts

- `./test-api.sh` - General API testing
- `./test-patient-creation.sh` - Patient creation workflow
- `./test-visit-details.sh` - Visit details API testing

## Environment Setup

Create `.env` file with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/onehealth"
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=3000
```

## Project Structure

```
src/
├── modules/           # Feature modules (MVC pattern)
│   ├── auth/         # Authentication
│   ├── clinic/       # Clinic and doctor management
│   ├── patient/      # Patient and visit management
│   ├── user/         # User and staff management
│   └── role/         # Role and permissions
├── common/           # Shared utilities and services
├── middlewares/      # Express middlewares
├── utils/            # Helper functions
└── routes/           # Route definitions
```

## Development

### Creating New Modules

Use Plop generator for consistent code structure:
```bash
npm run plop
```

### Database Changes

```bash
# Update schema
npx prisma db push

# Generate client
npx prisma generate

# View data
npx prisma studio
```

## Medical Data Handling

- **Diagnoses**: ICD-10 codes with SNOMED CT support
- **Prescriptions**: Structured medication data with dosage information
- **Vitals**: JSON-based vital signs storage
- **Visit Notes**: Rich text support for clinical notes

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Role-based access control
- Request rate limiting
- Secure headers and CORS

## Performance

- Redis caching for sessions
- Database indexing for fast queries
- Pagination for large datasets
- Connection pooling
- Response compression

## Contributing

1. Follow the existing MVC pattern
2. Add comprehensive Joi validation
3. Include Swagger documentation
4. Write test scripts for new endpoints
5. Maintain type safety throughout

## License

MIT License
