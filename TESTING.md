# Testing Guide for Chinese Whispers

This guide covers how to test the notification system across different platforms.

## Table of Contents

- [Automated Testing](#automated-testing)
- [Manual Testing](#manual-testing)
- [Cross-Platform Testing with GitHub Actions](#cross-platform-testing-with-github-actions)
- [Notification-Specific Tests](#notification-specific-tests)

---

## Automated Testing

### Running All Tests

```bash
npm test
```

This runs all unit tests with coverage reports.

### Running Notification Tests Only

```bash
npm run test:notifications
```

This specifically tests:

- Database queries for expiring tokens
- Notification history tracking
- Date calculations
- Notification formatting

### Watch Mode (for development)

```bash
npm run test:watch
```

Auto-runs tests when files change.

---

## Manual Testing

### Testing Notifications Locally

#### 1. **Create Test Tokens**

Add tokens with specific expiry dates:

```javascript
// In your app, add these tokens:
{
  service: "GitHub",
  token: "test-7-days",
  value: "test123",
  type: "PERSONAL_ACCESS_TOKEN",
  expiryDate: "2025-11-25" // Exactly 7 days from today
}

{
  service: "AWS",
  token: "test-1-day",
  value: "test456",
  type: "API_KEY",
  expiryDate: "2025-11-19" // Exactly 1 day from today (tomorrow)
}

{
  service: "OpenAI",
  token: "test-expired",
  value: "test789",
  type: "API_KEY",
  expiryDate: "2025-11-17" // Yesterday (expired)
}
```

**Tip**: Calculate dates dynamically:

```javascript
// 7 days from now
const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

// 1 day from now
const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
```

#### 2. **Trigger Notifications Immediately**

The notification service checks every 6 hours by default, but fires 5 seconds after app start. To test:

```bash
# Start the app
npm run dev

# Wait 5 seconds
# Check terminal for:
# "[Notifications] Checking for expiring tokens..."
# "[Notifications] Check complete. Sent X notifications."
```

#### 3. **Verify Notification Appearance**

**macOS:**

- Check System Settings → Notifications → "Chinese Whispers" or "Electron"
- Ensure notifications are set to "Alerts" (not Banners)
- Turn off Do Not Disturb/Focus mode
- Notifications should appear in the top-right corner

**Windows:**

- Check Settings → System → Notifications
- Ensure "Chinese Whispers" has notifications enabled
- Notifications appear in the Action Center

**Linux:**

- Notifications work via D-Bus
- Should appear via your desktop environment's notification system
- Test with: `notify-send "Test" "Testing notifications"`

#### 4. **Check Console Logs**

Look for these messages in the Electron console:

```
✅ Success indicators:
[Notifications] Checking for expiring tokens...
✓ Notification displayed: GitHub token expiring soon
Sent SEVEN_DAYS notification for token: test-7-days
[Notifications] Check complete. Sent 2 notifications.

❌ Error indicators:
✗ Notification failed: <error>
Notifications are not supported on this system
Notification already sent for token 1 (SEVEN_DAYS)
```

#### 5. **Reset Notification History**

To test notifications multiple times:

```javascript
// In your database or via SQL client:
DELETE FROM notification_history;

// Then restart the app
```

---

## Cross-Platform Testing with GitHub Actions

### Automatic Testing on Push

Every push to `main` or `develop` triggers tests on:

- ✅ Ubuntu (Linux)
- ✅ Windows
- ✅ macOS

### Manual Workflow Trigger

1. Go to your GitHub repo
2. Click **Actions** tab
3. Select **Cross-Platform Tests** workflow
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

### Viewing Test Results

1. Go to **Actions** tab
2. Click on the workflow run
3. View test results for each OS:

   - `Test on ubuntu-latest`
   - `Test on windows-latest`
   - `Test on macos-latest`

4. Check notification-specific tests:
   - `Notification System Test on ubuntu-latest`
   - `Notification System Test on windows-latest`
   - `Notification System Test on macos-latest`

---

## Notification-Specific Tests

### Test Cases

#### ✅ 1. 7-Day Warning Notification

- **Expected**: "GitHub token expiring soon"
- **Body**: "Your 'test-token' expires in 7 days..."
- **Urgency**: Normal
- **Category**: SEVEN_DAYS

#### ✅ 2. 1-Day Warning Notification

- **Expected**: "⚠️ AWS token expires tomorrow"
- **Body**: "Your 'test-token' expires tomorrow..."
- **Urgency**: Critical
- **Category**: ONE_DAY

#### ✅ 3. Expired Token Notification

- **Expected**: "🔴 OpenAI token has expired"
- **Body**: "Your 'test-token' expired on..."
- **Urgency**: Critical
- **Category**: EXPIRED

#### ✅ 4. Duplicate Notification Prevention

- First run: Notification sent
- Second run: No notification (already sent)
- **Log**: "Notification already sent for token X (CATEGORY)"

#### ✅ 5. Notification Settings Respect

- Tokens with `notification_enabled = 0` should NOT trigger notifications
- Tokens with `notification_enabled = NULL` (default) should trigger notifications

---

## Platform-Specific Testing

### macOS

```bash
# Check if Notification Center is working
osascript -e 'display notification "Test" with title "Test"'

# View notification permissions
open "x-apple.systempreferences:com.apple.preference.notifications"

# Run app
npm run dev
```

**Known Issues:**

- Notifications won't show if Do Not Disturb is enabled
- First run may require granting permissions

### Windows

```bash
# Check notification support
npm run dev

# Look for notifications in Action Center (Win+A)
```

**Known Issues:**

- Focus Assist may block notifications
- Check Settings → System → Focus assist

### Linux (Ubuntu/Debian)

```bash
# Install notification dependencies
sudo apt-get install libnotify-bin

# Test D-Bus notifications
notify-send "Test" "Testing notifications"

# Run app
npm run dev
```

**Known Issues:**

- May require `libnotify` package
- Desktop environment must support D-Bus notifications

---

## Debugging Notification Issues

### Issue: Notifications Not Appearing

**Check:**

1. ✅ Console shows "✓ Notification displayed: ..."
2. ✅ Platform notification settings enabled
3. ✅ Do Not Disturb / Focus mode is OFF
4. ✅ App has notification permissions
5. ✅ `Notification.isSupported()` returns `true`

**Solution:**

```bash
# Clear notification history
DELETE FROM notification_history;

# Check notification settings table
SELECT * FROM notification_settings;

# Verify tokens are found
SELECT * FROM api_tokens WHERE expiry_date IS NOT NULL;
```

### Issue: "Sent 0 notifications"

**Check:**

1. ✅ Tokens exist with expiry dates
2. ✅ Expiry dates are exactly 1 or 7 days away
3. ✅ `notification_enabled` is not `0`
4. ✅ Notification history hasn't been recorded yet

**Solution:**

```sql
-- Check which tokens would be found
SELECT
    t.id,
    t.token_name,
    t.expiry_date,
    julianday(t.expiry_date) - julianday('now') as days_until_expiry
FROM api_tokens t
WHERE t.expiry_date IS NOT NULL;
```

### Issue: "Notification failed"

**Check Electron console** for specific error message.

Common causes:

- Electron version doesn't support `Notification.isSupported()`
- Platform doesn't support notifications
- Permission denied

**Solution:**

```bash
# Update Electron
npm install electron@latest

# Check Electron version
npm list electron
```

---

## CI/CD Integration

### GitHub Actions Setup

The `.github/workflows/test.yml` file runs:

1. **Linting** (ESLint)
2. **Unit Tests** (Jest with coverage)
3. **Build Tests** (Vite renderer build)
4. **Notification Tests** (Notification-specific unit tests)

## Performance Testing

### Scheduler Performance

```javascript
// In notificationService.cjs, temporarily reduce interval for testing:
const TEST_INTERVAL = 30 * 1000; // 30 seconds instead of 6 hours
setInterval(() => {
  checkExpiringTokens();
}, TEST_INTERVAL);
```

**Monitor:**

- CPU usage
- Memory usage
- Database query time
- Notification delivery time

---

## Security Testing

### Test Notification Content

Ensure notifications **DO NOT** display:

- ❌ Token values (encrypted or decrypted)
- ❌ Sensitive user data
- ❌ Database IDs

Notifications **SHOULD** display:

- ✅ Service name
- ✅ Token name
- ✅ Expiry date
- ✅ Days until expiry

---

## Coverage Reports

After running tests:

```bash
npm test

# View coverage report
open coverage/lcov-report/index.html
```

**Target coverage:**

- Notification models: >90%
- Notification service: >80%
- Overall: >80%

---

## Troubleshooting

### "Test database locked"

```bash
# Stop all running instances
pkill -f electron

# Remove test database
rm models-test/test-notifications.db

# Re-run tests
npm test
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Run tests
npm test
```

---

## Contributing

When adding new notification features:

1. ✅ Write unit tests first (TDD)
2. ✅ Update this testing guide
3. ✅ Test on at least 2 platforms locally
4. ✅ Ensure CI/CD passes on all 3 platforms
5. ✅ Update coverage requirements if needed

---

## Resources

- [Electron Notifications Documentation](https://www.electronjs.org/docs/latest/tutorial/notifications)
- [macOS Notification Guidelines](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Framework](https://jestjs.io/)
