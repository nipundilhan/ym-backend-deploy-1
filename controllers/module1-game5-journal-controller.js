const game5JournalService = require('../services/module1-game5-journal-service');
const express = require('express');

const router = express.Router();

router.post('/', createOrUpdateJournalLog);
router.get('/findByStudent/:id', findJournalsByStudentID);
router.delete('/:studentId/:journalId', deleteJournalLog);


async function createOrUpdateJournalLog(req, res) {
    try {
        const journalData = req.body;

        const result = await game5JournalService.createOrUpdateJournalLog(journalData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating or updating journal log:', error);
        res.status(400).json({ message: error.message });
    }
}

async function findJournalsByStudentID(req, res) {
    try {
        const studentId = req.params.id;

        const journals = await game5JournalService.findJournalLogsByStudentId(studentId);
        if (journals) {
            res.status(200).json(journals);
        } else {
            res.status(404).json({ message: 'No journal logs found for the student' });
        }
    } catch (error) {
        console.error('Error finding journal logs:', error);
        res.status(400).json({ message: error.message });
    }
}

async function deleteJournalLog(req, res) {
    try {
        const { studentId, journalId } = req.params; // Extract studentId and journalId from the route parameters

        const result = await game5JournalService.deleteJournalLog(studentId, journalId);

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Journal log deleted successfully' });
        } else {
            res.status(404).json({ message: 'Journal log not found or already deleted' });
        }
    } catch (error) {
        console.error('Error deleting journal log:', error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = router;