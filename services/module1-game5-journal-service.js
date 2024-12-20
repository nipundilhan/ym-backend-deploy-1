const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { defineStudentTaskStructure , formatDate } = require('../services/modules-service');
const {  ENCRPYT_SECRET } = require('../utils/jwt-utils');
const crypto = require('crypto');

// AES-256-CTR Configuration
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

async function createOrUpdateJournalLog(journalData) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const todayDate = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    // Find existing student task
    let studentTask = await collection.findOne({ studentId: new ObjectId(journalData.studentId) });

    if (!studentTask) {
        // Create new student task structure
        studentTask = defineStudentTaskStructure(journalData);
        await collection.insertOne(studentTask);
    }

    if (!journalData.logId) {
        // Create new journal log
        const newJournalLog = {
            _id: new ObjectId(),
            date: todayDate,
            journalType: journalData.journalType,
            question1: journalData.question1,
            answer1: encrypt(journalData.answer1),
            question2: journalData.question2,
            answer2: encrypt(journalData.answer2),
            points: 1,
        };

        const result = await collection.updateOne(
            { studentId: new ObjectId(journalData.studentId) },
            {
                $push: { "module1.game5.journalLogs": newJournalLog },
                $inc: { "module1.game5.gamePoints": 1 },
            }
        );

        return result;
    } else {
        const game5 = studentTask.module1.game5;

        const logIndex = game5.journalLogs.findIndex((log) => log._id.toString() === journalData.logId);

        if (logIndex > -1) {
            game5.journalLogs[logIndex].answer1 = encrypt(journalData.answer1);
            game5.journalLogs[logIndex].answer2 = encrypt(journalData.answer2);

            const updatedStudentTask = await collection.updateOne(
                { studentId: new ObjectId(journalData.studentId) },
                { $set: { "module1.game5.journalLogs": game5.journalLogs } }
            );

            return updatedStudentTask;
        } else {
            throw new Error('Journal log not found');
        }
    }
}

async function findJournalLogsByStudentId(studentId) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const studentTask = await collection.findOne({ studentId: new ObjectId(studentId) });

    if (!studentTask) {
        throw new Error('Student record not found');
    }

    // Sort and decrypt journal logs before returning
    studentTask.module1.game5.journalLogs = studentTask.module1.game5.journalLogs
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date in descending order
        .map(log => ({
            ...log,
            answer1: decrypt(log.answer1),
            answer2: decrypt(log.answer2),
        }));

    return studentTask.module1.game5;
}

async function deleteJournalLog(studentId, journalLogId) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const result = await collection.updateOne(
        { studentId: new ObjectId(studentId) },
        {
            $pull: { "module1.game5.journalLogs": { _id: new ObjectId(journalLogId) } },
            $inc: { "module1.game5.gamePoints": -1 },
        }
    );

    return result;
}

module.exports = {
    createOrUpdateJournalLog,
    findJournalLogsByStudentId,
    deleteJournalLog,
};