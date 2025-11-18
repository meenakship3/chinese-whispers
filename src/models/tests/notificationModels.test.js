const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Test database path
const testDbPath = path.join(__dirname, 'test-notifications.db');

// Create test database connection
let testDb;

// Helper functions that use the test database
function getTokensExpiringWithin(days) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                t.id,
                t.token_name,
                t.service_name,
                t.expiry_date,
                t.token_type,
                ns.notification_enabled,
                ns.notify_days_before
            FROM api_tokens t
            LEFT JOIN notification_settings ns ON t.id = ns.token_id
            WHERE t.expiry_date IS NOT NULL
                AND julianday(t.expiry_date) - julianday('now') BETWEEN 0 AND ?
                AND (ns.notification_enabled = 1 OR ns.notification_enabled IS NULL)
            ORDER BY t.expiry_date ASC
        `;

        testDb.all(sql, [days], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

function hasNotificationBeenSent(tokenId, category) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) as count
            FROM notification_history
            WHERE token_id = ? AND notification_category = ?
        `;

        testDb.get(sql, [tokenId, category], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row.count > 0);
        });
    });
}

function recordNotification(tokenId, category, message, daysBeforeExpiry) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO notification_history
            (token_id, notification_category, notification_message, days_before_expiry)
            VALUES (?, ?, ?, ?)
        `;
        testDb.run(sql, [tokenId, category, message, daysBeforeExpiry], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ id: this.lastID });
        });
    });
}

function clearNotificationHistory(tokenId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM notification_history WHERE token_id = ?';

        testDb.run(sql, [tokenId], function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ deleted: this.changes });
        });
    });
}

describe('Notification Models', () => {
    beforeAll(async () => {
        // Delete existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }

        // Create new test database
        testDb = new sqlite3.Database(testDbPath);

        // Initialize test schema
        const schema = fs.readFileSync(path.join(__dirname, '../../../schema.sql'), 'utf8');
        await new Promise((resolve, reject) => {
            testDb.exec(schema, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Insert test tokens
        const testTokens = [
            {
                service: 'GitHub',
                token: 'test-token-1',
                value: 'encrypted-value-1',
                type: 'PERSONAL_ACCESS_TOKEN',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
            },
            {
                service: 'AWS',
                token: 'test-token-2',
                value: 'encrypted-value-2',
                type: 'API_KEY',
                expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day from now
            },
            {
                service: 'OpenAI',
                token: 'test-token-3',
                value: 'encrypted-value-3',
                type: 'API_KEY',
                expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // expired yesterday
            },
            {
                service: 'Stripe',
                token: 'test-token-4',
                value: 'encrypted-value-4',
                type: 'API_KEY',
                expiryDate: null // no expiry
            }
        ];

        for (const token of testTokens) {
            await new Promise((resolve, reject) => {
                testDb.run(
                    `INSERT INTO api_tokens (service_name, token_name, token_value, token_type, expiry_date)
                     VALUES (?, ?, ?, ?, ?)`,
                    [token.service, token.token, token.value, token.type, token.expiryDate],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    });

    afterAll(async () => {
        // Clean up test database
        await new Promise((resolve) => {
            testDb.close(resolve);
        });
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('getTokensExpiringWithin', () => {
        test('should find tokens expiring within 365 days', async () => {
            const tokens = await getTokensExpiringWithin(365);

            expect(tokens).toBeDefined();
            expect(Array.isArray(tokens)).toBe(true);
            expect(tokens.length).toBeGreaterThan(0);
        });

        test('should find tokens expiring within 7 days', async () => {
            const tokens = await getTokensExpiringWithin(7);

            expect(tokens).toBeDefined();
            expect(tokens.some(t => t.service_name === 'GitHub')).toBe(true);
        });

        test('should find tokens expiring within 1 day', async () => {
            const tokens = await getTokensExpiringWithin(1);

            expect(tokens).toBeDefined();
            expect(tokens.some(t => t.service_name === 'AWS')).toBe(true);
        });

        test('should include notification settings in results', async () => {
            const tokens = await getTokensExpiringWithin(365);

            if (tokens.length > 0) {
                expect(tokens[0]).toHaveProperty('notification_enabled');
                expect(tokens[0]).toHaveProperty('notify_days_before');
            }
        });

        test('should not include tokens without expiry dates', async () => {
            const tokens = await getTokensExpiringWithin(365);

            expect(tokens.some(t => t.service_name === 'Stripe')).toBe(false);
        });

        test('should order tokens by expiry date ascending', async () => {
            const tokens = await getTokensExpiringWithin(365);

            if (tokens.length > 1) {
                const dates = tokens.map(t => new Date(t.expiry_date));
                for (let i = 1; i < dates.length; i++) {
                    expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i-1].getTime());
                }
            }
        });
    });

    describe('hasNotificationBeenSent', () => {
        test('should return false when no notification has been sent', async () => {
            const result = await hasNotificationBeenSent(1, 'SEVEN_DAYS');

            expect(result).toBe(false);
        });

        test('should return true after notification is recorded', async () => {
            await recordNotification(1, 'SEVEN_DAYS', 'Test message', 7);
            const result = await hasNotificationBeenSent(1, 'SEVEN_DAYS');

            expect(result).toBe(true);
        });

        test('should differentiate between different categories', async () => {
            await recordNotification(2, 'ONE_DAY', 'Test message', 1);

            const oneDayResult = await hasNotificationBeenSent(2, 'ONE_DAY');
            const sevenDayResult = await hasNotificationBeenSent(2, 'SEVEN_DAYS');

            expect(oneDayResult).toBe(true);
            expect(sevenDayResult).toBe(false);
        });
    });

    describe('recordNotification', () => {
        test('should successfully record a notification', async () => {
            const result = await recordNotification(
                3,
                'EXPIRED',
                'Token has expired',
                0
            );

            expect(result).toHaveProperty('id');
            expect(result.id).toBeGreaterThan(0);
        });

        test('should record all required fields', async () => {
            const tokenId = 1;
            const category = 'EXPIRED';  // Use valid category from CHECK constraint
            const message = 'Test notification message';
            const daysBeforeExpiry = 0;

            await recordNotification(
                tokenId,
                category,
                message,
                daysBeforeExpiry
            );

            const recorded = await hasNotificationBeenSent(tokenId, category);
            expect(recorded).toBe(true);
        });
    });

    describe('clearNotificationHistory', () => {
        test('should delete notification history for a token', async () => {
            const tokenId = 1;

            // Record some notifications
            await recordNotification(tokenId, 'SEVEN_DAYS', 'Test', 7);
            await recordNotification(tokenId, 'ONE_DAY', 'Test', 1);

            // Clear history
            const result = await clearNotificationHistory(tokenId);

            expect(result).toHaveProperty('deleted');
            expect(result.deleted).toBeGreaterThan(0);
        });

        test('should only delete notifications for specified token', async () => {
            await recordNotification(1, 'SEVEN_DAYS', 'Test', 7);
            await recordNotification(2, 'ONE_DAY', 'Test', 1);

            await clearNotificationHistory(1);

            const token1HasNotification = await hasNotificationBeenSent(1, 'SEVEN_DAYS');
            const token2HasNotification = await hasNotificationBeenSent(2, 'ONE_DAY');

            expect(token1HasNotification).toBe(false);
            expect(token2HasNotification).toBe(true);
        });
    });
});
