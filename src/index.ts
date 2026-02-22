import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ApolloServer } from '@apollo/server';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import * as dotenv from 'dotenv';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { authenticateUser, AuthContext } from './middleware/auth';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  // Create Fastify instance
  const app = Fastify({
    logger: true
  });

  // 🔑 Register CORS plugin BEFORE Apollo
  await app.register(cors, {
    origin: true, 
    credentials: true,              
  });

  // Create Apollo Server
  const apollo = new ApolloServer<AuthContext>({
    typeDefs,
    resolvers,
    plugins: [fastifyApolloDrainPlugin(app)],
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    }
  });

  await apollo.start();

  // Register Apollo middleware
  await app.register(fastifyApollo(apollo), {
    context: async (request) => {
      const authHeader = request.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : undefined;

      const authContext = await authenticateUser(token);
      return authContext;
    }
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start server
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
