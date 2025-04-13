app.get('/settings', (req, res) => {
    // Default settings object
    const settings = {
        api_keys_count: 0,
        rate_limit: 60,
        per_minute: 1,
        auto_refresh_enabled: false,
        refresh_interval: 5
    };
    
    res.render('settings', { 
        path: '/settings',
        settings: settings 
    });
});

app.get('/statistics', (req, res) => {
    res.render('statistics', { 
        path: '/statistics'
    });
}); 