// appState.js
function setAppState(state) {
    localStorage.setItem('appState', JSON.stringify(state));
}

function getAppState() {
    return JSON.parse(localStorage.getItem('appState') || '{}');
}

function clearAppState() {
    localStorage.removeItem('appState');
}

// Global erişim
window.setAppState = setAppState;
window.getAppState = getAppState;
window.clearAppState = clearAppState;
