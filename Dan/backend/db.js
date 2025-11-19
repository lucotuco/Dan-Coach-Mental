// backend/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      // estas opciones ya no siempre son necesarias, pero no molestan:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1); // corta la app si no se puede conectar
  }
}

module.exports = connectDB;