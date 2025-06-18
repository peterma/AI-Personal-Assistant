// Create a class to handle the habit tracker functionality
class HabitTracker {
    constructor() {
        // Get references to DOM elements
        this.habitInput = document.getElementById('habitInput');
        this.addHabitBtn = document.getElementById('addHabitBtn');
        this.habitList = document.getElementById('habitList');
        
        // Array to store habit objects
        this.habits = [];
        
        this.init();
    }
    
    init() {
        // Check if we're on the correct page - look for habit tracker specific elements
        if (!document.getElementById('habitInput') || !document.getElementById('habitList')) {
            console.log('Habit Tracker: Not on the correct page, skipping initialization');
            return;
        }

        // Validate required DOM elements
        if (!this.habitInput || !this.addHabitBtn || !this.habitList) {
            console.error('Required DOM elements not found:', {
                addHabitBtn: !!this.addHabitBtn,
                habitInput: !!this.habitInput,
                habitList: !!this.habitList
            });
            return;
        }

        // Add event listeners
        this.addHabitBtn.addEventListener('click', () => this.addHabit());
        this.habitInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.addHabit();
            }
        });

        // Load habits when initialized
        this.loadHabits();
        console.log('Habit Tracker initialized successfully');
    }

    /**
     * Generates a unique ID for a new habit.
     * @returns {string} A unique ID.
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Saves the current habits array to localStorage.
     */
    saveHabits() {
        try {
            localStorage.setItem('habits', JSON.stringify(this.habits));
        } catch (e) {
            console.error("Error saving habits to localStorage:", e);
            // Optionally, show a user-friendly message about storage issues
        }
    }

    /**
     * Loads habits from localStorage when the page loads.
     */
    loadHabits() {
        try {
            const storedHabits = localStorage.getItem('habits');
            if (storedHabits) {
                this.habits = JSON.parse(storedHabits);
            }
        } catch (e) {
            console.error("Error loading habits from localStorage:", e);
            // Clear corrupted data if parsing fails
            localStorage.removeItem('habits');
            this.habits = [];
        }
        this.renderHabits(); // Render habits after loading
    }

    // --- Streak Calculation ---
    getCurrentStreak(habit) {
        if (!habit.completedDates || habit.completedDates.length === 0) return 0;
        const dates = [...habit.completedDates].sort();
        let streak = 0;
        let today = new Date();
        today.setHours(0,0,0,0);
        for (let i = dates.length - 1; i >= 0; i--) {
            const date = new Date(dates[i]);
            date.setHours(0,0,0,0);
            if (streak === 0 && date.getTime() === today.getTime()) {
                streak = 1;
            } else if (streak > 0) {
                const prev = new Date(today);
                prev.setDate(today.getDate() - streak);
                if (date.getTime() === prev.getTime()) {
                    streak++;
                } else {
                    break;
                }
            }
        }
        return streak;
    }

    getLongestStreak(habit) {
        if (!habit.completedDates || habit.completedDates.length === 0) return 0;
        const dates = [...habit.completedDates].sort();
        let longest = 0, current = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i-1]);
            const curr = new Date(dates[i]);
            prev.setHours(0,0,0,0);
            curr.setHours(0,0,0,0);
            const diff = (curr - prev) / (1000*60*60*24);
            if (diff === 1) {
                current++;
            } else if (diff > 1) {
                if (current > longest) longest = current;
                current = 1;
            }
        }
        if (current > longest) longest = current;
        return longest;
    }

    // --- Calendar Rendering ---
    renderCalendar(habit) {
        // Show current month, highlight completed days
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const completedSet = new Set((habit.completedDates || []).filter(dateStr => {
            const d = new Date(dateStr);
            return d.getFullYear() === year && d.getMonth() === month;
        }));
        let html = '<div class="habit-calendar"><div class="calendar-row">';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isCompleted = completedSet.has(dateStr);
            html += `<span class="calendar-day${isCompleted ? ' completed' : ''}">${d}</span>`;
            if (d % 7 === 0) html += '</div><div class="calendar-row">';
        }
        html += '</div></div>';
        return html;
    }

    /**
     * Renders the habits array to the DOM.
     * Clears the current list and re-creates all habit items.
     */
    renderHabits() {
        this.habitList.innerHTML = '';
        if (this.habits.length === 0) {
            const noHabitsMessage = document.createElement('li');
            noHabitsMessage.className = 'text-center text-gray-500 py-4';
            noHabitsMessage.textContent = 'No habits added yet. Start tracking!';
            this.habitList.appendChild(noHabitsMessage);
            return;
        }
        this.habits.forEach(habit => {
            const listItem = document.createElement('li');
            // Card style
            // Top row: .habit-card-header
            const headerRow = document.createElement('div');
            headerRow.className = 'habit-card-header';
            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            const todayStr = new Date().toISOString().split('T')[0];
            checkbox.checked = (habit.completedDates || []).includes(todayStr);
            checkbox.className = 'form-checkbox h-5 w-5 text-blue-600 rounded mr-3';
            checkbox.addEventListener('change', () => this.toggleHabitCompletion(habit.id));
            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'habit-card-title';
            titleSpan.textContent = habit.name;
            // Streaks
            const streaksDiv = document.createElement('span');
            streaksDiv.className = 'habit-card-streaks';
            streaksDiv.innerHTML = `🔥 Streak: <b>${this.getCurrentStreak(habit)}</b> | 🏆 Longest: <b>${this.getLongestStreak(habit)}</b>`;
            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'habit-card-delete p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 ease-in-out';
            deleteButton.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            `;
            deleteButton.addEventListener('click', () => this.deleteHabit(habit.id));
            // Assemble header
            headerRow.appendChild(checkbox);
            headerRow.appendChild(titleSpan);
            headerRow.appendChild(streaksDiv);
            headerRow.appendChild(deleteButton);
            // Calendar
            const calendarDiv = document.createElement('div');
            calendarDiv.innerHTML = this.renderCalendar(habit);
            calendarDiv.className = 'habit-calendar';
            // Assemble card
            listItem.appendChild(headerRow);
            listItem.appendChild(calendarDiv);
            this.habitList.appendChild(listItem);
        });
    }

    /**
     * Adds a new habit to the list.
     */
    addHabit() {
        const habitName = this.habitInput.value.trim();
        if (habitName) {
            const newHabit = {
                id: this.generateUniqueId(),
                name: habitName,
                completedDates: []
            };
            this.habits.push(newHabit);
            this.habitInput.value = ''; // Clear input field
            this.saveHabits();
            this.renderHabits();
        }
    }

    /**
     * Toggles the completion status of a habit.
     * @param {string} id - The unique ID of the habit to toggle.
     */
    toggleHabitCompletion(id) {
        const todayStr = new Date().toISOString().split('T')[0];
        this.habits = this.habits.map(habit => {
            if (habit.id === id) {
                let completedDates = habit.completedDates || [];
                if (completedDates.includes(todayStr)) {
                    completedDates = completedDates.filter(date => date !== todayStr);
                } else {
                    completedDates.push(todayStr);
                }
                return { ...habit, completedDates };
            }
            return habit;
        });
        this.saveHabits();
        this.renderHabits();
    }

    /**
     * Deletes a habit from the list.
     * @param {string} id - The unique ID of the habit to delete.
     */
    deleteHabit(id) {
        this.habits = this.habits.filter(habit => habit.id !== id);
        this.saveHabits();
        this.renderHabits();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the habit tracker page before initializing
    const isHabitTrackerPage = window.location.href.includes('Habit_Tracker.html') || 
                               document.title.includes('Habit Tracker');
    
    if (!isHabitTrackerPage) {
        console.log('Habit Tracker: Not on habit tracker page, skipping initialization');
        return;
    }

    try {
        const tracker = new HabitTracker();
    } catch (error) {
        console.error('Error initializing Habit Tracker:', error);
    }
});
