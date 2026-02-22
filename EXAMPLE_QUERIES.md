# Example GraphQL Queries and Mutations

This file contains ready-to-use GraphQL operations for the Ô Télo API.

## Authentication

All authenticated requests must include the Firebase ID token in headers:

```json
{
  "Authorization": "Bearer <your-firebase-id-token>"
}
```

---

## Queries

### 1. Get Current User

```graphql
query GetCurrentUser {
  me {
    id
    username
    firstName
    lastName
    phoneNumber
    gender
    birthDate
    role
    createdAt
  }
}
```

### 2. Get All Hotels (with filters and location)

```graphql
query GetHotels {
  hotels(
    filters: {
      priceRange: MID
      minRating: 3.5
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
    description
    latitude
    longitude
    distance
    priceRange
    status
    phoneContact
    emailContact
    websiteLink
    whatsappLink
    images
    videos
    avgRating
    reviewCount
    creator {
      id
      username
      firstName
      lastName
    }
    createdAt
    updatedAt
  }
}
```

### 3. Get Hotels Without Filters (All Approved Hotels)

```graphql
query GetAllHotels {
  hotels {
    id
    name
    latitude
    longitude
    priceRange
    avgRating
    reviewCount
    images
  }
}
```

### 4. Get Nearby Hotels (Sorted by Distance)

```graphql
query GetNearbyHotels($lat: Float!, $lon: Float!) {
  hotels(
    location: { latitude: $lat, longitude: $lon }
    filters: { limit: 10 }
  ) {
    id
    name
    distance
    avgRating
    images
    phoneContact
  }
}
```

**Variables:**
```json
{
  "lat": -4.2634,
  "lon": 15.2429
}
```

### 5. Get Single Hotel Details

```graphql
query GetHotel($hotelId: ID!) {
  hotel(id: $hotelId) {
    id
    name
    description
    latitude
    longitude
    priceRange
    status
    phoneContact
    emailContact
    websiteLink
    whatsappLink
    images
    videos
    avgRating
    reviewCount
    creator {
      id
      username
      firstName
      lastName
    }
    rejectionReason
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here"
}
```

### 6. Get Pending Hotels (Admin Only)

```graphql
query GetPendingHotels {
  pendingHotels {
    id
    name
    description
    latitude
    longitude
    priceRange
    status
    creator {
      username
      firstName
      lastName
      phoneNumber
    }
    createdAt
  }
}
```

### 7. Get Hotel Reviews

```graphql
query GetHotelReviews($hotelId: ID!, $limit: Int, $offset: Int) {
  hotelReviews(hotelId: $hotelId, limit: $limit, offset: $offset) {
    id
    rating
    comment
    user {
      id
      username
      firstName
      lastName
    }
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here",
  "limit": 10,
  "offset": 0
}
```

### 8. Get My Review for a Hotel

```graphql
query GetMyReview($hotelId: ID!) {
  myReviewForHotel(hotelId: $hotelId) {
    id
    rating
    comment
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here"
}
```

---

## Mutations

### 1. Sign Up User

```graphql
mutation SignUpUser($input: SignupUserInput!) {
  signupUser(input: $input) {
    id
    username
    firstName
    lastName
    phoneNumber
    role
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "firebaseUid": "firebase-uid-from-phone-auth",
    "phoneNumber": "+242064123456",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "gender": "MALE",
    "birthDate": "1990-01-15T00:00:00Z"
  }
}
```

