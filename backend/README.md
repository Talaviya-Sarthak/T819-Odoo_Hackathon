# Backend

## Installation

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment Configuration

Edit `.env` and configure the following:

### Database
- `DATABASE_URL` - Your database connection string

### JWT
- `JWT_ACCESS_SECRET` - Random string for signing access tokens
- `JWT_REFRESH_SECRET` - Random string for signing refresh tokens

### Email (SMTP)
- `SMTP_HOST` - Your SMTP server host
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - Sender email address

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set callback URL to `http://localhost:5000/api/auth/google/callback`
4. Copy Client ID and Client Secret to `.env`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## API Endpoints

```
POST /api/auth/register       - Register new user
POST /api/auth/verify-email    - Verify email with OTP
POST /api/auth/resend-otp      - Resend verification OTP
POST /api/auth/login           - Login
POST /api/auth/refresh         - Refresh tokens
POST /api/auth/logout          - Logout
GET  /api/auth/me              - Get current user
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Reset password

GET  /api/health               - Health check
GET  /api/auth/google           - Google OAuth login
GET  /api/auth/google/callback  - Google OAuth callback
GET  /api/auth/github           - GitHub OAuth login
GET  /api/auth/github/callback  - GitHub OAuth callback
```
