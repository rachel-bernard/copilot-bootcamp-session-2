const request = require('supertest');
const { app, db, resetDatabase } = require('../src/app');

beforeEach(() => {
  resetDatabase();
});

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    try {
      db.close();
    } catch (error) {
      // Ignore close errors when another suite already closed the shared DB.
    }
  }
});

// Test helpers
const createTask = async (title = 'Temp Task', dueDate = null) => {
  const response = await request(app)
    .post('/api/tasks')
    .send({ title, dueDate })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const task = response.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('dueDate');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('createdAt');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = { title: 'Test Task', dueDate: '2026-04-01' };
      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.dueDate).toBe(newTask.dueDate);
      expect(response.body.completed).toBe(false);
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Task title is required');
    });

    it('should return 400 if due date has invalid format', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Bad Date', dueDate: '04-01-2026' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Due date must use YYYY-MM-DD format');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should edit an existing task', async () => {
      const task = await createTask('Original Task');

      const updateResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated Task', dueDate: '2026-05-01' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toMatchObject({
        id: task.id,
        title: 'Updated Task',
        dueDate: '2026-05-01',
      });
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('should mark a task as complete', async () => {
      const task = await createTask('Complete Me');

      const completeResponse = await request(app)
        .patch(`/api/tasks/${task.id}/complete`)
        .send({ completed: true });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body).toHaveProperty('completed', true);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      const task = await createTask('Task To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: task.id });

      const deleteAgain = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app).delete('/api/tasks/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/tasks/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });
  });
});