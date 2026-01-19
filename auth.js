
(function () {
    // List of allowed public pages
    const publicPages = ['index.html', 'sign-in.html', ''];

    const path = window.location.pathname;
    const page = path.split("/").pop();

    // Expose signOut globally
    window.signOut = function () {
        localStorage.removeItem('mh_user');
        localStorage.removeItem('mh_remember');
        sessionStorage.removeItem('mh_user');
        window.location.href = 'sign-in.html';
    };

    // If current page is public, do nothing
    if (publicPages.includes(page)) {
        return;
    }

    // Check for user session in either Local (Persistent) or Session (Temporary) storage
    const user = localStorage.getItem('mh_user') || sessionStorage.getItem('mh_user');

    // If not logged in, redirect to sign-in
    if (!user) {
        sessionStorage.setItem('mh_redirect', window.location.href);
        window.location.href = 'sign-in.html';
    }
})();
