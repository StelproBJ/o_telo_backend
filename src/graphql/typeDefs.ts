export const typeDefs = `#graphql
  scalar DateTime

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum Role {
    USER
    ADMIN
  }

  enum PriceRange {
    LOW
    MID
    HIGH
  }

  enum HotelStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type User {
    id: ID!
    firebaseUid: String!
    email: String!
    phoneNumber: String
    username: String!
    firstName: String!
    lastName: String!
    gender: Gender
    birthDate: String
    role: Role!
    warningCount: Int!
    resetCount: Int!
    isSuspended: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Hotel {
    id: ID!
    name: String!
    description: String
    address: String
    latitude: Float!
    longitude: Float!
    distance: Float
    priceRange: PriceRange
    minPrice: Int
    status: HotelStatus!
    rejectionCount: Int!
    rejectionReason: String
    locked: Boolean!
    phoneContact: String
    emailContact: String
    websiteLink: String
    whatsappLink: String
    images: [String!]
    videos: [String!]
    roomPrices: [RoomPrice!]
    avgRating: Float
    reviewCount: Int!
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RoomPrice {
    id: ID!
    hotelId: ID!
    roomType: String!
    price: Int!
    image: String
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Review {
    id: ID!
    hotel: Hotel!
    user: User!
    rating: Int!
    comment: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    me: User!
    hotels(
      filters: HotelFiltersInput
      location: LocationInput
    ): [Hotel!]!
    hotel(id: ID!): Hotel!
    pendingHotels: [Hotel!]!
    hotelReviews(
      hotelId: ID!
      limit: Int
      offset: Int
    ): [Review!]!
    myReviewForHotel(hotelId: ID!): Review
    
    # Notifications
    myNotifications(limit: Int): [Notification!]!
    unreadNotificationsCount: Int!
    
    # Admin Queries
    adminStats: AdminStats!
    adminAllHotels: [Hotel!]!
    adminAllUsers: [User!]!
    adminLogs(limit: Int): [AdminLog!]!
  }

  type Mutation {
    signupUser(input: SignupUserInput!): User!
    
    addHotel(input: AddHotelInput!): Hotel!
    updateHotel(id: ID!, input: UpdateHotelInput!): Hotel!
    approveHotel(id: ID!): Hotel!
    rejectHotel(id: ID!, reason: String!): Hotel!
    
    addOrUpdateReview(input: AddReviewInput!): Review!
    deleteReview(id: ID!): Boolean!
    
    # Notifications
    markNotificationAsRead(id: ID!): Boolean!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
    
    # Admin Mutations
    verifyAdminPassword(password: String!): AdminPasswordVerification!
    adminApproveHotel(hotelId: ID!): Hotel!
    adminRejectHotel(hotelId: ID!, reason: String!): Hotel!
    adminResetUserWarnings(userId: ID!): User!
    adminUnlockHotel(hotelId: ID!): Hotel!
  }

  input SignupUserInput {
    firebaseUid: String!
    email: String!
    phoneNumber: String
    username: String!
    firstName: String!
    lastName: String!
    gender: Gender
    birthDate: String
  }

  input AddHotelInput {
    name: String!
    description: String
    address: String
    latitude: Float!
    longitude: Float!
    priceRange: PriceRange
    minPrice: Int
    phoneContact: String
    emailContact: String
    websiteLink: String
    whatsappLink: String
    images: [String!]
    videos: [String!]
    roomPrices: [RoomPriceInput!]
  }

  input RoomPriceInput {
    roomType: String!
    price: Int!
    image: String
    description: String
  }

  input UpdateHotelInput {
    name: String
    description: String
    address: String
    latitude: Float
    longitude: Float
    priceRange: PriceRange
    minPrice: Int
    phoneContact: String
    emailContact: String
    websiteLink: String
    whatsappLink: String
    images: [String!]
    videos: [String!]
  }

  input AddReviewInput {
    hotelId: ID!
    rating: Int!
    comment: String
  }

  input HotelFiltersInput {
    priceRange: PriceRange
    minRating: Float
    search: String
    limit: Int
    offset: Int
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  # ===== ADMIN TYPES =====

  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    message: String!
    isRead: Boolean!
    createdAt: DateTime!
  }

  enum NotificationType {
    REJECTION
    WARNING
    SUSPENSION
    INFO
  }

  type AdminLog {
    id: ID!
    adminId: ID!
    admin: User!
    action: String!
    targetUserId: ID
    targetUser: User
    targetHotelId: ID
    targetHotel: Hotel
    details: String
    createdAt: DateTime!
  }

  type AdminStats {
    pendingHotels: Int!
    suspendedUsers: Int!
    lockedSubmissions: Int!
    totalHotels: Int!
    totalUsers: Int!
  }

  type AdminPasswordVerification {
    success: Boolean!
    message: String
  }
`;