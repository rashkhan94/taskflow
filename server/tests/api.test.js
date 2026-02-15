import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/server.js';

// Use a test database
const TEST_DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow_test';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB);
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Auth API', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
    };

    let token;

    it('POST /api/auth/signup - should create a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(testUser)
            .expect(201);

        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.name).toBe(testUser.name);
        token = res.body.token;
    });

    it('POST /api/auth/signup - should reject duplicate email', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(testUser)
            .expect(400);
    });

    it('POST /api/auth/login - should login with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password })
            .expect(200);

        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('POST /api/auth/login - should reject wrong password', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' })
            .expect(401);
    });

    it('GET /api/auth/me - should return user profile', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.user.email).toBe(testUser.email);
    });

    it('GET /api/auth/me - should reject without token', async () => {
        await request(app)
            .get('/api/auth/me')
            .expect(401);
    });
});

describe('Board API', () => {
    let token;
    let boardId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Board User', email: 'board@example.com', password: 'password123' });
        token = res.body.token;
    });

    it('POST /api/boards - should create a board', async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Board', description: 'A test board' })
            .expect(201);

        expect(res.body.board.title).toBe('Test Board');
        boardId = res.body.board._id;
    });

    it('GET /api/boards - should list boards', async () => {
        const res = await request(app)
            .get('/api/boards')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.boards.length).toBeGreaterThan(0);
        expect(res.body.pagination).toBeDefined();
    });

    it('GET /api/boards/:id - should return board with lists and tasks', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.board.title).toBe('Test Board');
        expect(res.body.lists).toBeDefined();
        expect(res.body.tasks).toBeDefined();
    });

    it('PUT /api/boards/:id - should update board', async () => {
        const res = await request(app)
            .put(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Board' })
            .expect(200);

        expect(res.body.board.title).toBe('Updated Board');
    });

    it('DELETE /api/boards/:id - should delete board', async () => {
        await request(app)
            .delete(`/api/boards/${boardId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
