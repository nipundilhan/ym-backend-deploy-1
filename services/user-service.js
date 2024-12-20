// services/userService.js
const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { defineStudentTaskStructure  } = require('../services/modules-service');
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



function defineUserStructure(id, userData, userRole) {
    return {
        _id: id ? new ObjectId(id) : new ObjectId(),
        username: userData.username,
        role: userRole,
        gender: userData.gender,
        dob: userData.dob,
        type: userData.type,
        email: userData.email,
        password: encrypt(userData.password),
        avatarCode :userData.avatarCode,
        signupDate: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        timeTracking: [],
    };
}

async function validateUserDetails(username, email) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({
        $or: [{ username }, { email }],
    });
    return user ? true : false;
}

async function createUserStudent(userData) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = defineUserStructure(null, userData , "STUDENT");

    const result = await collection.insertOne(user);


    const collection1 = db.collection('studentTasks');
    const dummyData = { studentName: userData.username, studentId: result.insertedId };   
    let studentTask = defineStudentTaskStructure(dummyData);
    await collection1.insertOne(studentTask);

    return result;
}

async function updateStudent(userData) {
    const db = await connectDB();
    const collection = db.collection('users');

    if (!userData._id) {
        throw new Error('User ID is required for updating a student.');
    }

    const filter = { _id: new ObjectId(userData._id) };
    const update = {
        $set: {
            //gender: userData.gender,
            //dob: userData.dob,
            avatarCode: userData.avatarCode,
        },
    };

    const result = await collection.updateOne(filter, update);

    if (result.matchedCount === 0) {
        throw new Error('User not found.');
    }

    return {
        status: "Updated"
    };
}

async function handleUserSignup(userDetails) {
    const { username, email } = userDetails;


    // Validate if username or email already exists
    const userExists = await validateUserDetails(username, email);
    if (userExists) {
        throw new Error('Username or email already exists');
    }


    // Create and save new user
    const newUser = await createUserStudent(userDetails);
    return newUser;
}





async function handleInstructorSignup(userDetails) {
    const { username, email } = userDetails;


    // Validate if username or email already exists
    const userExists = await validateUserDetails(username, email);
    if (userExists) {
        throw new Error('Username or email already exists');
    }


    // Create and save new user
    const newUser = await createUserInstructor(userDetails);
    return newUser;
}

async function createUserInstructor(userData) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = defineUserStructure(null, userData , "ADMIN");

    const result = await collection.insertOne(user);


    return result;
}

/*
async function getUserById(id) {
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
*/

async function getByUserName(userName) {
    const db = await connectDB();
    const collection = db.collection('users');

    try {
        const user = await collection.findOne({ username: userName });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Error fetching user by username: ${error.message}`);
    }
}


async function getUsersByRole(role) {
    const db = await connectDB();
    const collection = db.collection('users');

    try {
        const totalCount = await collection.countDocuments({ role });
        const users = await collection
            .find({ role })
            .limit(102)
            .toArray();

        return { users, totalCount };
    } catch (error) {
        throw new Error(`Error fetching users by role: ${error.message}`);
    }
}

function formatDate(date) {
    // Extract the date part (yyyy-mm-dd)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(date.getDate()).padStart(2, '0');

    // Format the time part (hh:mm AM/PM)
    const options = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    const time = new Intl.DateTimeFormat('en-US', options).format(date);

    // Return the full formatted date string in "yyyy-mm-dd hh:mm AM/PM" format
    return `${year}-${month}-${day} ${time}`;
}


async function updateTimeTracking(userId, action) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    const db = await connectDB();
    const collection = db.collection('users');

    // Get current date and time
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentTime = new Date();
    const currentFormatTime = formatDate(new Date());

    const filter = { _id: new ObjectId(userId) };

    // Check if the current date exists in the timeTracking array
    const user = await collection.findOne(filter);

    if (!user) {
        throw new Error("User not found.");
    }

    const existingRecord = user.timeTracking?.find(record => record.date === currentDate);

    let update, options = {};
    if (existingRecord) {
        // Update the existing record based on the action type
        if (action === "LOGIN") {
            update = {
                $set: {
                    "timeTracking.$[elem].lastActionTime": currentTime,
                    "timeTracking.$[elem].lastActionFormatTime": currentFormatTime
                },
                $inc: {
                    "timeTracking.$[elem].times": 1
                }
            };
        } else {
            // Calculate duration difference in seconds
            const lastActionTime = new Date(existingRecord.lastActionTime);
            const duration = Math.floor((currentTime - lastActionTime) / 1000);

            update = {
                $set: {
                    "timeTracking.$[elem].lastActionTime": currentTime,
                    "timeTracking.$[elem].lastActionFormatTime": currentFormatTime
                },
                $inc: {
                    "timeTracking.$[elem].duration": duration
                }
            };
        }

        options.arrayFilters = [{ "elem.date": currentDate }];
    } else {
        // Add a new record to the array
        const newRecord = {
            date: currentDate,
            times: 1,
            lastActionTime: currentTime,
            lastActionFormatTime: currentFormatTime,
            duration: 0
        };

        update = {
            $push: {
                timeTracking: newRecord
            }
        };
    }

    const result = await collection.updateOne(filter, update, options);

    if (result.modifiedCount === 0) {
        throw new Error("Failed to update time tracking.");
    }

    return { message: "Time tracking updated successfully." };
}


async function deleteUser(userId) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');
    const studentTasksCollection = db.collection('studentTasks');

    const filter = { _id: new ObjectId(userId) };

    try {
        // Delete the user
        const deleteUserResult = await usersCollection.deleteOne(filter);

        if (deleteUserResult.deletedCount === 0) {
            throw new Error("User not found or already deleted.");
        }

        //console.log("User deleted successfully.");

        // Attempt to delete associated student tasks if the user is a student
        const deleteStudentTasksResult = await studentTasksCollection.deleteOne({
            studentId: new ObjectId(userId),
        });

        if (deleteStudentTasksResult.deletedCount > 0) {
            //console.log("Associated student tasks deleted successfully.");
        } else {
            console.log("No associated student tasks found for this user.");
        }

        return { message: "User and associated student tasks processed successfully." };
    } catch (error) {
        throw new Error(`Error deleting user: ${error.message}`);
    }
}


async function updatePassword(userId, oldPassword, newPassword) {
    if (!userId || !oldPassword || !newPassword) {
        throw new Error("All fields (userId, oldPassword, newPassword) are required.");
    }

    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw new Error("User not found.");
    }

    // Validate the old password
    const encryptedOldPassword = encrypt(oldPassword);
    if (user.password !== encryptedOldPassword) {
        throw new Error("Incorrect old password.");
    }

    // Encrypt the new password
    const encryptedNewPassword = encrypt(newPassword);

    // Update the password
    const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: encryptedNewPassword } }
    );

    if (result.modifiedCount === 0) {
        throw new Error("Failed to update password.");
    }

    return { message: "Password updated successfully." };
}

module.exports = { validateUserDetails, createUserStudent, handleUserSignup   , getByUserName , updateStudent , handleInstructorSignup , getUsersByRole , updateTimeTracking , deleteUser , updatePassword};