const jwt = require('jsonwebtoken');
const express = require('express');
const { JWT_SECRET , ENCRPYT_SECRET } = require('../utils/jwt-utils');
const connectDB = require('../config/db'); // Ensure the correct path

const {updateTimeTracking } = require('../services/user-service');
const router = express.Router();
const crypto = require('crypto');


const algorithm = "aes-256-ctr";
const encryptionKey = crypto.createHash('sha256').update(ENCRPYT_SECRET).digest(); // 32-byte key

function encrypt(text) {
    const iv = Buffer.alloc(16, 0); // Initialization vector (IV)
    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return encrypted.toString('hex');
}

function decrypt(encryptedText) {
    const iv = Buffer.alloc(16, 0); // Initialization vector (IV)
    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
}

router.post('/authenticate', authenticate); 

async function authenticate(req, res) {
    const { username, pw } = req.body;

    try {
        const db = await connectDB();
        const collection = db.collection('users');

        const password =  encrypt(pw);
        //const pw = password;

        console.log(pw);

        // Find user by username and password
        const user = await collection.findOne({ username, password });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        try{
            const result = await updateTimeTracking(user._id , "LOGIN");
        }catch{
            console.error('Error during time tracking:', error);
        }

        // Generate JWT token
        const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ user: { username: user.username, userId : user._id,  role: user.role , avatarCode :  user.avatarCode }, jwtToken: token });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

router.get('/decrypt/:encryptedText', async (req, res) => {
    const { encryptedText } = req.params;


    if (!encryptedText) {
        return res.status(400).json({ message: 'Encrypted text is required.' });
    }

    try {
        // Decrypt the provided encrypted text
        const decryptedText = decrypt(encryptedText);

        res.status(200).json({ decryptedText });
    } catch (error) {
        console.error('Error during decryption:', error.message);
        res.status(500).json({ message: 'Failed to decrypt text. Please check the input.' });
    }
});

router.get('/encrypt/:text', (req, res) => {
    const { text } = req.params;

    if (!text) {
        return res.status(400).json({ message: 'Text to encrypt is required.' });
    }

    try {
        const encryptedText = encrypt(text);
        res.status(200).json({ encryptedText });
    } catch (error) {
        console.error('Error during encryption:', error.message);
        res.status(500).json({ message: 'Failed to encrypt text.' });
    }
});



module.exports = router ;