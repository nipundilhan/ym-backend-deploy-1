const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { calculateTotalMarks , getGameDetails } = require('../services/modules-service');

const { defineStudentTaskStructure } = require('../services/modules-service');




async function handleAddTutorial(tutorialData) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    const taskData = tutorialData.tasks[0];
    let taskPoints = taskData.status === "Completed" ? 1 : 0;

    //const game1Details = await getGameDetails("MD01", "GM01");

    if (tutorialData._id) {
        const studentModel = await collection.findOne({ _id: new ObjectId(tutorialData._id) });
    
        /*
        let badge1Achieved = "NO"; let badge2Achieved = "NO";
        if((taskData.status === "Completed")  &&  (studentModelmodule1.game1.gamePoints+1 >= game1Details.achievementMargin1)){
            badge1Achieved = "YES";
        }        
        if((taskData.status === "Completed")  &&  (studentModelmodule1.game1.gamePoints+1 >= game1Details.achievementMargin2)){
            badge2Achieved = "YES";
        }*/

        if (taskData._id) {
            // Editing an existing task
            const taskId = new ObjectId(taskData._id);

            // Calculate the change in points
            const existingTask = studentModel.module1.game1.tasks.find(task => task._id.equals(taskId));
            if (!existingTask) {
                throw new Error('Task not found');
            }

            // Update the existing task
            const result = await collection.updateOne(
                { _id: new ObjectId(tutorialData._id), "module1.game1.tasks._id": taskId },
                {
                    $set: {
                        "module1.game1.tasks.$.description": taskData.description,
                        "module1.game1.tasks.$.date": taskData.date,
                        "module1.game1.tasks.$.status": taskData.status,
                        "module1.game1.tasks.$.points": taskPoints
                    },
                    $inc: { "module1.game1.gamePoints": taskPoints }
                   //,$set: { "module1.game1.badge1Achieved": badge1Achieved , "module1.game1.badge2Achieved": badge2Achieved }
                }
            );

            return result;
        } else {
            // Add a new task
            const newTask = {
                _id: new ObjectId(), // Assign a new ObjectId for the task
                name: taskData.name,
                description: taskData.description,
                date: taskData.date,
                status: taskData.status,
                // completePercentage : 80,
                points: taskPoints, // Points assigned to the new task
            };

            // Update the document with new task and increment gamePoints
            const result = await collection.updateOne(
                { _id: new ObjectId(tutorialData._id) },
                {
                    $push: { "module1.game1.tasks": newTask },
                    $inc: { "module1.game1.gamePoints": newTask.points }
                }
            );

            return result;
        }
    } else {
        // Initialize the structure for a new document with empty tasks array
        const tutorial = defineStudentTaskStructure(tutorialData);

        // set the game points
        tutorial.module1.game1.gamePoints = taskPoints;

        // Push the new task into the empty tasks array
        const taskData = tutorialData.tasks[0];

        tutorial.module1.game1.tasks.push({
            _id: new ObjectId(), // New task ObjectId
            name: taskData.name,
            description: taskData.description,
            date: taskData.date,
            status: taskData.status,
            // completePercentage : 80,
            points: taskPoints
        });

        const result = await collection.insertOne(tutorial);
        return result;
    }
}



async function findStudentTasksByStudentID(studentId) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');
    
    // Convert the studentId to an ObjectId if it's not already
    const query = { studentId: new ObjectId(studentId) };
    
    // Find the first document with the matching studentId
    const result = await collection.findOne(query);

    //result.totalMarks = calculateTotalMarks(result);
    result.module1.game1.tasks = result.module1.game1.tasks
                                    .sort((a, b) => new Date(b.date) - new Date(a.date));

    //result.module1.game2.mindMaps = [];
    return result;
}

async function deleteTask(studentTaskId, taskId) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    // Convert studentTaskId and taskId to ObjectId
    const studentTaskObjectId = new ObjectId(studentTaskId);
    const taskObjectId = new ObjectId(taskId);

    // Find the student task document
    const studentTask = await collection.findOne({ _id: studentTaskObjectId });

    if (!studentTask) {
        throw new Error('Student task not found');
    }

    // Find the task to delete
    const taskToDelete = studentTask.module1.game1.tasks.find(task => task._id.equals(taskObjectId));

    if (!taskToDelete) {
        throw new Error('Task not found');
    }

    // Check if the task is already completed
    if (taskToDelete.status === "Completed") {
        throw new Error('Cannot delete a completed task');
    }

    // Delete the task
    const result = await collection.updateOne(
        { _id: studentTaskObjectId },
        {
            $pull: { "module1.game1.tasks": { _id: taskObjectId } }
        }
    );

    return result;
}

module.exports = { handleAddTutorial , findStudentTasksByStudentID , deleteTask };