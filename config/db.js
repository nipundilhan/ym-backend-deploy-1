// config/db.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://yngmndAdmin:yngmnd1234@yngmnddbcluster.kpjwbxj.mongodb.net/?retryWrites=true&w=majority&appName=YngMndDbCluster";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas!');
        return client.db('yngMndDb');
    } catch (err) {
        console.error('Failed to connect to the database. Error:', err);
        process.exit(1);
    }
}

module.exports = connectDB;