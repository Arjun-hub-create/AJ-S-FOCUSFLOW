// Keyboard Shortcuts for FocusFlow
class KeyboardShortcuts {
    constructor() {
        this.enabled = true;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                if (e.key === 'Escape') {
                    e.target.blur();
                    this.closeAllModals();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.openTaskModal();
                    break;
                case 'p':
                    e.preventDefault();
                    this.openProjectModal();
                    break;
                case 's':
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case 'escape':
                    this.closeAllModals();
                    break;
                case '?':
                    e.preventDefault();
                    this.toggleShortcutsHelp();
                    break;
                case 'd':
                    e.preventDefault();
                    window.location.href = '/dashboard';
                    break;
                case 'a':
                    e.preventDefault();
                    window.location.href = '/analytics';
                    break;
            }
        });
    }

    openTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.add('active');
    }

    openProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) modal.classList.add('active');
    }

    focusSearch() {
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        // Close notification dropdown
        const notifDropdown = document.getElementById('notificationDropdown');
        if (notifDropdown) notifDropdown.classList.remove('active');
        // Close search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) searchResults.style.display = 'none';
    }

    toggleShortcutsHelp() {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            modal.classList.toggle('active');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.keyboardShortcuts = new KeyboardShortcuts();
});
