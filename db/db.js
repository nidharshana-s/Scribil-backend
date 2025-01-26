const mongoose = require('mongoose');

const db = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Db Connected');
    } catch (err) {
        console.error('DB Connection Error:', err.message); // Enhanced error logging
    }
}

module.exports = { db };


// backend 8000
// frontend http://localhost:5173/