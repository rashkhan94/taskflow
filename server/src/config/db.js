import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seed } from '../seed.js';

const connectDB = async () => {
  try {
    // Try connecting to local MongoDB first
    const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

    try {
      console.log(`Attempting to connect to Local MongoDB at ${localUri}...`);
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.log('⚠️  Local MongoDB connection failed:', err.message);
      console.log('🔄 Starting In-Memory MongoDB fallback (Temporary Database)...');
    }

    // Fallback to In-Memory DB
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    console.log(`📦 In-Memory MongoDB started at ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);

    // Seed the in-memory database
    console.log('🌱 Seeding in-memory database with demo data...');
    await seed(false); // false = don't exit process
    console.log('✨ Database ready!');

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
