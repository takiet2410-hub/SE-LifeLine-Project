# Quickstart Validation Guide

## Prerequisites
1. Ensure MongoDB is running locally or provide a valid connection string.
2. Define a `.env` file in `src/backend-core/` with `MONGODB_URI`, `JWT_SECRET`, and `BREVO_API_KEY`.

## Setup
1. `cd src/backend-core`
2. Install dependencies: `npm install`
3. Run the application: `npm run dev`

## Validation Scenarios
Once the backend is running, you can test the REST APIs via Postman, cURL, or the interactive Swagger UI (`http://localhost:3000/api-docs`).

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
-H "Content-Type: application/json" \
-d '{"fullName":"John Doe","dateOfBirth":"1990-01-01","idDocumentNumber":"012345678912","email":"test@example.com","password":"Password123!"}'
```
*Expected: 201 Created*

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
-H "Content-Type: application/json" \
-d '{"idDocumentNumber":"012345678912","password":"Password123!"}'
```
*Expected: 200 OK with `accessToken`.*

### 3. Update Profile (Protected)
```bash
curl -X PATCH http://localhost:3000/api/v1/users/profile \
-H "Authorization: Bearer <your_access_token>" \
-H "Content-Type: application/json" \
-d '{"phoneNumber":"0987654321","address":"123 Main St"}'
```
*Expected: 200 OK with the updated contact fields.*
