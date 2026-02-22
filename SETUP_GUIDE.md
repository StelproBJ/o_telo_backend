# Setup Guide for Ô Télo Backend

This guide will walk you through setting up the Ô Télo backend from scratch.

## Step 1: Prerequisites

Ensure you have the following installed:
- Node.js 18 or higher
- npm or yarn
- A code editor (VS Code recommended)

## Step 2: Database Setup (Neon PostgreSQL)

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Click "Create Project"
3. Choose a name for your project (e.g., "o-telo-production")
4. Select a region close to your users (Europe for Africa)
5. Click "Create Project"
6. Copy your connection string - it looks like:
   ```
   postgresql://username:password@ep-xxx.region.neon.tech/neondb?sslmode=require
   ```
7. Save this connection string - you'll need it for the `.env` file

## Step 3: Firebase Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: "o-telo"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 3.2 Enable Phone Authentication

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click "Phone" and enable it
5. Save

### 3.3 Generate Service Account Key

1. Go to Project Settings (gear icon) > Service Accounts
2. Click "Generate new private key"
3. Click "Generate key" - this downloads a JSON file
4. Open the JSON file and extract:
   - `project_id`
   - `private_key`
   - `client_email`
5. Keep this file secure - never commit it to Git!

### 3.4 Set up Firebase Storage (for images/videos)

1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Start in production mode (we'll add rules later)
4. Choose a location close to your users
5. Click "Done"

### 3.5 Storage Security Rules

Add these rules to Firebase Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /hotels/{hotelId}/{allPaths=**} {
      // Allow authenticated users to upload
      allow write: if request.auth != null;
      // Allow anyone to read
      allow read: if true;
    }
  }
}
```

## Step 4: Project Setup

1. Extract the project files:
```bash
cd o-telo-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```env
# From Neon
DATABASE_URL=postgresql://username:password@ep-xxx.region.neon.tech/neondb?sslmode=require

# From Firebase Service Account JSON
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Server Configuration
PORT=4000
NODE_ENV=development
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, copy the entire private key from the JSON file
- Keep the quotes around the key
- Make sure `\n` characters are preserved (they represent newlines)

## Step 5: Database Migration

1. Generate migration files:
```bash
npm run db:generate
```

2. Apply migrations to your database:
```bash
npm run db:migrate
```

This creates all the necessary tables in your Neon database.

## Step 6: Create First Admin User

Since the first user needs to be an admin, you'll need to:

1. Start the server:
```bash
npm run dev
```

2. Use the GraphQL playground at `http://localhost:4000/graphql`

3. First, authenticate with Firebase in your app and get the ID token

4. Create a user:
```graphql
mutation {
  signupUser(input: {
    firebaseUid: "your-firebase-uid"
    phoneNumber: "+242064123456"
    username: "admin"
    firstName: "Admin"
    lastName: "User"
  }) {
    id
    username
    role
  }
}
```

5. Manually update the user to admin in the database:
   - Go to [Neon Console](https://console.neon.tech)
   - Open SQL Editor
   - Run this query:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
   ```

## Step 7: Test the API

### Test Query (No Auth Required)
```graphql
query {
  hotels(location: { latitude: -4.2634, longitude: 15.2429 }) {
    id
    name
    status
  }
}
```

### Test Authenticated Query

1. Get your Firebase ID token from your frontend app
2. Add it to HTTP Headers in GraphQL Playground:
```json
{
  "Authorization": "Bearer YOUR_FIREBASE_ID_TOKEN"
}
```

3. Test the `me` query:
```graphql
query {
  me {
    id
    username
    role
  }
}
```

## Step 8: Deploy to Production

### Option A: Railway

1. Go to [Railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Add environment variables from `.env`
5. Deploy!

### Option B: Render

1. Go to [Render.com](https://render.com)
2. New > Web Service
3. Connect your repository
4. Build Command: `npm run build`
5. Start Command: `npm start`
6. Add environment variables
7. Create Web Service

### Option C: Fly.io

1. Install Fly CLI
2. Run `fly launch`
3. Set secrets: `fly secrets set DATABASE_URL=...`
4. Deploy: `fly deploy`

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"
- Check your `.env` file exists
- Verify the variable name is exactly `DATABASE_URL`

### Error: "Invalid authentication token"
- Verify Firebase credentials in `.env`
- Check the private key has proper `\n` characters
- Ensure token is passed as `Bearer TOKEN` in Authorization header

### Error: Connection timeout to database
- Check your IP is allowed in Neon (Settings > IP Allow)
- Verify connection string includes `?sslmode=require`

### Error: "User not found in database"
- Make sure you've created a user with `signupUser` mutation
- Verify the Firebase UID matches

## Next Steps

1. Test all mutations and queries
2. Set up your frontend to connect to the API
3. Configure CORS if needed for web clients
4. Set up monitoring and logging
5. Add rate limiting for production
6. Implement image upload endpoints for Firebase Storage

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Keep Firebase service account key secure
- [ ] Enable CORS only for your domains in production
- [ ] Add rate limiting
- [ ] Use HTTPS in production
- [ ] Regularly update dependencies
- [ ] Monitor logs for suspicious activity

## Support

If you encounter any issues, please check:
1. This setup guide
2. The main README.md
3. The example queries in EXAMPLE_QUERIES.md

For additional help, contact the development team.