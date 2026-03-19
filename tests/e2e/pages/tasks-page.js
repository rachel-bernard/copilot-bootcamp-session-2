class TasksPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTask(title, dueDate) {
    await this.page.getByLabel('Task title').fill(title);
    if (dueDate) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }
    await this.page.getByRole('button', { name: 'Add Task' }).click();
  }

  taskRow(title) {
    return this.page.locator('li').filter({ hasText: title }).first();
  }

  taskTitle(title) {
    return this.taskRow(title).locator('span').first();
  }

  taskDueDate(title, dueDate) {
    return this.taskRow(title).getByText(`Due: ${dueDate}`);
  }

  async editTask(originalTitle, updatedTitle, updatedDueDate) {
    const row = this.taskRow(originalTitle);
    await row.getByRole('button', { name: 'Edit' }).click();

    const dialog = this.page.getByRole('dialog', { name: 'Edit Task' });
    await dialog.getByLabel('Task title').fill(updatedTitle);
    await dialog.getByLabel('Due date').fill(updatedDueDate);
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
  }

  async toggleTaskCompletion(title) {
    const row = this.taskRow(title);
    await row.getByRole('checkbox').click();
  }

  async deleteTask(title) {
    const row = this.taskRow(title);
    await row.getByRole('button', { name: 'Delete' }).click();
  }

  async sortTasks(sortBy, order) {
    await this.page.getByLabel('Sort by').click();
    await this.page.getByRole('option', { name: sortBy }).click();

    await this.page.getByLabel('Order').click();
    await this.page.getByRole('option', { name: order }).click();
  }
}

module.exports = { TasksPage };
