const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

const CREATE_TASKS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const seedTasks = [
  { title: 'Plan sprint tasks', dueDate: '2026-03-22', completed: 0 },
  { title: 'Review pull requests', dueDate: null, completed: 0 },
  { title: 'Prepare demo notes', dueDate: '2026-03-25', completed: 1 },
];

db.exec(CREATE_TASKS_TABLE_SQL);

const insertTaskStmt = db.prepare(
  'INSERT INTO tasks (title, due_date, completed) VALUES (?, ?, ?)'
);

const getTaskByIdStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
const deleteTaskByIdStmt = db.prepare('DELETE FROM tasks WHERE id = ?');

const validSortBy = {
  createdAt: 'created_at',
  dueDate: 'due_date',
  title: 'title',
  completed: 'completed',
};

function initializeDatabase() {
  db.exec('DELETE FROM tasks');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks'");
  seedDefaultTasks();
  console.log('In-memory database initialized with sample tasks');
}

function seedDefaultTasks() {
  const transaction = db.transaction(() => {
    seedTasks.forEach((task) => {
      insertTaskStmt.run(task.title, task.dueDate, task.completed);
    });
  });

  transaction();
}

function resetDatabase() {
  db.exec('DELETE FROM tasks');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks'");
  seedDefaultTasks();
}

function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseTaskId(rawId) {
  const parsed = parseInt(rawId, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDueDate(rawDueDate) {
  if (rawDueDate === null || rawDueDate === undefined || rawDueDate === '') {
    return null;
  }

  if (typeof rawDueDate !== 'string') {
    return { error: 'Due date must be a string in YYYY-MM-DD format' };
  }

  const isIsoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawDueDate);
  if (!isIsoDateOnly) {
    return { error: 'Due date must use YYYY-MM-DD format' };
  }

  return rawDueDate;
}

function getSortOptions(query) {
  const sortByKey = query.sortBy || 'createdAt';
  const sortOrderRaw = query.sortOrder || 'desc';
  const column = validSortBy[sortByKey] || validSortBy.createdAt;
  const sortOrder = String(sortOrderRaw).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { column, sortOrder };
}

initializeDatabase();

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  try {
    const { column, sortOrder } = getSortOptions(req.query);
    const query = `SELECT * FROM tasks ORDER BY ${column} ${sortOrder}, id DESC`;
    const tasks = db.prepare(query).all().map(serializeTask);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const normalizedDueDate = parseDueDate(dueDate);
    if (normalizedDueDate && typeof normalizedDueDate === 'object' && normalizedDueDate.error) {
      return res.status(400).json(normalizedDueDate);
    }

    const result = insertTaskStmt.run(title.trim(), normalizedDueDate, 0);
    const id = result.lastInsertRowid;

    const newTask = getTaskByIdStmt.get(id);
    res.status(201).json(serializeTask(newTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const id = parseTaskId(req.params.id);
    const { title, dueDate } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const normalizedDueDate = parseDueDate(dueDate);
    if (normalizedDueDate && typeof normalizedDueDate === 'object' && normalizedDueDate.error) {
      return res.status(400).json(normalizedDueDate);
    }

    const existingTask = getTaskByIdStmt.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateStmt = db.prepare(
      'UPDATE tasks SET title = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(title.trim(), normalizedDueDate, id);

    const updatedTask = getTaskByIdStmt.get(id);
    res.json(serializeTask(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.patch('/api/tasks/:id/complete', (req, res) => {
  try {
    const id = parseTaskId(req.params.id);
    const { completed } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean value' });
    }

    const existingTask = getTaskByIdStmt.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const toggleStmt = db.prepare(
      'UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    toggleStmt.run(completed ? 1 : 0, id);

    const updatedTask = getTaskByIdStmt.get(id);
    res.json(serializeTask(updatedTask));
  } catch (error) {
    console.error('Error updating completion status:', error);
    res.status(500).json({ error: 'Failed to update completion status' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = parseTaskId(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = getTaskByIdStmt.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = deleteTaskByIdStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = {
  app,
  db,
  resetDatabase,
};