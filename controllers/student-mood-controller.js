const express = require('express');
const { addOrUpdateMood } = require('../services/student-moods-service');

const router = express.Router();

router.post('/', addMood);

// Controller method to add or update mood
async function addMood(req, res) {
    try {
        const studentData = req.body;

        // Call service layer to handle adding or updating the mood
        const result = await addOrUpdateMood(studentData);

        if (result) {
            res.status(201).json({ message: 'New student task created', studentTaskId: result });
        } else {
            res.status(200).json({ message: 'Mood updated successfully' });
        }
    } catch (error) {
        console.error('Error updating mood:', error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = router;