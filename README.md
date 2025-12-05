# HealthTrack Personal Wellness Platform

A personal health and wellness management platform built with Node.js and MySQL.

## Features

### Core Functionality
- User registration with Health ID, email, and phone
- Multiple email addresses per user with verification
- Healthcare provider management and linking
- Family group creation and management
- Appointment booking and management
- Wellness challenges creation and participation
- Invitation system with 15-day expiration
- Health metrics tracking and monthly reports
- Search functionality across all entities

### Database Features
- MySQL database with proper relationships
- Data validation and integrity constraints
- Support for verified/unverified entities
- Appointment cancellation with 24-hour rule
- Invitation expiration handling

## Project Structure

```
health-care/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── app.js          # Main application
├── database.sql        # Database schema and sample data
├── .env               # Environment variables
├── package.json       # Dependencies
└── README.md         # This file
```

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd health-care
npm install
```

### 2. Database Setup
```bash
# Using the provided MySQL root password (123456)
mysql -u root -p123456 < database.sql
```

### 3. Environment Configuration
Create a `.env` file (already provided) with:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=healthtrack
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

Detailed API documentation is available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Sample Data

The database includes sample data for:
- 3 users with different verification statuses
- 3 healthcare providers
- 2 appointments
- 2 wellness challenges
- 1 family group
- Health metrics for testing reports

## Testing the Application

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/health
```

### 2. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "health_id": "HT004",
    "name": "Test User",
    "phone": "+15551234567",
    "password": "Password123",
    "email": "test@example.com"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "HT004",
    "password": "Password123"
  }'
```

Save the returned token for authenticated requests.

### 4. Create an Appointment (using sample provider ID 1)
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "provider_id": 1,
    "appointment_date": "2024-12-20",
    "appointment_time": "14:30:00",
    "consultation_type": "In-Person",
    "memo": "Test appointment"
  }'
```

## Project Requirements Implemented

✅ **User Registration**
- Unique Health ID (similar to SSN)
- Name, email, phone
- Multiple emails per user
- Email and phone verification support

✅ **Healthcare Providers**
- Unique medical license number
- Provider verification
- Link/unlink providers to users
- Primary care physician designation

✅ **Family Groups**
- Multiple users in family groups
- Permission management
- Relationship tracking

✅ **Appointments**
- Book with provider license or verified email
- Date, time, consultation type, memo
- Unique appointment IDs
- Cancellation up to 24 hours before
- Cancellation reason recording

✅ **Wellness Challenges**
- Create challenges with goals
- Start/end dates
- Unique challenge IDs
- Participant progress tracking

✅ **Invitation System**
- Send to email or phone
- 15-day expiration
- Accept by signing up
- Track initiation and completion dates

✅ **Health Data & Reports**
- Monthly summary reports
- Search functionality
- Health metrics tracking

## Assumptions Made

1. **Verification Process**: The verification process itself is outside the scope (as specified). The system records verification status but doesn't implement the actual verification mechanism.

2. **Password Requirements**: Minimum 8 characters with uppercase, lowercase, and number.

3. **Phone Number Format**: Basic international format validation.

4. **Health ID Format**: Alphanumeric, 3-50 characters.

5. **Time Zones**: All times are stored in server local time (UTC).

6. **Email Uniqueness**: Email addresses must be unique across all users.

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- CORS enabled for API access

## Future Enhancements

1. Email/SMS notification system
2. Real-time updates using WebSockets
3. File upload for medical documents
4. Advanced analytics and reporting
5. Mobile application
6. Integration with health devices
7. Two-factor authentication
8. Audit logging

## License

ISC