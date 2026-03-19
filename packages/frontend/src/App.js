import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';

const BLUE_THEME = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#1e88e5' },
    background: { default: '#eef4fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
});

const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'title', label: 'Title' },
  { value: 'completed', label: 'Completion' },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingTask, setEditingTask] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');

  const queryString = useMemo(
    () => `sortBy=${encodeURIComponent(sortBy)}&sortOrder=${encodeURIComponent(sortOrder)}`,
    [sortBy, sortOrder]
  );

  useEffect(() => {
    fetchData();
  }, [queryString]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?${queryString}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch tasks: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        dueDate: newDueDate || null,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      await fetchData();
      setNewTitle('');
      setNewDueDate('');
      setError(null);
    } catch (err) {
      setError(`Error adding task: ${err.message}`);
      console.error('Error adding task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter((task) => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError(`Error deleting task: ${err.message}`);
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update completion');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map((existing) => (existing.id === updatedTask.id ? updatedTask : existing)));
      setError(null);
    } catch (err) {
      setError(`Error updating completion: ${err.message}`);
    }
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setEditingTitle(task.title);
    setEditingDueDate(task.dueDate || '');
  };

  const closeEditDialog = () => {
    setEditingTask(null);
    setEditingTitle('');
    setEditingDueDate('');
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTitle.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
          dueDate: editingDueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      closeEditDialog();
      setError(null);
    } catch (err) {
      setError(`Error updating task: ${err.message}`);
    }
  };

  return (
    <ThemeProvider theme={BLUE_THEME}>
      <CssBaseline />
      <Box className="app-shell">
        <AppBar position="static" className="hero-bar">
          <Toolbar>
            <Box>
              <Typography variant="h5" component="h1" fontWeight={700}>
                Task Command Center
              </Typography>
              <Typography variant="body2">Organize, prioritize, and ship your day</Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" className="main-content">
          <Card className="panel-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Task
              </Typography>
              <Box component="form" onSubmit={handleCreateTask} className="create-form">
                <TextField
                  fullWidth
                  label="Task title"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Example: Finalize sprint report"
                />
                <TextField
                  label="Due date"
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button type="submit" variant="contained" size="large">
                  Add Task
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card className="panel-card">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className="sort-row">
                <Typography variant="h6" flex={1}>
                  Tasks
                </Typography>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="sort-by-label">Sort by</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    value={sortBy}
                    label="Sort by"
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    {SORT_BY_OPTIONS.map((option) => (
                      <MenuItem value={option.value} key={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel id="sort-order-label">Order</InputLabel>
                  <Select
                    labelId="sort-order-label"
                    value={sortOrder}
                    label="Order"
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {loading && <Typography>Loading tasks...</Typography>}
              {error && <Alert severity="error">{error}</Alert>}

              {!loading && !error && (
                <List className="tasks-list">
                  {tasks.length === 0 && <Typography>No tasks found. Add your first one.</Typography>}
                  {tasks.map((task) => (
                    <ListItem key={task.id} divider className="task-row">
                      <Checkbox
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                        inputProps={{ 'aria-label': `toggle completion for ${task.title}` }}
                      />
                      <ListItemText
                        primary={task.title}
                        secondary={task.dueDate ? `Due: ${task.dueDate}` : 'No due date'}
                        primaryTypographyProps={{
                          className: task.completed ? 'completed-task' : '',
                        }}
                      />
                      {task.completed ? (
                        <Chip label="Complete" color="primary" variant="outlined" sx={{ mr: 1 }} />
                      ) : null}
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => openEditDialog(task)}>
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Container>

        <Dialog open={Boolean(editingTask)} onClose={closeEditDialog} fullWidth maxWidth="sm">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Task title"
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                fullWidth
              />
              <TextField
                label="Due date"
                type="date"
                value={editingDueDate}
                onChange={(event) => setEditingDueDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateTask}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;