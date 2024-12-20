const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { defineStudentTaskStructure } = require('./modules-service'); // Assumes defineStudentTaskStructure is in modules-service

async function addBreathingPractice(studentData) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const studentId = new ObjectId(studentData.studentId);
    const todayDate = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    // Create breathing practice entry
    const breathingPracticeEntry = {
        _id: new ObjectId(),
        date: todayDate,
        techniqueCode: studentData.techniqueCode,
        cycles: studentData.cycles,
        time: studentData.time,
        points: 1
    };

    // Check if a record already exists for the student
    let studentRecord = await collection.findOne({ studentId });

    if (!studentRecord) {
        // If no record, initialize new structure and add breathing practice entry
        studentRecord = defineStudentTaskStructure(studentData);
        studentRecord.module1.game4.breathingPractises = [breathingPracticeEntry];
        studentRecord.module1.game4.gamePoints = 1;

        await collection.insertOne(studentRecord);
    } else {
        // If record exists, push new breathing practice entry and increment gamePoints
        await collection.updateOne(
            { studentId },
            {
                $push: { "module1.game4.breathingPractises": breathingPracticeEntry },
                $inc: { "module1.game4.gamePoints": 1 }
            }
        );
    }

    return breathingPracticeEntry;
}

async function getBreathingPracticesByStudentId(studentId) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const studentRecord = await collection.findOne(
        { studentId: new ObjectId(studentId) }
    );

    if (!studentRecord) {
        throw new Error('No record found for this student');
    }

    return studentRecord.module1.game4;
}

module.exports = {
    addBreathingPractice,
    getBreathingPracticesByStudentId
};