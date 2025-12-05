# HealthTrack Personal Wellness Platform API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (protected)
- `POST /auth/emails` - Add email to user (protected)
- `PUT /auth/emails/:email_id/verify` - Verify email (protected)
- `PUT /auth/phone/verify` - Verify phone (protected)

### Providers
- `GET /providers` - Get all providers (public)
- `GET /providers/search?q=search_term` - Search providers (public)
- `GET /providers/:id` - Get provider by ID (public)
- `POST /providers` - Create new provider (protected)
- `PUT /providers/:id/verify` - Verify provider (protected)
- `POST /providers/link` - Link provider to user (protected)
- `DELETE /providers/unlink/:provider_id` - Unlink provider from user (protected)
- `GET /providers/user/mine` - Get user's providers (protected)
- `GET /providers/user/primary` - Get user's primary provider (protected)

### Appointments
- `POST /appointments` - Create new appointment (protected)
- `GET /appointments` - Get user's appointments (protected)
- `GET /appointments/stats` - Get appointment statistics (protected)
- `GET /appointments/search/date?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Search appointments by date range (protected)
- `GET /appointments/:id` - Get appointment by ID (protected)
- `PUT /appointments/:id/cancel` - Cancel appointment (protected)
- `GET /appointments/provider/:provider_id` - Get provider's appointments (protected)

### Wellness Challenges
- `GET /challenges/active` - Get active challenges (public)
- `GET /challenges/search?q=search_term` - Search challenges (public)
- `POST /challenges` - Create new challenge (protected)
- `GET /challenges` - Get user's challenges (protected)
- `GET /challenges/stats` - Get challenge statistics (protected)
- `GET /challenges/:id` - Get challenge by ID (protected)
- `POST /challenges/:id/join` - Join challenge (protected)
- `PUT /challenges/:id/progress` - Update progress (protected)
- `POST /challenges/:id/invite` - Invite to challenge (protected)

### Family Groups
- `POST /family` - Create new family group (protected)
- `GET /family` - Get user's family groups (protected)
- `GET /family/stats` - Get family statistics (protected)
- `GET /family/:id` - Get family group by ID (protected)
- `POST /family/:id/members` - Add member to family group (protected)
- `DELETE /family/:id/members/:user_id` - Remove member from family group (protected)
- `PUT /family/:id/members/:user_id` - Update member (protected)
- `POST /family/:id/invite` - Invite to family group (protected)
- `DELETE /family/:id` - Delete family group (protected)

### Invitations
- `GET /invitations` - Get sent invitations (protected)
- `GET /invitations/mine` - Get invitations for current user (protected)
- `GET /invitations/stats` - Get invitation statistics (protected)
- `POST /invitations` - Create invitation (protected)
- `GET /invitations/:uid` - Get invitation by UID (protected)
- `PUT /invitations/:uid/accept` - Accept invitation (protected)
- `DELETE /invitations/:id` - Cancel invitation (protected)

### Health Metrics
- `POST /health-metrics` - Add health metric (protected)
- `GET /health-metrics` - Get user's health metrics (protected)
- `GET /health-metrics/stats` - Get health metric statistics (protected)
- `GET /health-metrics/summary/monthly?year=YYYY&month=MM` - Get monthly summary (protected)
- `GET /health-metrics/latest?limit=10` - Get latest metrics (protected)
- `GET /health-metrics/search?q=search_term` - Search health metrics (protected)
- `GET /health-metrics/:id` - Get metric by ID (protected)
- `PUT /health-metrics/:id` - Update health metric (protected)
- `DELETE /health-metrics/:id` - Delete health metric (protected)

## Sample Data

### Sample Users
1. John Doe
   - Health ID: HT001
   - Phone: +1234567890 (verified)
   - Email: john.doe@example.com (verified, primary)
   - Password: Password123

2. Jane Smith
   - Health ID: HT002
   - Phone: +0987654321 (verified)
   - Email: jane.smith@example.com (verified, primary)
   - Password: Password123

3. Bob Johnson
   - Health ID: HT003
   - Phone: +1122334455 (not verified)
   - Email: bob.johnson@example.com (not verified, primary)
   - Password: Password123

### Sample Providers
1. Dr. Sarah Wilson
   - License: MD123456
   - Specialty: General Practitioner
   - Verified: Yes

2. Dr. Michael Chen
   - License: MD789012
   - Specialty: Cardiologist
   - Verified: Yes

3. Dr. Emily Brown
   - License: MD345678
   - Specialty: Nutritionist
   - Verified: No

## Quick Start

1. Start the server:
   ```bash
   npm run dev
   ```

2. Test database connection:
   ```bash
   curl http://localhost:3000/health
   ```

3. Register a user:
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

4. Login:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "identifier": "HT004",
       "password": "Password123"
     }'
   ```

5. Use the returned token for protected endpoints.