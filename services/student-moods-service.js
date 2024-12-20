// services/student-mood-service.js
const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');

const { defineStudentTaskStructure } = require('../services/modules-service');



// Function to add or update mood based on provided date
async function addOrUpdateMood(studentData) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const { studentId, date, mood } = studentData;

    // Check if there is an existing studentTask for the given studentId
    let studentTask = await collection.findOne({ studentId: new ObjectId(studentId) });

    if (studentTask) {
        // If the studentTask exists, check if the date already exists in the moods array
        const existingMoodIndex = studentTask.moods.findIndex(moodItem => moodItem.date === date);

        if (existingMoodIndex > -1) {
            // If the date exists, update the mood
            await collection.updateOne(
                { studentId: new ObjectId(studentId), 'moods.date': date },
                { $set: { 'moods.$.mood': mood } }
            );
        } else {
            // If the date does not exist, push the new mood into the moods array
            await collection.updateOne(
                { studentId: new ObjectId(studentId) },
                { $push: { moods: { date, mood } } }
            );
        }
    }  else {
        // If no _id is provided, create a new studentTask document
        const newStudentTask = defineStudentTaskStructure(studentData);
        newStudentTask.moods.push({ date, mood }); // Add the mood
        const result = await collection.insertOne(newStudentTask);
        return result.insertedId;
    }
}

module.exports = { addOrUpdateMood };