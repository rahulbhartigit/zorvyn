# Zorvyn API

Zorvyn is a modern backend API built with Node.js, Express, and TypeScript. It features a robust architecture utilizing Prisma as an ORM with PostgreSQL, JWT-based authentication, and Zod for input validation.

## Features

- **Built with TypeScript**: For strong typing and better developer experience.
- **Express.js API**: Fast, unopinionated, minimalist web framework for Node.js.
- **Database ORM**: Prisma Client for safe and intuitive database access.
- **PostgreSQL**: Robust, open-source relational database.
- **Authentication**: JWT authentication and bcrypt password hashing.
- **Role-Based Access Control (RBAC)**: Secure access control based on user roles and permissions.
- **Input Validation**: Strongly typed validation using Zod schemas.
- **API Documentation**: OpenAPI (Swagger) integration for easy discovery of API endpoints.
- **Testing**: Jest for reliable automated testing.
- **Docker Support**: Containerized environment for consistent builds and deployments.
- **CI/CD Pipeline**: GitHub Actions integration for automated testing, Docker builds, and EC2 deployment.

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL
- npm or yarn

## Getting Started

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory and add the necessary environment variables based on the project requirements. Important variables typically include:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zorvyn?schema=public"
ACCESS_SECRET="your_access_secret"
REFRESH_SECRET="your_refresh_secret"
PORT=3000
```

### 3. Database Setup

Run Prisma migrations to set up your database schema, and then seed the database with initial required data (e.g., roles and permissions).

```bash
npx prisma migrate dev
npm run build
```
Note: You can seed the database running:
```bash
npx tsx prisma/seed.ts
```

### 4. Running the Application

You can execute the TypeScript application in development environments using `tsx` or standard `ts-node`. For example:

```bash
npx tsx src/index.ts
```

### 5. Running Tests

The project utilizes Jest for testing. You can run the test suite with:

```bash
npm run test
```

### 6. Using Docker

You can also build and run the application using Docker:

```bash
# Build the Docker image
docker build -t zorvyn .

# Run the container (ensure your .env variables match your local setup or pass them directly)
docker run -p 3000:3000 --env-file .env zorvyn
```

## CI/CD Pipeline

The project uses GitHub Actions (`.github/workflows/ci.yml`) for Continuous Integration and Deployment on pushes to the `master` branch. The pipeline consists of:

1. **Test Job**: Provisions a PostgreSQL service in CI, applies database migrations, and executes the Jest test suite to ensure code health.
2. **Build Job**: Builds the application into a Docker image and pushes it to Docker Hub.
3. **Deploy Job**: Connects to the production EC2 instance via SSH, pulls the latest image, and restarts the running container.

## Project Structure

- `src/`: Application source code
  - `controllers/`: Handles incoming HTTP requests and returns responses
  - `services/`: Contains the core business logic of the application
  - `routes/`: Defines API routes and applies middleware
  - `middleware/`: Express middleware functions (auth, validation, etc.)
  - `config/`: Configuration files and environment variable setup
  - `utils/`: Helper functions and utilities
  - `zod/` & `validators/`: Zod schemas for request validation
- `prisma/`: Prisma schema and seeding scripts
- `tests/`: Jest test files
- `openapi.yaml`: Swagger definitions for API endpoints

## API Documentation

The API endpoints are documented using OpenAPI/Swagger. Once the application is running, the Swagger UI is typically exposed locally (e.g., at `/docs`).

## License

ISC
