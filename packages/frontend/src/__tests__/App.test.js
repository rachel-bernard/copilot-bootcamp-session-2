import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let mockedTasks = [];
let idCounter = 3;

const buildTask = (id, title, dueDate = null, completed = false) => ({
  id,
  title,
  dueDate,
  completed,
  createdAt: '2026-03-19T10:00:00.000Z',
  updatedAt: '2026-03-19T10:00:00.000Z',
});

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockedTasks));
  }),
  rest.post('/api/tasks', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.title || body.title.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    const task = buildTask(idCounter, body.title, body.dueDate || null, false);
    idCounter += 1;
    mockedTasks = [...mockedTasks, task];
    return res(ctx.status(201), ctx.json(task));
  }),
  rest.put('/api/tasks/:id', async (req, res, ctx) => {
    const body = await req.json();
    const id = Number(req.params.id);
    mockedTasks = mockedTasks.map((task) =>
      task.id === id ? { ...task, title: body.title, dueDate: body.dueDate || null } : task
    );
    return res(ctx.status(200), ctx.json(mockedTasks.find((task) => task.id === id)));
  }),
  rest.patch('/api/tasks/:id/complete', async (req, res, ctx) => {
    const body = await req.json();
    const id = Number(req.params.id);
    mockedTasks = mockedTasks.map((task) =>
      task.id === id ? { ...task, completed: body.completed } : task
    );
    return res(ctx.status(200), ctx.json(mockedTasks.find((task) => task.id === id)));
  }),
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    mockedTasks = mockedTasks.filter((task) => task.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id }));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockedTasks = [
    buildTask(1, 'Plan sprint tasks', '2026-03-22', false),
    buildTask(2, 'Review pull requests', null, true),
  ];
  idCounter = 3;
});
afterAll(() => server.close());

describe('App Component', () => {
  beforeEach(() => {
    mockedTasks = [
      buildTask(1, 'Plan sprint tasks', '2026-03-22', false),
      buildTask(2, 'Review pull requests', null, true),
    ];
    idCounter = 3;
  });

  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Task Command Center')).toBeInTheDocument();
    expect(screen.getByText('Organize, prioritize, and ship your day')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Plan sprint tasks')).toBeInTheDocument();
      expect(screen.getByText('Review pull requests')).toBeInTheDocument();
    });
  });

  test('adds a new task with due date', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Task title');
    const dueDateInput = screen.getByLabelText('Due date');

    await act(async () => {
      await user.type(titleInput, 'Ship release notes');
      await user.type(dueDateInput, '2026-04-15');
    });

    const submitButton = screen.getByRole('button', { name: 'Add Task' });
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ship release notes')).toBeInTheDocument();
      expect(screen.getByText('Due: 2026-04-15')).toBeInTheDocument();
    });
  });

  test('marks a task complete and then deletes it', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Plan sprint tasks')).toBeInTheDocument();
    });

    const completionToggles = screen.getAllByRole('checkbox');
    await act(async () => {
      await user.click(completionToggles[0]);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    });

    const firstDeleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
    await act(async () => {
      await user.click(firstDeleteButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Plan sprint tasks')).not.toBeInTheDocument();
    });
  });

  test('edits a task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Plan sprint tasks')).toBeInTheDocument();
    });

    const firstEditButton = screen.getAllByRole('button', { name: 'Edit' })[0];
    await act(async () => {
      await user.click(firstEditButton);
    });

    const dialogTitleInput = screen.getAllByLabelText('Task title')[1];
    await act(async () => {
      await user.clear(dialogTitleInput);
      await user.type(dialogTitleInput, 'Plan sprint retro');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Plan sprint retro')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('No tasks found. Add your first one.')).toBeInTheDocument();
    });
  });
});