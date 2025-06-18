/**
 * Theme Manager for AI Personal Assistant
 * Handles theme switching and localStorage persistence
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = ['light', 'dark', 'ocean'];
        this.init();
    }

    init() {
        // Load saved theme from localStorage
        this.loadTheme();
        
        // Create theme switcher if it doesn't exist
        this.createThemeSwitcher();
        
        // Apply the current theme
        this.applyTheme(this.currentTheme);
        
        console.log('Theme Manager initialized with theme:', this.currentTheme);
    }

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('app-theme');
            if (savedTheme && this.themes.includes(savedTheme)) {
                this.currentTheme = savedTheme;
            } else {
                // Default to light theme if no saved theme or invalid theme
                this.currentTheme = 'light';
                localStorage.setItem('app-theme', 'light');
            }
        } catch (error) {
            console.warn('Could not load theme from localStorage:', error);
            this.currentTheme = 'light';
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem('app-theme', theme);
            this.currentTheme = theme;
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    }

    applyTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn('Invalid theme:', theme);
            return;
        }

        // Remove all theme classes
        document.documentElement.removeAttribute('data-theme');
        
        // Apply new theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme switcher UI
        this.updateThemeSwitcherUI(theme);
        
        // Save theme preference
        this.saveTheme(theme);
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
        
        console.log('Theme applied:', theme);
    }

    createThemeSwitcher() {
        // Check if theme switcher already exists
        if (document.querySelector('.theme-switcher')) {
            return;
        }

        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        themeSwitcher.innerHTML = `
            <div class="theme-option" data-theme="light" title="Light Theme">
                <i class="fas fa-sun"></i>
            </div>
            <div class="theme-option" data-theme="dark" title="Dark Theme">
                <i class="fas fa-moon"></i>
            </div>
            <div class="theme-option" data-theme="ocean" title="Ocean Theme">
                <i class="fas fa-water"></i>
            </div>
        `;

        // Add click event listeners
        themeSwitcher.addEventListener('click', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                const theme = themeOption.dataset.theme;
                this.applyTheme(theme);
            }
        });

        // Add to body
        document.body.appendChild(themeSwitcher);
    }

    updateThemeSwitcherUI(activeTheme) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === activeTheme) {
                option.classList.add('active');
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // Method to cycle through themes
    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];
        this.applyTheme(nextTheme);
    }

    // Method to set specific theme
    setTheme(theme) {
        this.applyTheme(theme);
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global theme manager instance
    window.themeManager = new ThemeManager();
    
    // Add keyboard shortcut for theme cycling (Ctrl/Cmd + T)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            window.themeManager.cycleTheme();
        }
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} 