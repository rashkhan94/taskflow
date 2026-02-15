import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Board from './models/Board.js';
import List from './models/List.js';
import Task from './models/Task.js';
import Activity from './models/Activity.js';
import { pathToFileURL } from 'url';

export const seed = async (closeConnection = true) => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
        }

        // Clear existing data
        await User.deleteMany({});
        await Board.deleteMany({});
        await List.deleteMany({});
        await Task.deleteMany({});
        await Activity.deleteMany({});

        // Create demo users
        const alice = await User.create({
            name: 'Alice Johnson',
            email: 'alice@demo.com',
            password: 'password123',
        });

        const bob = await User.create({
            name: 'Bob Smith',
            email: 'bob@demo.com',
            password: 'password123',
        });

        // Create a board
        const board = await Board.create({
            title: 'Project Alpha',
            description: 'Main project board for team collaboration',
            owner: alice._id,
            members: [alice._id, bob._id],
            background: '#6366f1',
        });

        // Create lists
        const todoList = await List.create({ title: 'To Do', board: board._id, position: 0 });
        const inProgressList = await List.create({ title: 'In Progress', board: board._id, position: 1 });
        const doneList = await List.create({ title: 'Done', board: board._id, position: 2 });

        // Create tasks
        await Task.create([
            { title: 'Design system architecture', description: 'Create the initial system design document', list: todoList._id, board: board._id, position: 0, priority: 'high', assignees: [alice._id] },
            { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployment', list: todoList._id, board: board._id, position: 1, priority: 'medium', assignees: [bob._id] },
            { title: 'Write API documentation', description: 'Document all REST endpoints', list: todoList._id, board: board._id, position: 2, priority: 'low' },
            { title: 'Implement user authentication', description: 'JWT-based auth with signup and login', list: inProgressList._id, board: board._id, position: 0, priority: 'high', assignees: [alice._id, bob._id] },
            { title: 'Create database models', description: 'Mongoose models for all entities', list: inProgressList._id, board: board._id, position: 1, priority: 'medium', assignees: [alice._id] },
            { title: 'Project kickoff meeting', description: 'Initial team meeting notes', list: doneList._id, board: board._id, position: 0, priority: 'low', assignees: [alice._id, bob._id] },
        ]);

        // Create a second board
        const board2 = await Board.create({
            title: 'Sprint Board',
            description: 'Current sprint tasks',
            owner: bob._id,
            members: [bob._id, alice._id],
            background: '#ec4899',
        });

        const backlog = await List.create({ title: 'Backlog', board: board2._id, position: 0 });
        const active = await List.create({ title: 'Active', board: board2._id, position: 1 });

        await Task.create([
            { title: 'Fix login bug', list: backlog._id, board: board2._id, position: 0, priority: 'urgent', assignees: [bob._id] },
            { title: 'Update dependencies', list: backlog._id, board: board2._id, position: 1, priority: 'low' },
            { title: 'Performance optimization', list: active._id, board: board2._id, position: 0, priority: 'high', assignees: [alice._id] },
        ]);

        // Create some activity
        await Activity.create([
            { board: board._id, user: alice._id, action: 'board.created', details: { title: 'Project Alpha' } },
            { board: board._id, user: alice._id, action: 'member.added', details: { memberName: 'Bob Smith' } },
            { board: board._id, user: alice._id, action: 'list.created', details: { title: 'To Do' } },
            { board: board._id, user: bob._id, action: 'task.created', details: { title: 'Design system architecture' } },
        ]);

        console.log('✅ Seed data created successfully!');
        console.log('\nDemo Credentials:');
        console.log('  User 1: alice@demo.com / password123');
        console.log('  User 2: bob@demo.com / password123');

        if (closeConnection) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Seed error:', error);
        if (closeConnection) process.exit(1);
        throw error;
    }
};

// Check if running directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    seed();
}
