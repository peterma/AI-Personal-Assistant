// Demo Data Injector for AI Personal Assistant
(function() {
    // --- Tasks ---
    if (!localStorage.getItem('tasks') || localStorage.getItem('tasks') === '[]') {
        const demoTasks = [
            {
                id: '1',
                title: 'Buy groceries',
                description: 'Milk, eggs, bread, and fruit',
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                priority: 'medium',
                status: 'todo',
                location: 'home',
                recurringType: '',
                recurringEndDate: '',
                completionHistory: [],
                templateId: ''
            },
            {
                id: '2',
                title: 'Finish project report',
                description: 'Complete the final draft for the AI project',
                dueDate: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
                priority: 'high',
                status: 'inprogress',
                location: 'office',
                recurringType: '',
                recurringEndDate: '',
                completionHistory: [],
                templateId: ''
            },
            {
                id: '3',
                title: 'Call John',
                description: 'Discuss the new business proposal',
                dueDate: new Date(Date.now() + 5*86400000).toISOString().split('T')[0],
                priority: 'low',
                status: 'done',
                location: 'other',
                recurringType: '',
                recurringEndDate: '',
                completionHistory: [new Date(Date.now() - 86400000).toISOString()],
                templateId: ''
            }
        ];
        localStorage.setItem('tasks', JSON.stringify(demoTasks));
    }

    // --- Sticky Notes ---
    if (!localStorage.getItem('stickyNotes') || localStorage.getItem('stickyNotes') === '[]') {
        const now = new Date().toISOString();
        const demoNotes = [
            {
                id: 1,
                title: 'Welcome!',
                content: 'This is your first sticky note. **Markdown** supported!',
                type: 'general',
                color: 'yellow',
                tags: [],
                pinned: false,
                createdAt: now,
                updatedAt: now,
                isEditing: false,
                titlePlaceholder: false,
                contentPlaceholder: false
            },
            {
                id: 2,
                title: 'Meeting',
                content: 'Project sync at 2pm.\n- Bring slides\n- Demo new features',
                type: 'meeting',
                color: 'blue',
                tags: [],
                pinned: false,
                createdAt: now,
                updatedAt: now,
                isEditing: false,
                titlePlaceholder: false,
                contentPlaceholder: false
            },
            {
                id: 3,
                title: 'Urgent!',
                content: 'Pay electricity bill by Friday.',
                type: 'emergency',
                color: 'pink',
                tags: [],
                pinned: false,
                createdAt: now,
                updatedAt: now,
                isEditing: false,
                titlePlaceholder: false,
                contentPlaceholder: false
            }
        ];
        localStorage.setItem('stickyNotes', JSON.stringify(demoNotes));
    }

    // --- Habits ---
    if (!localStorage.getItem('habits') || localStorage.getItem('habits') === '[]') {
        const today = new Date();
        const ymd = (d) => d.toISOString().split('T')[0];
        const demoHabits = [
            {
                id: 'h1',
                name: 'Drink 2L water',
                completedDates: [ymd(new Date(today.getTime() - 86400000)), ymd(today)]
            },
            {
                id: 'h2',
                name: 'Read 10 pages',
                completedDates: [ymd(new Date(today.getTime() - 2*86400000)), ymd(new Date(today.getTime() - 86400000))]
            },
            {
                id: 'h3',
                name: 'Morning walk',
                completedDates: []
            }
        ];
        localStorage.setItem('habits', JSON.stringify(demoHabits));
    }

    // --- Budget/Transactions ---
    if (!localStorage.getItem('transactions') || localStorage.getItem('transactions') === '[]') {
        const today = new Date();
        const ymd = (d) => d.toISOString().split('T')[0];
        const demoTransactions = [
            {
                id: 1,
                type: 'income',
                amount: 2000,
                category: 'salary',
                categoryDisplay: 'Salary',
                description: 'Monthly Salary',
                date: ymd(today)
            },
            {
                id: 2,
                type: 'expense',
                amount: 150,
                category: 'food',
                categoryDisplay: 'Food',
                description: 'Groceries',
                date: ymd(new Date(today.getTime() - 2*86400000))
            },
            {
                id: 3,
                type: 'expense',
                amount: 60,
                category: 'transport',
                categoryDisplay: 'Transport',
                description: 'Bus pass',
                date: ymd(new Date(today.getTime() - 5*86400000))
            },
            {
                id: 4,
                type: 'income',
                amount: 300,
                category: 'other',
                categoryDisplay: 'Other',
                description: 'Freelance work',
                date: ymd(new Date(today.getTime() - 10*86400000))
            }
        ];
        localStorage.setItem('transactions', JSON.stringify(demoTransactions));
    }
})(); 