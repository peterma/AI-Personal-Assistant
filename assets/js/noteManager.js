class NoteManager {
    constructor() {
        this.notes = [];
        this.templates = [];
        this.nextId = 1;
        this.noteToDelete = null;
        this.searchQuery = '';
        this.searchDebounceTimer = null;

        // Note colors
        this.colors = {
            yellow: '#fff3cd',
            blue: '#cce5ff',
            green: '#d4edda',
            pink: '#f8d7da',
            purple: '#e2d9f3',
            white: '#ffffff'
        };

        // Note types with Font Awesome icons and colors
        this.noteTypes = {
            general: { label: 'General', icon: 'fa-note-sticky', color: 'yellow' },
            todo: { label: 'TODO', icon: 'fa-check-square', color: 'blue' },
            emergency: { label: 'Emergency', icon: 'fa-exclamation-triangle', color: 'pink' },
            reminder: { label: 'Reminder', icon: 'fa-clock', color: 'purple' },
            meeting: { label: 'Meeting', icon: 'fa-users', color: 'green' },
            idea: { label: 'Idea', icon: 'fa-lightbulb', color: 'yellow' },
            important: { label: 'Important', icon: 'fa-star', color: 'white' }
        };
    }

    initialize() {
        // Debug: Check what page we're on
        console.log('Note Manager: Checking page...', {
            title: document.title,
            url: window.location.href,
            hasSearchInput: !!document.getElementById('searchInput'),
            hasNotesGrid: !!document.getElementById('notesGrid')
        });

        // Check if we're on the correct page - look for sticky notes specific elements
        const searchInput = document.getElementById('searchInput');
        const notesGrid = document.getElementById('notesGrid');
        const markdownHelp = document.getElementById('markdownHelp');
        const emptyState = document.getElementById('emptyState');
        
        // Check for multiple key elements to ensure we're on the right page
        if (!searchInput || !notesGrid || !markdownHelp || !emptyState) {
            console.log('Note Manager: Not on the correct page, skipping initialization');
            console.log('Found elements:', {
                searchInput: !!searchInput,
                notesGrid: !!notesGrid,
                markdownHelp: !!markdownHelp,
                emptyState: !!emptyState
            });
            return;
        }

        // Initialize DOM elements
        this.elements = {
            searchInput: searchInput,
            notesGrid: notesGrid,
            markdownHelp: markdownHelp,
            emptyState: emptyState,
            confirmModal: document.getElementById('confirmModal'),
            templatesModal: document.getElementById('templatesModal'),
            templatesList: document.getElementById('templatesList'),
            relatedNotes: document.getElementById('relatedNotes')
        };

        // Validate required elements
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.error('Required DOM elements not found:', missingElements);
            console.log('Available elements:', Object.entries(this.elements)
                .filter(([key, element]) => element)
                .map(([key]) => key));
            throw new Error('Required DOM elements not found. Check if you are on the correct page.');
        }

        // Initialize the app
        this.setupEventListeners();
        this.loadNotes();
        this.loadTemplates();
        this.renderNotes();
        this.updateRelatedNotes();
        this.hideTemplatesModal();
        this.hideConfirmModal();
        
        console.log('Note Manager initialized successfully');
    }

    setupEventListeners() {
        // Setup search with debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = setTimeout(() => {
                    this.searchQuery = this.elements.searchInput.value.toLowerCase();
                    this.renderNotes();
                }, 300);
            });
        }

        // Setup template and note action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (action === 'showTemplates') {
                    this.showTemplates();
                } else if (action === 'addNote') {
                    this.addNote();
                }
            });
        });

        // Setup dynamic event delegation for note actions
        if (this.elements.notesGrid) {
            this.elements.notesGrid.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-action]');
                if (!actionBtn) return;

                const action = actionBtn.dataset.action;
                const noteId = parseInt(actionBtn.closest('.note').dataset.id);

                switch (action) {
                    case 'edit':
                        this.toggleEdit(noteId);
                        break;
                    case 'save':
                        this.saveNote(noteId);
                        break;
                    case 'delete':
                        this.deleteNote(noteId);
                        break;
                    case 'color':
                        const color = actionBtn.dataset.color;
                        if (color) this.changeColor(noteId, color);
                        break;
                }
            });
        }
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('stickyNotes');
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
            this.nextId = Math.max(...this.notes.map(n => n.id), 0) + 1;
        }
    }

    loadTemplates() {
        const savedTemplates = localStorage.getItem('noteTemplates');
        if (savedTemplates) {
            this.templates = JSON.parse(savedTemplates);
        }
    }

    saveTemplate() {
        if (this.selectedTemplate) {
            this.selectedTemplate.templateName = document.getElementById('templateName').value;
            this.selectedTemplate.templateContent = document.getElementById('templateContent').value;
        } else {
            this.selectedTemplate = {
                templateName: document.getElementById('templateName').value,
                templateContent: document.getElementById('templateContent').value
            }
        }

        this.templates.push(this.selectedTemplate);
        this.saveTemplates();
        this.hideTemplatesModal();
        this.renderNotes();
    }

    saveNotes() {
        localStorage.setItem('stickyNotes', JSON.stringify(this.notes));
    }

    saveTemplates() {
        localStorage.setItem('noteTemplates', JSON.stringify(this.templates));
    }

    showTemplates() {
        if (this.elements.templatesModal && this.elements.templatesList) {
            this.elements.templatesList.innerHTML = this.templates.map(template => `
                <div class="template-item" data-id="${template.id}">
                    <i class="fas ${this.noteTypes[template.type]?.icon || this.noteTypes.general.icon}"></i>
                    <span>${template.title || template.name}</span>
                    <button class="btn btn-outline-primary btn-sm use-template-btn" data-action="useTemplate" data-id="${template.id}">
                        <i class="fas fa-plus"></i> Use
                    </button>
                </div>
            `).join('');
            
            this.elements.templatesModal.style.display = 'block';
        }
    }

    hideTemplatesModal() {
        if (this.elements.templatesModal) {
            this.elements.templatesModal.style.display = 'none';
        }
    }

    hideConfirmModal() {
        if (this.elements.confirmModal) {
            this.elements.confirmModal.style.display = 'none';
        }
    }

    addNote(template = null) {
        const note = template || {
            id: this.nextId++,
            title: '',
            content: '',
            type: 'general',
            color: this.colors.yellow,
            tags: [],
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEditing: true,
            titlePlaceholder: true,
            contentPlaceholder: true
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.renderNotes();
    }

    toggleEdit(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.isEditing = !note.isEditing;
            this.renderNotes();
        }
    }

    saveNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        const noteElement = document.querySelector(`.note[data-id="${id}"]`);
        if (!noteElement) return;

        const titleInput = noteElement.querySelector('.note-title');
        const contentInput = noteElement.querySelector('.note-content textarea');
        const typeSelect = noteElement.querySelector('.note-type-select');

        note.title = titleInput.value.trim() || 'Untitled';
        note.content = contentInput.value.trim() || '';
        note.type = typeSelect?.value || note.type;
        note.updatedAt = new Date().toISOString();
        note.isEditing = false;
        note.titlePlaceholder = !note.title;
        note.contentPlaceholder = !note.content;

        this.saveNotes();
        this.renderNotes();
        this.updateRelatedNotes(id);
    }

    deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notes.splice(index, 1);
            this.saveNotes();
            this.renderNotes();
        }
    }

    changeColor(id, color) {
        const note = this.notes.find(n => n.id === id);
        if (note && this.colors[color]) {
            note.color = color;
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
        }
    }

    changeType(id, type) {
        const note = this.notes.find(n => n.id === id);
        if (note && this.noteTypes[type]) {
            note.type = type;
            note.color = this.noteTypes[type].color;
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
        }
    }

    parseMarkdown(text) {
        if (!text) return '';
        
        return text
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/\n\n/g, '</p><p>')
            .trim();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    findRelatedNotes(note) {
        if (!note?.content || !note?.title) return [];

        const words = note.content.toLowerCase().split(/\W+/);
        const titleWords = note.title.toLowerCase().split(/\W+/);
        const allWords = [...new Set([...words, ...titleWords])];
        
        return this.notes
            .filter(n => n.id !== note.id)
            .map(n => {
                const nWords = n.content.toLowerCase().split(/\W+/);
                const nTitleWords = n.title.toLowerCase().split(/\W+/);
                const nAllWords = [...new Set([...nWords, ...nTitleWords])];
                
                const commonWords = allWords.filter(w => nAllWords.includes(w));
                return {
                    note: n,
                    relevance: commonWords.length
                };
            })
            .filter(r => r.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 3)
            .map(r => r.note);
    }

    updateRelatedNotes(activeNoteId) {
        if (!this.elements.relatedNotes || !activeNoteId) return;

        const activeNote = this.notes.find(n => n.id === activeNoteId);
        if (!activeNote) return;

        const relatedNotes = this.findRelatedNotes(activeNote);
        
        this.elements.relatedNotes.innerHTML = relatedNotes.length
            ? relatedNotes.map(note => `
                <div class="related-note" data-action="focusNote" data-id="${note.id}">
                    <div class="related-note-title">
                        <i class="fas ${this.noteTypes[note.type].icon}"></i>
                        ${note.title}
                    </div>
                    <div class="related-note-preview">${note.content.substring(0, 100)}...</div>
                </div>
            `).join('')
            : '<p>No related notes found</p>';
    }

    focusNote(noteId) {
        const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
        if (noteElement) {
            noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            noteElement.classList.add('highlight');
            setTimeout(() => noteElement.classList.remove('highlight'), 2000);
        }
    }

    renderNotes() {
        if (!this.elements.notesGrid || !this.elements.emptyState) return;

        let filteredNotes = this.notes;
        if (this.searchQuery) {
            filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(this.searchQuery) ||
                note.content.toLowerCase().includes(this.searchQuery)
            );
        }
        
        if (filteredNotes.length === 0) {
            this.elements.notesGrid.style.display = 'none';
            this.elements.emptyState.style.display = 'flex';
            this.elements.emptyState.innerHTML = this.searchQuery
                ? `<div class="empty-state-content">
                    <i class="fas fa-search fa-3x text-gray-400"></i>
                    <h3>No notes found matching your search</h3>
                   </div>`
                : `<div class="empty-state-content">
                    <i class="fas fa-sticky-note fa-3x text-gray-400"></i>
                    <h3>No notes yet</h3>
                    <p>Click "Add New Note" to create your first note</p>
                   </div>`;
            return;
        }
        
        this.elements.notesGrid.style.display = 'grid';
        this.elements.emptyState.style.display = 'none';
        
        this.elements.notesGrid.innerHTML = filteredNotes.map(note => this.renderNoteCard(note)).join('');
    }

    renderNoteCard(note) {
        const type = this.noteTypes[note.type] || this.noteTypes.general;
        const color = this.colors[note.color] || this.colors.yellow;

        return `
            <div class="note card" data-id="${note.id}" style="background-color: ${color}">
                <div class="note-header card-header">
                    <input type="text" name="Note Title" class="note-title form-control" value="${note.title}" 
                           ${note.isEditing ? '' : 'readonly'} 
                           placeholder="Note title..."
                           data-action="title">
                    <div class="note-actions btn-group">
                        ${note.isEditing 
                            ? `<button class="btn btn-sm btn-success" data-action="save" title="Save changes">
                                 <i class="fas fa-save"></i>
                               </button>
                               <button class="btn btn-sm btn-secondary" data-action="cancel" title="Cancel editing">
                                 <i class="fas fa-times"></i>
                               </button>`
                            : `<button class="btn btn-sm btn-primary" data-action="edit" title="Edit note">
                                 <i class="fas fa-edit"></i>
                               </button>
                               <button class="btn btn-sm btn-danger" data-action="delete" title="Delete note">
                                 <i class="fas fa-trash"></i>
                               </button>`
                        }
                    </div>
                </div>

                <div class="note-type-container card-subtitle">
                    ${note.isEditing
                        ? `<select class="note-type-select form-select" data-action="type">
                            ${Object.entries(this.noteTypes).map(([key, value]) => `
                                <option value="${key}" ${note.type === key ? 'selected' : ''}>
                                    <i class="fas ${value.icon}"></i> ${value.label}
                                </option>
                            `).join('')}
                           </select>`
                        : `<span class="note-type-badge">
                            <i class="fas ${type.icon}"></i> ${type.label}
                           </span>`
                    }
                </div>
                
                <div class="note-content card-body">
                    ${note.isEditing
                        ? `<textarea name="Note Content" rows="6" cols="40" class="form-control" placeholder="Write your note here... (Supports Markdown)">${note.content}</textarea>`
                        : `<div class="note-content-preview markdown-body">${this.parseMarkdown(note.content)}</div>`
                    }
                </div>
                
                ${note.isEditing ? `
                    <div class="note-colors card-footer">
                        ${Object.entries(this.colors).map(([key, value]) => `
                            <button class="color-btn color-${key} ${note.color === key ? 'active' : ''}" 
                                    data-action="color" data-color="${key}" title="Change to ${key}">
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="note-meta text-muted">
                    <small>${note.createdAt === note.updatedAt ? 'Created' : 'Updated'}: ${this.formatDate(note.updatedAt)}</small>
                </div>
            </div>
        `;
    }
}

// Initialize Note Manager after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the sticky notes page before initializing
    const isStickyNotesPage = window.location.href.includes('Stick_Note_App.html') || 
                              document.title.includes('Sticky Notes') ||
                              document.title.includes('Stick_Note_App');
    
    if (!isStickyNotesPage) {
        console.log('Note Manager: Not on sticky notes page, skipping initialization');
        return;
    }

    try {
        window.noteManager = new NoteManager();
        window.noteManager.initialize();
    } catch (error) {
        console.error('Failed to initialize Note Manager:', error);
        // Show user-friendly error message
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="error-message alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Oops! Something went wrong</h2>
                    <p>We couldn't initialize the Note Manager. Please refresh the page or try again later.</p>
                </div>
            `;
        }
    }
});

window.hideTemplatesModal = function() {
    if (window.noteManager) {
        window.noteManager.hideTemplatesModal();
    }
};

window.hideConfirmModal = function() {
    if (window.noteManager) {
        window.noteManager.hideConfirmModal();
    }
};

window.saveTemplate = function() {
    if (window.noteManager) window.noteManager.saveTemplate();
};