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
    phoneNumber: String!
    username: String!
    firstName: String!
    lastName: String!
    gender: Gender
    birthDate: DateTime
    role: Role!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Hotel {
    id: ID!
    name: String!
    description: String
    latitude: Float!
    longitude: Float!
    distance: Float
    priceRange: PriceRange
    status: HotelStatus!
    phoneContact: String
    emailContact: String
    websiteLink: String
    whatsappLink: String
    images: [String!]
    videos: [String!]
    avgRating: Float
    reviewCount: Int!
    creator: User!
    rejectionReason: String
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
  }

  type Mutation {
    signupUser(input: SignupUserInput!): User!
    
    addHotel(input: AddHotelInput!): Hotel!
    updateHotel(id: ID!, input: UpdateHotelInput!): Hotel!
    approveHotel(id: ID!): Hotel!
    rejectHotel(id: ID!, reason: String!): Hotel!
    
    addOrUpdateReview(input: AddReviewInput!): Review!
    deleteReview(id: ID!): Boolean!
  }

  input SignupUserInput {
    firebaseUid: String!
    phoneNumber: String!
    username: String!
    firstName: String!
    lastName: String!
    gender: Gender
    birthDate: DateTime
  }

  input AddHotelInput {
    name: String!
    description: String
    latitude: Float!
    longitude: Float!
    priceRange: PriceRange
    phoneContact: String
    emailContact: String
    websiteLink: String
    whatsappLink: String
    images: [String!]
    videos: [String!]
  }

  input UpdateHotelInput {
    name: String
    description: String
    latitude: Float
    longitude: Float
    priceRange: PriceRange
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
`;