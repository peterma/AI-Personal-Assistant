function dashboard() {
    return {
        init() {
            this.loadAllData();
        },

        loadAllData() {
            this.loadTasks();
            this.loadBudget();
            this.loadHabits();
            this.loadNotes();
        },

        // Load functions
        loadTasks() {
            // Tasks are loaded from localStorage in renderUpcomingTasks
        },

        loadBudget() {
            // Budget data is loaded from localStorage in renderBudgetOverview
        },

        loadHabits() {
            // Habits are loaded from localStorage in renderHabitsOverview
        },

        loadNotes() {
            // Notes are loaded from localStorage in renderRecentNotes
        },

        // Tasks
        renderUpcomingTasks() {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const upcomingTasks = tasks
                .filter(task => task.status !== 'done')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 3);

            if (upcomingTasks.length === 0) {
                return '<p class="text-gray-500">No upcoming tasks</p>';
            }

            return upcomingTasks.map(task => `
                <div class="task-item p-3 rounded-lg border border-gray-200">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-medium ${this.isOverdue(task) ? 'text-red-600' : 'text-gray-800'}">${task.title}</h3>
                            <p class="text-sm text-gray-500">${task.description || 'No description'}</p>
                        </div>
                        <span class="text-sm ${this.isOverdue(task) ? 'text-red-600' : 'text-gray-500'}">
                            ${this.formatDate(task.dueDate)}
                        </span>
                    </div>
                </div>
            `).join('');
        },

        isOverdue(task) {
            if (!task.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
        },

        // Budget
        renderBudgetOverview() {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = income - expenses;

            return `
                <div class="budget-stats space-y-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-gray-600">Current Balance</span>
                        <span class="font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}">$${balance.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Income: <span class="text-green-600 font-medium">$${income.toFixed(2)}</span></span>
                        <span class="text-gray-600">Expenses: <span class="text-red-600 font-medium">$${expenses.toFixed(2)}</span></span>
                    </div>
                </div>
            `;
        },

        // Notes
        renderRecentNotes() {
            const notes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const recentNotes = notes.slice(0, 3);

            if (recentNotes.length === 0) {
                return '<p class="text-gray-500">No notes added yet</p>';
            }

            return recentNotes.map(note => `
                <div class="note-card p-3 rounded-lg" style="background-color: ${note.color || '#fff3cd'}">
                    <h3 class="font-medium text-gray-800">${note.title || 'Untitled'}</h3>
                    <p class="text-sm text-gray-600 mt-1">${note.content || ''}</p>
                </div>
            `).join('');
        },

        // Habits
        renderHabitsOverview() {
            const habits = JSON.parse(localStorage.getItem('habits') || '[]');
            const activeHabits = habits.slice(0, 3);

            if (activeHabits.length === 0) {
                return '<p class="text-gray-500">No habits tracked yet</p>';
            }

            return activeHabits.map(habit => `
                <div class="habit-item p-3 rounded-lg border border-gray-200">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-gray-800">${habit.name}</span>
                        <span class="text-sm ${habit.completed ? 'text-green-600' : 'text-gray-500'}">
                            ${habit.completed ? 'Completed' : 'Not completed'}
                        </span>
                    </div>
                    <div class="habit-progress">
                        <div class="habit-progress-bar bg-blue-600" style="width: ${habit.completed ? '100%' : '0%'}"></div>
                    </div>
                </div>
            `).join('');
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    };
}
