import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://jessiemounika367:jessie123@cluster0.ufpruga.mongodb.net/citizen-reporting',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

