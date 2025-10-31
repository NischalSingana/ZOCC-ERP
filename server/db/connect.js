import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n📋 Check your connection string format:');
    console.error('   Local MongoDB: mongodb://localhost:27017/zocc_erp');
    console.error('   With auth: mongodb://username:password@localhost:27017/zocc_erp');
    console.error('   Atlas: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zocc_erp');
    process.exit(1);
  }
};

export default connectDB;

