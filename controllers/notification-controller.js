// controllers/notification-controller.js
const { addNotification, getAllNotifications , addMessage , getAllMessages  } = require('../services/notification-service');
const express = require('express');
const router = express.Router();

// Controller method to add a notification
router.post('/', addNotificationHandler);

// Controller method to get all notifications, ordered by the latest
router.get('/', getNotificationsHandler);

// Rate Notification Handler (LIKE/DISLIKE)
//router.put('/rate/:id/:type/:userId', rateNotificationHandler);

// Get notifications with rating for user
//router.get('/allWithRating/:userId', getNotificationsByUserIdHandler);

router.post('/messages', addMessageHandler);

// Controller method to get all messages, ordered by the latest
router.get('/messages', getAllMessagesHandler);

// Add Notification Handler
async function addNotificationHandler(req, res) {
    try {
        const notificationData = req.body;
        const result = await addNotification(notificationData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding notification:', error);
        res.status(400).json({ message: error.message });
    }

}

// Get Notifications Handler
async function getNotificationsHandler(req, res) {
    try {
        const notifications = await getAllNotifications();
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(400).json({ message: error.message });
    }
}

async function addMessageHandler(req, res) {
    try {
        const { _id , title, message, status } = req.body;
        
        /*
        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }
        */

        const messageData = {  _id , title, message , status };
        const result = await addMessage(messageData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(400).json({ message: error.message });
    }
}

// Get All Messages Handler
async function getAllMessagesHandler(req, res) {
    try {
        const messages = await getAllMessages();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(400).json({ message: error.message });
    }
}

/*

// Rate Notification Handler (LIKE/DISLIKE)
async function rateNotificationHandler(req, res) {
    const { id, type, userId } = req.params;
    try {
        const result = await rateNotification(id, type, userId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error rating notification:', error);
        res.status(400).json({ message: error.message });
    }
}

// Get Notifications By User ID Handler
async function getNotificationsByUserIdHandler(req, res) {
    const { userId } = req.params;
    try {
        const notifications = await getNotificationsByUserId(userId);
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications for user:', error);
        res.status(400).json({ message: error.message });
    }
}

*/

module.exports = router;