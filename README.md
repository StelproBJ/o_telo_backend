# Ô Télo Backend

Backend GraphQL API for Ô Télo - A PWA/mobile app for discovering hotels in Brazzaville with an interactive map.

## 🏗️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **API**: GraphQL (Apollo Server + Fastify)
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Firebase Phone Auth
- **Media Storage**: Firebase Storage
- **Validation**: Zod

## 📋 Features

- ✅ Firebase phone authentication
- ✅ User management with roles (USER, ADMIN)
- ✅ Hotel CRUD operations
- ✅ Admin moderation workflow (approve/reject hotels)
- ✅ Review system (one review per user per hotel)
- ✅ Proximity-based hotel search
- ✅ Advanced filtering (price range, rating, name search)
- ✅ Admin notifications
- ✅ Pagination support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Firebase project with Phone Auth enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd o-telo-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Server
PORT=4000
NODE_ENV=development
```

4. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:4000/graphql`

## 📊 Database Schema

### Users
- Personal information (name, phone, username, gender, birth date)
- Firebase UID for authentication
- Role (USER or ADMIN)

### Hotels
- Basic information (name, description, location coordinates)
- Contact details (phone, email, website, WhatsApp)
- Media (images and videos arrays)
- Price range (LOW, MID, HIGH)
- Status (PENDING, APPROVED, REJECTED)
- Creator reference

### Reviews
- Rating (1-5 stars)
- Comment
- Unique constraint: one review per user per hotel

### Admin Notifications
- Track hotel additions and updates
- Read/unread status

## 🔐 Authentication

### User Signup Flow

1. User fills personal information in the app
2. User verifies phone number via Firebase SMS OTP
3. App sends signup mutation with Firebase UID
4. Backend creates user in PostgreSQL

### Subsequent Requests

Include Firebase ID token in Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## 📝 GraphQL API

### Queries

#### `me: User!`
Get current authenticated user information.

**Example:**
```graphql
query {
  me {
    id
    username
    firstName
    lastName
    role
  }
}
```

#### `hotels(filters: HotelFiltersInput, location: LocationInput): [Hotel!]!`
Get list of hotels with optional filtering and proximity sorting.

**Example:**
```graphql
query {
  hotels(
    filters: {
      priceRange: MID
      minRating: 4.0
      search: "Grand"
      limit: 20
      offset: 0
    }
    location: {
      latitude: -4.2634
      longitude: 15.2429
    }
  ) {
    id
    name
    distance
    avgRating
    reviewCount
    priceRange
    images
  }
}
```

#### `hotel(id: ID!): Hotel!`
Get detailed information about a specific hotel.

**Example:**
```graphql
query {
  hotel(id: "hotel-uuid") {
    id
    name
    description
    latitude
    longitude
    priceRange
    phoneContact
    emailContact
    websiteLink
    images
    videos
    avgRating
    reviewCount
    status
    creator {
      username
      firstName
    }
  }
}
```

#### `pendingHotels: [Hotel!]!` (Admin only)
Get all hotels pending approval.

**Example:**
```graphql
query {
  pendingHotels {
    id
    name
    status
    creator {
      username
    }
    createdAt
  }
}
```

#### `hotelReviews(hotelId: ID!, limit: Int, offset: Int): [Review!]!`
Get reviews for a specific hotel.

**Example:**
```graphql
query {
  hotelReviews(hotelId: "hotel-uuid", limit: 10, offset: 0) {
    id
    rating
    comment
    user {
      username
      firstName
    }
    createdAt
  }
}
```

#### `myReviewForHotel(hotelId: ID!): Review`
Get current user's review for a hotel (if exists).

### Mutations

#### `signupUser(input: SignupUserInput!): User!`
Create a new user account after Firebase phone verification.

**Example:**
```graphql
mutation {
  signupUser(input: {
    firebaseUid: "firebase-uid"
    phoneNumber: "+242064123456"
    username: "johndoe"
    firstName: "John"
    lastName: "Doe"
    gender: MALE
    birthDate: "1990-01-01T00:00:00Z"
  }) {
    id
    username
    role
  }
}
```

#### `addHotel(input: AddHotelInput!): Hotel!`
Add a new hotel (requires authentication).

**Example:**
```graphql
mutation {
  addHotel(input: {
    name: "Grand Hotel Brazzaville"
    description: "Luxurious hotel in the heart of the city"
    latitude: -4.2634
    longitude: 15.2429
    priceRange: HIGH
    phoneContact: "+242064123456"
    emailContact: "contact@grandhotel.com"
    websiteLink: "https://grandhotel.com"
    images: ["https://storage.firebase.com/image1.jpg"]
  }) {
    id
    name
    status
  }
}
```

