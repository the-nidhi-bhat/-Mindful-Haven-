// Dark mode sync via mh_theme
function initTheme() {
    const savedTheme = localStorage.getItem('mh_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const toggle = document.getElementById('themeToggle');
    const icon = toggle.querySelector('i');
    const text = toggle.querySelector('span');
    if (savedTheme === 'dark') {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark';
        toggle.classList.add('active');
    }
}

document.getElementById('themeToggle').addEventListener('click', function () {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('mh_theme', next);
    const icon = this.querySelector('i');
    const text = this.querySelector('span');
    if (next === 'dark') {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark';
        this.classList.add('active');
    } else {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light';
        this.classList.remove('active');
    }
});

initTheme();

// Check auth status
if (localStorage.getItem('mh_user') || sessionStorage.getItem('mh_user')) {
    const btn = document.getElementById('navSignInBtn');
    if (btn) {
        btn.textContent = 'Dashboard';
        btn.href = 'journey.html';
    }
}
