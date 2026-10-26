import mongoose from "mongoose";

export async function connectToDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) return false;

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return true;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
