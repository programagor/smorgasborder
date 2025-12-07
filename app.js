// State management
const state = {
    selections: {}
};

// Initialize the application
function init() {
    loadState();
    renderCategories();
    setupEventListeners();
}

// Load saved state from localStorage
function loadState() {
    const saved = localStorage.getItem('smorgasbordSelections');
    if (saved) {
        try {
            state.selections = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading saved state:', e);
            state.selections = {};
        }
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('smorgasbordSelections', JSON.stringify(state.selections));
}

// Render all categories
function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = '';

    smorgasbordData.forEach(category => {
        const categoryElement = createCategoryElement(category);
        container.appendChild(categoryElement);
    });
}

// Create a category element
function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    const title = document.createElement('h3');
    title.textContent = category.name;
    categoryDiv.appendChild(title);

    if (category.description) {
        const description = document.createElement('p');
        description.className = 'category-description';
        description.textContent = category.description;
        categoryDiv.appendChild(description);
    }

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items';

    category.items.forEach(item => {
        const itemElement = createItemElement(item, category.name);
        itemsContainer.appendChild(itemElement);
    });

    categoryDiv.appendChild(itemsContainer);
    return categoryDiv;
}

// Create an item element
function createItemElement(itemName, categoryName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.textContent = itemName;
    
    const key = `${categoryName}:${itemName}`;
    const currentState = state.selections[key] || 'unselected';
    itemDiv.setAttribute('data-state', currentState);
    itemDiv.setAttribute('data-key', key);

    itemDiv.addEventListener('click', () => handleItemClick(itemDiv, key));

    return itemDiv;
}

// Handle item click - cycle through states
function handleItemClick(element, key) {
    const states = ['unselected', 'want', 'maybe', 'no'];
    const currentState = element.getAttribute('data-state');
    const currentIndex = states.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = states[nextIndex];

    element.setAttribute('data-state', nextState);
    
    if (nextState === 'unselected') {
        delete state.selections[key];
    } else {
        state.selections[key] = nextState;
    }

    saveState();
}

// Clear all selections
function clearAll() {
    // Note: Using native confirm() for simplicity. For better accessibility,
    // consider implementing a custom modal with proper ARIA attributes.
    if (confirm('Are you sure you want to clear all selections?')) {
        state.selections = {};
        saveState();
        renderCategories();
    }
}

// Export results
function exportResults() {
    const results = {
        timestamp: new Date().toISOString(),
        selections: {}
    };

    // Organize results by category
    smorgasbordData.forEach(category => {
        const categoryResults = {
            want: [],
            maybe: [],
            no: []
        };

        category.items.forEach(item => {
            const key = `${category.name}:${item}`;
            const selection = state.selections[key];
            
            if (selection && selection !== 'unselected') {
                categoryResults[selection].push(item);
            }
        });

        // Only include category if it has selections
        if (categoryResults.want.length > 0 || categoryResults.maybe.length > 0 || categoryResults.no.length > 0) {
            results.selections[category.name] = categoryResults;
        }
    });

    // Create downloadable file
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `smorgasbord-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also create a readable text version
    exportAsText(results);
}

// Export as readable text
function exportAsText(results) {
    let text = 'Relationship Anarchy Smorgasbord Results\n';
    text += `Date: ${new Date(results.timestamp).toLocaleDateString()}\n`;
    text += '='.repeat(50) + '\n\n';

    Object.entries(results.selections).forEach(([categoryName, selections]) => {
        text += `${categoryName.toUpperCase()}\n`;
        text += '-'.repeat(50) + '\n';

        if (selections.want.length > 0) {
            text += '\n✓ Want / Interested:\n';
            selections.want.forEach(item => {
                text += `  • ${item}\n`;
            });
        }

        if (selections.maybe.length > 0) {
            text += '\n? Maybe / Open to Discussion:\n';
            selections.maybe.forEach(item => {
                text += `  • ${item}\n`;
            });
        }

        if (selections.no.length > 0) {
            text += '\n✗ Not Interested / No:\n';
            selections.no.forEach(item => {
                text += `  • ${item}\n`;
            });
        }

        text += '\n';
    });

    const textBlob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(textBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `smorgasbord-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('clearAll').addEventListener('click', clearAll);
    document.getElementById('exportResults').addEventListener('click', exportResults);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
