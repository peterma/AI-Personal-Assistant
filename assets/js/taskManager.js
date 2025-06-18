function taskManager() {
    return {
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
        templates: JSON.parse(localStorage.getItem('taskTemplates') || '[]'),
        currentView: 'list',
        showNewTaskModal: false,
        showTemplateModal: false,
        editingTask: null,
        editingTemplate: null,
        searchQuery: '',
        filterStatus: '',
        filterPriority: '',
        filterLocation: '',
        draggingId: null,
        showStatistics: false,
        points: parseInt(localStorage.getItem('taskPoints') || '0'),
        level: parseInt(localStorage.getItem('taskLevel') || '1'),
        badges: JSON.parse(localStorage.getItem('taskBadges') || '[]'),
        streak: parseInt(localStorage.getItem('taskStreak') || '0'),
        longestStreak: parseInt(localStorage.getItem('taskLongestStreak') || '0'),
        lastTaskDate: localStorage.getItem('taskLastTaskDate') || '',
        newTask: {
            id: '',
            title: '',
            description: '',
            dueDate: '',
            priority: 'medium',
            status: 'todo',
            location: 'other',
            recurringType: '', // daily, weekly, monthly, none
            recurringEndDate: '',
            completionHistory: [], // Array of completion timestamps
            templateId: '' // If created from template
        },
        newTemplate: {
            id: '',
            title: '',
            description: '',
            priority: 'medium',
            location: 'other',
            estimatedDuration: 0 // in minutes
        },
        statistics: {
            weeklyCompletion: [],
            averageCompletionTime: 0,
            mostProductiveDay: '',
            mostProductiveTime: ''
        },

        init() {
            this.$watch('tasks', (value) => {
                localStorage.setItem('tasks', JSON.stringify(value));
                this.updateStatistics();
                this.updateGamification();
            });

            this.$watch('templates', (value) => {
                localStorage.setItem('taskTemplates', JSON.stringify(value));
            });

            this.updateStatistics();
            this.updateGamification();
        },

        getTotalTasks() {
            return this.tasks.length;
        },

        getCompletedTasks() {
            return this.tasks.filter(task => task.status === 'done').length;
        },

        getOverdueTasks() {
            return this.tasks.filter(task => this.isOverdue(task)).length;
        },

        getCompletionRate() {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentTasks = this.tasks.filter(task => {
                const dueDate = new Date(task.dueDate);
                return dueDate >= thirtyDaysAgo;
            });

            if (recentTasks.length === 0) return '0%';

            const completedRecentTasks = recentTasks.filter(task => 
                task.status === 'done'
            );

            const rate = (completedRecentTasks.length / recentTasks.length) * 100;
            return `${Math.round(rate)}%`;
        },

        isOverdue(task) {
            if (task.status === 'done' || !task.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
        },

        get filteredTasks() {
            return this.tasks.filter(task => {
                const matchesSearch = !this.searchQuery || 
                    task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    task.description.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesStatus = !this.filterStatus || task.status === this.filterStatus;
                const matchesPriority = !this.filterPriority || task.priority === this.filterPriority;
                const matchesLocation = !this.filterLocation || task.location === this.filterLocation;
                return matchesSearch && matchesStatus && matchesPriority && matchesLocation;
            });
        },

        get stats() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return {
                total: this.tasks.length,
                inProgress: this.tasks.filter(task => task.status === 'inprogress').length,
                completed: this.tasks.filter(task => task.status === 'done').length,
                dueToday: this.tasks.filter(task => {
                    if (task.status === 'done' || !task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                }).length
            };
        },

        getTasksByStatus(status) {
            return this.filteredTasks.filter(task => task.status === status);
        },

        editTask(task) {
            this.editingTask = task;
            this.newTask = { ...task };
            this.showNewTaskModal = true;
        },

        closeTaskModal() {
            this.showNewTaskModal = false;
            this.editingTask = null;
            this.newTask = {
                id: '',
                title: '',
                description: '',
                dueDate: '',
                priority: 'medium',
                status: 'todo',
                location: 'other',
                completionHistory: []
            };
        },

        // New functions for recurring tasks
        createRecurringTasks() {
            const today = new Date();
            this.tasks.forEach(task => {
                if (task.recurringType && task.status === 'done' && task.completionHistory && task.completionHistory.length > 0) {
                    const lastCompletion = new Date(task.completionHistory[task.completionHistory.length - 1]);
                    let nextDueDate = new Date(task.dueDate);

                    switch(task.recurringType) {
                        case 'daily':
                            nextDueDate.setDate(nextDueDate.getDate() + 1);
                            break;
                        case 'weekly':
                            nextDueDate.setDate(nextDueDate.getDate() + 7);
                            break;
                        case 'monthly':
                            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                            break;
                    }

                    if (nextDueDate > today && (!task.recurringEndDate || new Date(task.recurringEndDate) > nextDueDate)) {
                        const newTask = {
                            ...task,
                            id: Date.now().toString(),
                            status: 'todo',
                            dueDate: nextDueDate.toISOString().split('T')[0],
                            completionHistory: []
                        };
                        this.tasks.push(newTask);
                    }
                }
            });
        },

        // Template management
        saveTemplate() {
            if (this.editingTemplate) {
                const index = this.templates.findIndex(t => t.id === this.editingTemplate.id);
                if (index !== -1) {
                    this.templates[index] = { ...this.newTemplate };
                }
            } else {
                this.templates.push({
                    ...this.newTemplate,
                    id: Date.now().toString()
                });
            }
            this.closeTemplateModal();
        },

        createTaskFromTemplate(template) {
            this.newTask = {
                ...this.newTask,
                title: template.title,
                description: template.description,
                priority: template.priority,
                location: template.location,
                templateId: template.id,
                completionHistory: []
            };
            this.showNewTaskModal = true;
        },

        // Statistics and Analytics
        updateStatistics() {
            const completedTasks = this.tasks.filter(t => t.status === 'done' && t.completionHistory && t.completionHistory.length > 0);
            
            // Weekly completion rates
            const weeklyStats = {};
            const now = new Date();
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

            completedTasks.forEach(task => {
                const completionDate = new Date(task.completionHistory[task.completionHistory.length - 1]);
                if (completionDate >= oneWeekAgo) {
                    const dayKey = completionDate.toLocaleDateString('en-US', { weekday: 'long' });
                    weeklyStats[dayKey] = (weeklyStats[dayKey] || 0) + 1;
                }
            });
            this.statistics.weeklyCompletion = Object.entries(weeklyStats)
                .map(([day, count]) => ({ day, count }));

            // Most productive time/day
            const timeStats = {};
            const dayStats = {};
            completedTasks.forEach(task => {
                const completionDate = new Date(task.completionHistory[task.completionHistory.length - 1]);
                const hour = completionDate.getHours();
                const day = completionDate.toLocaleDateString('en-US', { weekday: 'long' });
                
                timeStats[hour] = (timeStats[hour] || 0) + 1;
                dayStats[day] = (dayStats[day] || 0) + 1;
            });

            this.statistics.mostProductiveTime = Object.entries(timeStats)
                .reduce((a, b) => a[1] > b[1] ? a : b, [0, 0])[0];
            this.statistics.mostProductiveDay = Object.entries(dayStats)
                .reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
        },

        // Smart Suggestions
        getSuggestedPriority(task) {
            // Safety check for incomplete task object
            if (!task || !task.dueDate) {
                return 'medium'; // Default priority
            }

            // Factor 1: Due date proximity
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            // Factor 2: Historical completion patterns
            const similarTasks = this.tasks.filter(t => 
                t.status === 'done' && 
                t.completionHistory && 
                t.completionHistory.length > 0 &&
                (t.templateId === task.templateId || t.title.toLowerCase().includes(task.title.toLowerCase()))
            );

            const averageCompletionTime = similarTasks.reduce((acc, t) => {
                const created = new Date(t.id); // Using ID as creation timestamp
                const completed = new Date(t.completionHistory[t.completionHistory.length - 1]);
                return acc + (completed - created);
            }, 0) / (similarTasks.length || 1);

            // Calculate priority based on factors
            if (daysUntilDue <= 2 || averageCompletionTime > 172800000) { // 48 hours in ms
                return 'high';
            } else if (daysUntilDue <= 5 || averageCompletionTime > 86400000) { // 24 hours in ms
                return 'medium';
            }
            return 'low';
        },

        // Override the original save task to include completion tracking and gamification
        saveTask() {
            if (this.editingTask) {
                const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
                if (index !== -1) {
                    // If status changed to done, add completion timestamp
                    if (this.newTask.status === 'done' && this.tasks[index].status !== 'done') {
                        this.newTask.completionHistory = [
                            ...(this.tasks[index].completionHistory || []),
                            new Date().toISOString()
                        ];
                    }
                    this.tasks[index] = { ...this.newTask };
                }
            } else {
                const suggestedPriority = this.getSuggestedPriority(this.newTask);
                this.tasks.push({
                    ...this.newTask,
                    id: Date.now().toString(),
                    completionHistory: [],
                    priority: this.newTask.priority || suggestedPriority
                });
            }
            this.closeTaskModal();
            this.createRecurringTasks();
            this.updateGamification();
        },

        dragStart(event, task) {
            this.draggingId = task.id;
            event.dataTransfer.setData('text/plain', task.id);
        },

        dragOver(event) {
            event.preventDefault();
            event.target.closest('div').classList.add('drag-over');
        },

        drop(event, status) {
            event.preventDefault();
            const taskId = event.dataTransfer.getData('text/plain');
            const task = this.tasks.find(t => t.id === taskId);
            if (task && task.status !== status) {
                task.status = status;
                this.tasks = [...this.tasks];
            }
            this.draggingId = null;
            event.target.closest('div').classList.remove('drag-over');
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        updateGamification() {
            const completedCount = this.getCompletedTasks();
            this.points = completedCount * 10;
            this.level = Math.floor(this.points / 100) + 1;
            localStorage.setItem('taskPoints', this.points);
            localStorage.setItem('taskLevel', this.level);

            const today = new Date();
            today.setHours(0,0,0,0);
            let streak = 0;
            let longest = 0;
            let current = 0;
            let prevDate = null;
            const days = [...new Set(this.tasks.filter(t => t.status === 'done' && t.completionHistory && t.completionHistory.length > 0)
                .map(t => (new Date(t.completionHistory[t.completionHistory.length-1])).toISOString().split('T')[0]))]
                .sort();
            for (let i = 0; i < days.length; i++) {
                const d = new Date(days[i]);
                if (prevDate) {
                    const diff = (d - prevDate) / (1000*60*60*24);
                    if (diff === 1) {
                        current++;
                    } else {
                        if (current > longest) longest = current;
                        current = 1;
                    }
                } else {
                    current = 1;
                }
                prevDate = d;
            }
            if (current > longest) longest = current;
            if (days.length && days[days.length-1] === today.toISOString().split('T')[0]) {
                streak = current;
            } else {
                streak = 0;
            }
            this.streak = streak;
            this.longestStreak = longest;
            localStorage.setItem('taskStreak', streak);
            localStorage.setItem('taskLongestStreak', longest);

            const badges = [];
            if (completedCount >= 10) badges.push({ name: '10 Tasks', icon: 'fa-medal', desc: 'Completed 10 tasks!' });
            if (completedCount >= 50) badges.push({ name: '50 Tasks', icon: 'fa-trophy', desc: 'Completed 50 tasks!' });
            if (completedCount >= 100) badges.push({ name: '100 Tasks', icon: 'fa-crown', desc: 'Completed 100 tasks!' });
            if (longest >= 7) badges.push({ name: '7-Day Streak', icon: 'fa-fire', desc: '7 days of daily task completion!' });
            if (streak > 0 && this.stats.dueToday === 0) badges.push({ name: 'Zero Inbox', icon: 'fa-inbox', desc: 'All tasks done today!' });
            this.badges = badges;
            localStorage.setItem('taskBadges', JSON.stringify(badges));
        }
    };
}
