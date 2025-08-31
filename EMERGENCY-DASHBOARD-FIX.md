# EMERGENCY DASHBOARD FIX - Copy/Paste Solution

Since we can't push to Git, here's the critical fix you need to apply manually:

## 1. CRITICAL FIX in server-integrated.js

Find this line (around line 83):
```javascript
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard-react.html'));
});
```

CHANGE IT TO:
```javascript
app.get('/dashboard-old', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard-react.html'));
});
```

## 2. Make sure this dashboard route exists (around line 340):
```javascript
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'telegram-bot/web-app/public/index.html');
    console.log('📊 Dashboard requested:', dashboardPath);
    res.sendFile(dashboardPath);
});
```

## 3. Add connection error handling to prevent crashes:

After line 25 where pool is created, add:
```javascript
pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
    dbConnected = false;
});
```

## 4. Static files serving (after line 45):
```javascript
app.use(express.static(path.join(__dirname, 'telegram-bot/web-app/public')));
```

## WHY THIS FIXES IT:
- Line 83 serves OLD dashboard (dashboard-react.html)
- Line 340 serves NEW dashboard (telegram-bot/web-app/public/index.html)
- First route wins, so you see old version
- Renaming first route to /dashboard-old fixes it

## TO APPLY:
1. Make these changes in your local server-integrated.js
2. Commit and push manually:
   ```bash
   git add server-integrated.js
   git commit -m "fix: Dashboard route conflict resolved"
   git push origin main
   ```

3. If git push fails, try:
   - Check GitHub personal access token
   - Or push through GitHub Desktop
   - Or update directly in GitHub web interface

The dashboard will work immediately after these changes deploy!