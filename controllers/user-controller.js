const { verifyToken } = require('../middlewares/auth-middleware');
const express = require('express');
const { handleUserSignup , updateStudent , handleInstructorSignup , getUsersByRole , updateTimeTracking , deleteUser , updatePassword} = require('../services/user-service');

const router = express.Router();

router.get('/protected', verifyToken, protected);
router.get('/get-username', getUsername);
router.post('/signup', signup);
router.post('/signup-instructor', signupInstructor);
router.put('/update-student',  updateStudentHandler); 
router.get('/find-by-role/:role', getUsersByRoleHandler);
router.get('/update-time-tracking/:userId', updateTimeTrackingHandler);
router.delete('/delete-user/:userId', deleteUserHandler);
router.put('/update-password', updatePasswordHandler);


// Controller method to handle protected route
function protected(req, res) {
    // Authorization check (role-based access control)
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    res.json({ message: 'Protected route accessed successfully', username: req.user.username });
}

// Controller method to fetch username from JWT
function getUsername(req, res) {
    // we might not be able to get any other newly assign variables in decoded user object eg:- email
    res.json({ username: req.user.username });
}


async function signup(req, res) {
    try {
        const userDetails = req.body;

        // Call service layer to handle user signup
        const newUser = await handleUserSignup(userDetails);

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(400).json({ message: error.message });
    }
}

async function signupInstructor(req, res) {
    try {
        const userDetails = req.body;

        // Call service layer to handle user signup
        const newUser = await handleInstructorSignup(userDetails);

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(400).json({ message: error.message });
    }
}

// Controller method for updating a student
async function updateStudentHandler(req, res) {
    try {
        const { _id, gender, dob, avatarCode } = req.body;

        if (!_id || !gender || !dob || !avatarCode) {
            return res.status(400).json({ message: "All fields (_id, gender, dob, avatarCode) are required." });
        }

        // Call the service layer to update the student
        const result = await updateStudent({ _id, gender, dob, avatarCode });

        res.status(200).json({ message: "Student updated successfully.", result });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(400).json({ message: error.message });
    }
}

async function getUsersByRoleHandler(req, res) {
    try {
        const { role } = req.params; // Extract role from the path parameter

        if (!role) {
            return res.status(400).json({ message: "Role is required." });
        }

        // Fetch users and total count from the service
        const { users, totalCount } = await getUsersByRole(role);

        res.status(200).json({
            message: "Users fetched successfully.",
            totalCount,
            users
        });
    } catch (error) {
        console.error('Error fetching users by role:', error);
        res.status(500).json({ message: error.message });
    }
}


async function updateTimeTrackingHandler(req, res) {
    try {
        const { userId } = req.params; // Extract `userId` from the path parameter

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        // Call service layer to update time tracking
        const result = await updateTimeTracking(userId , "NORMAL");

        res.status(200).json(result);
    } catch (error) {
        console.error("Error updating time tracking:", error);
        res.status(400).json({ message: error.message });
    }
}

async function deleteUserHandler(req, res) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const result = await deleteUser(userId);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(400).json({ message: error.message });
    }
}

async function updatePasswordHandler(req, res) {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: "All fields (userId, oldPassword, newPassword) are required." });
        }

        // Call the service layer to update the password
        const result = await updatePassword(userId, oldPassword, newPassword);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = router;    