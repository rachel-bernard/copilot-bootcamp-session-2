const { test, expect } = require('@playwright/test');
const { TasksPage } = require('./pages/tasks-page');

test.describe('Todo workflow', () => {
  test('user can create, edit, sort, complete, and delete a task', async ({ page }) => {
    const tasksPage = new TasksPage(page);
    const taskTitle = `E2E Task ${Date.now()}`;
    const updatedTitle = `${taskTitle} Updated`;

    await tasksPage.goto();
    await expect(page.getByRole('heading', { name: 'Task Command Center' })).toBeVisible();

    await tasksPage.addTask(taskTitle, '2026-12-01');
    await expect(tasksPage.taskTitle(taskTitle)).toBeVisible();
    await expect(tasksPage.taskDueDate(taskTitle, '2026-12-01')).toBeVisible();

    await tasksPage.editTask(taskTitle, updatedTitle, '2026-12-05');
    await expect(tasksPage.taskTitle(updatedTitle)).toBeVisible();
    await expect(tasksPage.taskDueDate(updatedTitle, '2026-12-05')).toBeVisible();

    await tasksPage.sortTasks('Title', 'Ascending');
    await expect(tasksPage.taskTitle(updatedTitle)).toBeVisible();

    await tasksPage.toggleTaskCompletion(updatedTitle);
    await expect(tasksPage.taskRow(updatedTitle).getByText('Complete')).toBeVisible();

    await tasksPage.deleteTask(updatedTitle);
    await expect(tasksPage.taskRow(updatedTitle)).toHaveCount(0);
  });
});
