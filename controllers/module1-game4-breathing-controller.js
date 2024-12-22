const express = require('express');
const breathingService = require('../services/module1-game4-breathing-service');

const router = express.Router();

// Route for adding a new breathing practice entry
router.post('/', addBreathingPractice);
router.get('/findByStudent/:studentId', getBreathingPracticesByStudentId);
router.delete('/delete/:studentId/:practiceId', deleteBreathingPractice); // Delete route

async function addBreathingPractice(req, res) {
    try {
        const studentData = req.body;
        const newPractice = await breathingService.addBreathingPractice(studentData);

        res.status(201).json(newPractice);
    } catch (error) {
        console.error('Error adding breathing practice:', error);
        res.status(400).json({ message: error.message });
    }
}

async function getBreathingPracticesByStudentId(req, res) {
    try {
        const studentId = req.params.studentId;
        const practices = await breathingService.getBreathingPracticesByStudentId(studentId);

        res.status(200).json(practices);
    } catch (error) {
        console.error('Error fetching breathing practices:', error);
        res.status(400).json({ message: error.message });
    }
}

// Delete breathing practice
async function deleteBreathingPractice(req, res) {
    try {
        const { studentId, practiceId } = req.params; // Extract studentId and practiceId from the route parameters

        const result = await breathingService.deleteBreathingPractice(studentId, practiceId);

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Breathing practice deleted successfully' });
        } else {
            res.status(404).json({ message: 'Breathing practice not found or already deleted' });
        }
    } catch (error) {
        console.error('Error deleting breathing practice:', error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = router;