import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Import models to ensure they are registered
import '../modules/financial/categories/models/category.model';
import '../modules/financial/transactions/models/transaction.model';
import '../modules/users/user.model';

let mongod: MongoMemoryServer;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';

beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Update environment variable for tests
  process.env.MONGO_URI = uri;

  // Connect to test database
  await mongoose.connect(uri);

  // Create mock Account model if it doesn't exist
  if (!mongoose.models.Account) {
    const accountSchema = new mongoose.Schema({
      name: { type: String, required: true },
      type: { type: String, required: true },
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      isActive: { type: Boolean, default: true },
      isDeleted: { type: Boolean, default: false },
    }, { timestamps: true });
    
    mongoose.model('Account', accountSchema);
  }
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
