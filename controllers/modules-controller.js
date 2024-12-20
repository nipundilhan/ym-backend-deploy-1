const express = require('express');
const { getGameDetails,findStudentGameMarks , shareBadge  } = require('../services/modules-service');

const router = express.Router();

router.get('/game-details', getGameDetailsHandler);
router.get('/findPointsByStudent/:id', findgamePointsByStudentID);
router.post('/shareBadge', shareStudentadge);

// Controller method to handle the GET request for game details
async function getGameDetailsHandler(req, res) {
    const { moduleCode, gameCode } = req.query;

    try {
        if (!moduleCode || !gameCode) {
            return res.status(400).json({ message: 'moduleCode and gameCode are required' });
        }

        // Fetch the game details from the service
        const gameDetails = await getGameDetails(moduleCode, gameCode);

        res.status(200).json(gameDetails);
    } catch (error) {
        console.error('Error fetching game details:', error);
        res.status(500).json({ message: error.message });
    }
}


async function findgamePointsByStudentID(req, res) {
    try {
        const studentId = req.params.id;
        const gamePointDetails = await findStudentGameMarks(studentId);
        if (gamePointDetails) {
            res.status(200).json(gamePointDetails);
        } else {
            res.status(404).json({ message: 'student data not found' });
        }
    } catch (error) {
        console.error('Error updating country:', error);
        res.status(400).json({ message: error.message });
    }
}

async function shareStudentadge(req, res) {
    try {
        const data = req.body;

        // Call the service function to update the badge sharing status
        const result = await shareBadge(data );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Badge shared successfully' });
        } else {
            res.status(404).json({ message: 'Student task not found or badge already shared' });
        }
    } catch (error) {
        console.error('Error sharing badge:', error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = router;