#### `updateHotel(id: ID!, input: UpdateHotelInput!): Hotel!`
Update hotel information (creator or admin only).

**Example:**
```graphql
mutation {
  updateHotel(
    id: "hotel-uuid"
    input: {
      description: "Updated description"
      phoneContact: "+242064999999"
    }
  ) {
    id
    name
    status
  }
}
```

#### `approveHotel(id: ID!): Hotel!` (Admin only)
Approve a pending hotel.

**Example:**
```graphql
mutation {
  approveHotel(id: "hotel-uuid") {
    id
    name
    status
  }
}
```

#### `rejectHotel(id: ID!, reason: String!): Hotel!` (Admin only)
Reject a hotel with a reason.

**Example:**
```graphql
mutation {
  rejectHotel(
    id: "hotel-uuid"
    reason: "Missing required information"
  ) {
    id
    name
    status
    rejectionReason
  }
}
```

#### `addOrUpdateReview(input: AddReviewInput!): Review!`
Add a new review or update existing review for a hotel.

**Example:**
```graphql
mutation {
  addOrUpdateReview(input: {
    hotelId: "hotel-uuid"
    rating: 5
    comment: "Excellent service and facilities!"
  }) {
    id
    rating
    comment
  }
}
```

#### `deleteReview(id: ID!): Boolean!`
Delete a review (owner or admin only).

## 🔒 Permissions

### USER Role
- ✅ Add new hotels (status: PENDING)
- ✅ Edit own hotels (only if not APPROVED)
- ✅ Add/update/delete own reviews
- ✅ View only APPROVED hotels
- ❌ Cannot see PENDING/REJECTED hotels
- ❌ Cannot approve/reject hotels

### ADMIN Role
- ✅ All USER permissions
- ✅ View all hotels (any status)
- ✅ Approve/reject hotels
- ✅ Edit any hotel
- ✅ Delete any review
- ✅ Receive notifications for new hotels

## 🏗️ Project Structure

```
o-telo-backend/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin SDK config
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM schema
│   │   └── client.ts             # Database client
│   ├── graphql/
│   │   ├── typeDefs.ts           # GraphQL schema
│   │   └── resolvers.ts          # GraphQL resolvers
│   ├── middleware/
│   │   └── auth.ts               # Authentication middleware
│   ├── services/
│   │   ├── auth.service.ts       # Auth business logic
│   │   ├── hotel.service.ts      # Hotel business logic
│   │   └── review.service.ts     # Review business logic
│   ├── utils/
│   │   ├── distance.ts           # Distance calculation
│   │   └── validation.ts         # Zod schemas
│   └── index.ts                  # Server entry point
├── drizzle.config.ts             # Drizzle configuration
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Testing

### Using GraphQL Playground

Navigate to `http://localhost:4000/graphql` to access the GraphQL Playground.

### Authentication in Playground

Add the following to HTTP Headers:
```json
{
  "Authorization": "Bearer <your-firebase-id-token>"
}
```

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🚀 Deployment

### Neon Database Setup

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Add to your `.env` file

### Firebase Setup

1. Go to Firebase Console
2. Create a new project
3. Enable Phone Authentication
4. Generate a service account key:
   - Project Settings > Service Accounts
   - Generate new private key
5. Copy credentials to `.env`

### Production Deployment

1. Build the project:
```bash
npm run build
```

2. Run migrations:
```bash
npm run db:migrate
```

3. Start the server:
```bash
npm start
```

Consider deploying to:
- Railway
- Render
- Fly.io
- AWS/GCP/Azure

## 🔧 Configuration

### Database Connection

The `DATABASE_URL` should include SSL mode for Neon:
```
postgresql://user:password@host/database?sslmode=require
```

### Firebase Private Key

The private key must be properly formatted with escaped newlines:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

## 📈 Future Enhancements

- [ ] Image upload endpoint for Firebase Storage
- [ ] Email notifications for admins
- [ ] User profile photo upload
- [ ] Hotel amenities and features
- [ ] Advanced search with multiple filters
- [ ] Favorites/bookmarks system
- [ ] Hotel availability calendar
- [ ] Real-time notifications with WebSockets
- [ ] Rate limiting and security hardening
- [ ] Comprehensive test suite
- [ ] API documentation with OpenAPI/Swagger

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Built with ❤️ for the Brazzaville community
- Powered by Neon, Firebase, and Apollo GraphQL