**Without optional fields:**
```json
{
  "input": {
    "firebaseUid": "firebase-uid-from-phone-auth",
    "phoneNumber": "+242064123456",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Add Hotel

```graphql
mutation AddHotel($input: AddHotelInput!) {
  addHotel(input: $input) {
    id
    name
    status
    createdAt
  }
}
```

**Variables (Full):**
```json
{
  "input": {
    "name": "Grand Hotel Brazzaville",
    "description": "Luxurious 5-star hotel in the heart of Brazzaville with stunning views of the Congo River.",
    "latitude": -4.2634,
    "longitude": 15.2429,
    "priceRange": "HIGH",
    "phoneContact": "+242064123456",
    "emailContact": "info@grandhotelbrazza.com",
    "websiteLink": "https://grandhotelbrazza.com",
    "whatsappLink": "https://wa.me/242064123456",
    "images": [
      "https://firebasestorage.googleapis.com/v0/b/project/o/hotels/hotel1/image1.jpg",
      "https://firebasestorage.googleapis.com/v0/b/project/o/hotels/hotel1/image2.jpg"
    ],
    "videos": [
      "https://firebasestorage.googleapis.com/v0/b/project/o/hotels/hotel1/video1.mp4"
    ]
  }
}
```

**Variables (Minimal):**
```json
{
  "input": {
    "name": "Hotel Simple",
    "latitude": -4.2634,
    "longitude": 15.2429
  }
}
```

### 3. Update Hotel

```graphql
mutation UpdateHotel($hotelId: ID!, $input: UpdateHotelInput!) {
  updateHotel(id: $hotelId, input: $input) {
    id
    name
    status
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here",
  "input": {
    "description": "Updated description with new amenities",
    "phoneContact": "+242064999999",
    "images": [
      "https://firebasestorage.googleapis.com/v0/b/project/o/hotels/hotel1/new_image.jpg"
    ]
  }
}
```

### 4. Approve Hotel (Admin Only)

```graphql
mutation ApproveHotel($hotelId: ID!) {
  approveHotel(id: $hotelId) {
    id
    name
    status
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here"
}
```

### 5. Reject Hotel (Admin Only)

```graphql
mutation RejectHotel($hotelId: ID!, $reason: String!) {
  rejectHotel(id: $hotelId, reason: $reason) {
    id
    name
    status
    rejectionReason
    updatedAt
  }
}
```

**Variables:**
```json
{
  "hotelId": "uuid-here",
  "reason": "Missing contact information and proper images. Please update and resubmit."
}
```

### 6. Add or Update Review

```graphql
mutation AddOrUpdateReview($input: AddReviewInput!) {
  addOrUpdateReview(input: $input) {
    id
    rating
    comment
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "hotelId": "uuid-here",
    "rating": 5,
    "comment": "Excellent service! The staff was very friendly and the rooms were spotless. Highly recommended!"
  }
}
```

**Without comment:**
```json
{
  "input": {
    "hotelId": "uuid-here",
    "rating": 4
  }
}
```

### 7. Delete Review

```graphql
mutation DeleteReview($reviewId: ID!) {
  deleteReview(id: $reviewId)
}
```

**Variables:**
```json
{
  "reviewId": "uuid-here"
}
```

---

## Complex Queries

### Get Hotels with All Related Data

```graphql
query GetCompleteHotelData($hotelId: ID!) {
  hotel(id: $hotelId) {
    id
    name
    description
    latitude
    longitude
    priceRange
    status
    phoneContact
    emailContact
    websiteLink
    whatsappLink
    images
    videos
    avgRating
    reviewCount
    creator {
      id
      username
      firstName
      lastName
    }
    createdAt
    updatedAt
  }
  
  hotelReviews(hotelId: $hotelId, limit: 5) {
    id
    rating
    comment
    user {
      username
      firstName
    }
    createdAt
  }
  
  myReviewForHotel(hotelId: $hotelId) {
    id
    rating
    comment
  }
}
```

### Search Hotels by Name Near Location

```graphql
query SearchHotelsNearby($search: String!, $lat: Float!, $lon: Float!) {
  hotels(
    filters: {
      search: $search
      limit: 20
    }
    location: {
      latitude: $lat
      longitude: $lon
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

**Variables:**
```json
{
  "search": "Radisson",
  "lat": -4.2634,
  "lon": 15.2429
}
```

### Filter by Price and Rating

```graphql
query FilterHotels {
  lowBudget: hotels(
    filters: {
      priceRange: LOW
      minRating: 3.0
      limit: 10
    }
  ) {
    id
    name
    priceRange
    avgRating
  }
  
  luxury: hotels(
    filters: {
      priceRange: HIGH
      minRating: 4.5
      limit: 10
    }
  ) {
    id
    name
    priceRange
    avgRating
  }
}
```

---

## Error Handling Examples

### Invalid Authentication

```graphql
query {
  me {
    id
  }
}
```

**Response (if no token provided):**
```json
{
  "errors": [
    {
      "message": "You must be authenticated to perform this action",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Duplicate Username

```graphql
mutation {
  signupUser(input: {
    firebaseUid: "uid123"
    phoneNumber: "+242064123456"
    username: "existinguser"
    firstName: "John"
    lastName: "Doe"
  }) {
    id
  }
}
```

**Response:**
```json
{
  "errors": [
    {
      "message": "Username already taken",
      "extensions": {
        "code": "BAD_USER_INPUT"
      }
    }
  ]
}
```

### Admin-Only Operation (Non-Admin User)

```graphql
mutation {
  approveHotel(id: "hotel-uuid") {
    id
  }
}
```

**Response:**
```json
{
  "errors": [
    {
      "message": "You must be an admin to perform this action",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

---

## Testing Workflow

### 1. Create User
```graphql
mutation {
  signupUser(input: {
    firebaseUid: "test-uid"
    phoneNumber: "+242064123456"
    username: "testuser"
    firstName: "Test"
    lastName: "User"
  }) {
    id
    role
  }
}
```

### 2. Add Hotel
```graphql
mutation {
  addHotel(input: {
    name: "Test Hotel"
    latitude: -4.2634
    longitude: 15.2429
    priceRange: MID
  }) {
    id
    status
  }
}
```

### 3. View Pending Hotels (as Admin)
```graphql
query {
  pendingHotels {
    id
    name
    status
  }
}
```

### 4. Approve Hotel (as Admin)
```graphql
mutation {
  approveHotel(id: "hotel-id-from-step-2") {
    id
    status
  }
}
```

### 5. Add Review
```graphql
mutation {
  addOrUpdateReview(input: {
    hotelId: "hotel-id-from-step-2"
    rating: 5
    comment: "Great place!"
  }) {
    id
  }
}
```

### 6. View Hotel with Reviews
```graphql
query {
  hotel(id: "hotel-id-from-step-2") {
    name
    avgRating
    reviewCount
  }
  hotelReviews(hotelId: "hotel-id-from-step-2") {
    rating
    comment
    user {
      username
    }
  }
}
```