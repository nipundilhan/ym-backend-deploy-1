// services/notification-service.js
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');


function defineNotificationStructure(id, userName, avatarCode, notificationData) {
    return {
        _id: id ? new ObjectId(id) : new ObjectId(),
        userName,
        avatarCode,
        date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
        //description: notificationData.description,
        reference: notificationData.reference
    };
}

function defineMessageStructure(id, title, description , status) {
    return {
        _id: id ? new ObjectId(id) : new ObjectId(),
        date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
        status : status,
        title,
        message: description
    };
}

// Add a new message to the 'messages' collection
async function addMessage(messageData) {
    const db = await connectDB();
    const collection = db.collection('messages');

    if (messageData._id) {
        // Update existing message
        const filter = { _id: new ObjectId(messageData._id) };
        const update = {
            $set: {
                title: messageData.title,
                message: messageData.message,
                status: messageData.status,
                //date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',  hour12: true }),
            },
        };

        const result = await collection.updateOne(filter, update);
        return { action: 'updated'};
    } else {
        // Create a new message
        const message = defineMessageStructure(null, messageData.title, messageData.message ,messageData.status);

        const result = await collection.insertOne(message);
        return { action: 'created' };
    }
}

// Retrieve all messages from the 'messages' collection
async function getAllMessages() {
    const db = await connectDB();
    const collection = db.collection('messages');

    const messages = await collection.find({}).sort({ date: -1 }).toArray();
    return messages;
}

async function addNotification(notificationData) {
    const db = await connectDB();
    const collection = db.collection('notifications');

    // /* this is the space to get the userName , avatarCode using studentId */
    const stdnt = await getUserByIdLocal(notificationData.studentId);


    //notificationData.description = ' unlocked '+ notificationData.reference + " badge" ;


    // Define notification structure
    const notification = defineNotificationStructure(null, stdnt.username, stdnt.avatarCode, notificationData);

    const result = await collection.insertOne(notification);
    return result;
}


async function getUserByIdLocal(id) {
    const db = await connectDB();
    const collection = db.collection('users');

    try {
        const user = await collection.findOne({ _id: new ObjectId(id) });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

async function getAllNotifications() {
    const db = await connectDB();
    const collection = db.collection('notifications');

    // Retrieve all notifications sorted by date (latest first)
    const notifications = await collection.find({})
        .sort({ date: -1 })
        .limit(102)
        .toArray();

    return notifications;
}

/*
// Rate notification (LIKE/DISLIKE)
async function rateNotification(id, type, userId) {
    const db = await connectDB();
    const collection = db.collection('notifications');

    const notification = await collection.findOne({ _id: new ObjectId(id) });

    if (!notification) {
        throw new Error('Notification not found');
    }

    if (type === 'LIKE') {
        // If the userId is not in the likes array, add it
        if (!notification.likes.includes(userId)) {
            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $push: { likes: userId } }
            );
        }
    } else if (type === 'DISLIKE') {
        // If the userId is in the likes array, remove it
        if (notification.likes.includes(userId)) {
            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $pull: { likes: userId } }
            );
        }
    }

    const updatedNotification = await collection.findOne({ _id: new ObjectId(id) });
    return updatedNotification;
}

async function getNotificationsByUserId(userId) {
    const db = await connectDB();
    const collection = db.collection('notifications');

    // Fetch notifications ordered by latest, skip first 2, and limit to 1000
    const notifications = await collection.find({})
        .sort({ date: -1 })
        .skip(2)
        .limit(1000)
        .toArray();

    // Transform the notifications with additional fields
    const response = notifications.map(notification => {
        const liked = notification.likes.includes(userId) ? 'YES' : 'NO';
        const likeCount = notification.likes.length;

        return {
            _id: notification._id,
            studentId: notification.studentId,
            userName: notification.userName,
            avatarCode: notification.avatarCode,
            date: notification.date,
            notificationType: notification.notificationType,
            title: notification.title,
            description: notification.description,
            reference: notification.reference,
            liked,
            likeCount
        };
    });

    return response;
}
*/

// Dummy function: Replace this with your actual method to get user details
async function getUserInfo(studentId) {
    // Assuming this returns the userName and avatarCode based on studentId

    //const stdnt = await getUserById(notificationData.studentId);
    
}

module.exports = { addNotification, getAllNotifications , addMessage , getAllMessages};