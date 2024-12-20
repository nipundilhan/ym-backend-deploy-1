const express = require('express');
const { addMindMap , getGame2Details , updateSharedStatus , getSharedMindMaps , handleRateMindMaps , getSharedMindMapsForAdmin , deleteMindMap } = require('../services/module1-game2-mindmap-service');
const router = express.Router();
const multer = require('multer');

// Set up Multer for file uploads
const upload = multer({ 
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Define the route for adding a mind map
router.post('/', upload.array('attachments'), async (req, res) => {
    try {
        const studentId = req.body.studentId;
        const mindMapData = {
            mindMapId: req.body.mindMapId || null,
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            attachments: req.files // Multer attaches the files to req.files
        };

        // Call the service to add the mind map
        await addMindMap(studentId, mindMapData);
        res.status(201).json({ message: 'Mind map added successfully.' });
    } catch (error) {
        console.error('Error adding mind map:', error);
        res.status(400).json({ message: error.message });
    }
});

router.get('/sharedMindMapsForAdmin', async (req, res) => {
    try {

        // Call the service to get all shared QandAs
        const sharedQandAData = await getSharedMindMapsForAdmin();

        res.status(200).json({ message: 'Shared QandA data retrieved successfully', data: sharedQandAData });
    } catch (error) {
        console.error('Error fetching shared QandA data:', error);
        res.status(400).json({ message: error.message });
    }
});


router.get('/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Call the service to get game2 details
        const game2Details = await getGame2Details(studentId);
        
        if (!game2Details) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        res.status(200).json(game2Details);
    } catch (error) {
        console.error('Error getting game2 details:', error);
        res.status(400).json({ message: error.message });
    }
});


router.put('/share', async (req, res) => {
    try {
        const { ownerStudentId, mindMapId, sharedStatus } = req.body;

        // Call service layer to update the shared status
        const result = await updateSharedStatus({ ownerStudentId, mindMapId, sharedStatus });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating shared status:', error);
        res.status(400).json({ message: error.message });
    }
});


router.get('/sharedMindMaps/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        // Call the service to get all shared QandAs
        const sharedQandAData = await getSharedMindMaps(studentId);

        res.status(200).json({ message: 'Shared QandA data retrieved successfully', data: sharedQandAData });
    } catch (error) {
        console.error('Error fetching shared QandA data:', error);
        res.status(400).json({ message: error.message });
    }
});


router.post('/rate', async (req, res) => {
    try {
        const studentData = req.body;

        // Call service layer to handle the rating
        const updatedStudentTask = await handleRateMindMaps(studentData);

        res.status(200).json({ message: 'Rating processed successfully'});
    } catch (error) {
        console.error('Error processing rating:', error);
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:studentId/:mindMapId', async (req, res) => {
    try {
        const { studentId, mindMapId } = req.params;

        // Call the service to delete the mind map
        const result = await deleteMindMap(studentId, mindMapId);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting mind map:', error);
        res.status(400).json({ message: error.message });
    }
});


module.exports = router;