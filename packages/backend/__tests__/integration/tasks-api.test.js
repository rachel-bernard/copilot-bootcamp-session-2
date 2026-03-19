const request = require('supertest');
const { app, db, resetDatabase } = require('../../src/app');

describe('Tasks API Integration', () => {
  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    if (db) {
      try {
        db.close();
      } catch (error) {
        // Ignore close errors when another suite already closed the shared DB.
      }
    }
  });

  it('supports a full task workflow', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ title: 'Integration Task', dueDate: '2026-06-10' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      title: 'Integration Task',
      dueDate: '2026-06-10',
      completed: false,
    });

    const taskId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Integration Task Updated', dueDate: '2026-06-11' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: taskId,
      title: 'Integration Task Updated',
      dueDate: '2026-06-11',
    });

    const completeResponse = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .send({ completed: true });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.completed).toBe(true);

    const sortedResponse = await request(app).get('/api/tasks?sortBy=dueDate&sortOrder=asc');
    expect(sortedResponse.status).toBe(200);
    expect(Array.isArray(sortedResponse.body)).toBe(true);
    expect(sortedResponse.body.some((task) => task.id === taskId)).toBe(true);

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: taskId });
  });

  it('returns validation errors for malformed requests', async () => {
    const badCreate = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad date', dueDate: '06/10/2026' });

    expect(badCreate.status).toBe(400);
    expect(badCreate.body).toHaveProperty('error', 'Due date must use YYYY-MM-DD format');

    const badComplete = await request(app)
      .patch('/api/tasks/1/complete')
      .send({ completed: 'yes' });

    expect(badComplete.status).toBe(400);
    expect(badComplete.body).toHaveProperty('error', 'Completed must be a boolean value');
  });
});
