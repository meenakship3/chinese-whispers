const tokenModel = require('./tokenModels');

describe('token crud operations', () => {
    const createdTokenIds = [];

    afterAll(async () => {
        console.log(`\nCleaning up ${createdTokenIds.length} test tokens...`);
        for (const id of createdTokenIds) {
            try {
                await tokenModel.deleteToken(id);
            } catch(err) {
                // ignore
            }
        }
        console.log("Cleanup complete!")    
    });

    // getTokens Tests
    describe('getToken', () => {
        test('getTokens returns an array', async () => {
            const result = await tokenModel.getTokens();
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        test('each token has required fields', async () => {
            const tokens = await tokenModel.getTokens();

            if (tokens.length > 0) {
                const token = tokens[0];
                expect(token).toHaveProperty('id');
                expect(token).toHaveProperty('service');
                expect(token).toHaveProperty('token');
                expect(token).toHaveProperty('value');
                expect(token).toHaveProperty('type');
                expect(token).toHaveProperty('expiryDate');

                expect(typeof token.id).toBe('string');
            }
        });
    });

    // addToken Tests
    describe('addToken', () => {
        test('addToken creates a new token', async () => {
            const testData = {
                tokenName: 'Test Token',
                serviceName: 'GitHub',
                tokenValue: 'test_12345',
                tokenType: 'API_KEY',
                expiryDate: '2025-12-31'
            };
            const newToken = await tokenModel.addToken(testData);
            createdTokenIds.push(newToken.id);

            expect(newToken).toBeDefined();
            expect(newToken.id).toBeDefined();
            expect(typeof newToken.id).toBe('string');
            expect(newToken.tokenName).toBe(testData.tokenName);
            expect(newToken.serviceName).toBe(testData.serviceName);
            expect(newToken.tokenValue).toBe(testData.tokenValue);
            expect(newToken.tokenType).toBe(testData.tokenType);
            expect(newToken.expiryDate).toBe(testData.expiryDate);
        });

        test('creates token with minimal fields', async () => {
            const minimalData = {
                tokenName: 'Minimal Token',
                serviceName: 'Test Service',
                tokenValue: 'test_value_456',
                tokenType: 'API_KEY'
            };
            const newToken = await tokenModel.addToken(minimalData);
            createdTokenIds.push(newToken.id);

            expect(newToken.id).toBeDefined();
            expect(newToken.tokenName).toBe('Minimal Token');
        });

        test('getTokens returns created token', async () => {
            const testData = {
                tokenName: 'Findable Token',
                serviceName: 'Find Me',
                tokenValue: 'find_me_123',
                tokenType: 'OAUTH',
                expiryDate: '2026-06-15'
            };

            const newToken = await tokenModel.addToken(testData);
            createdTokenIds.push(newToken.id);

            const allTokens = await tokenModel.getTokens();

            const foundToken = allTokens.find(t => t.id == newToken.id);

            expect(foundToken).toBeDefined();
            expect(foundToken.service).toBe('Find Me');
        });
    });

// updateToken tests

describe('updateToken', () => {
    let tokenId;

    beforeEach(async() => {
        const token = await tokenModel.addToken({
                tokenName: 'Update Test Token',
                serviceName: 'Update Service',
                tokenValue: 'update_value_123',
                description: 'Original description',
                tokenType: 'API_KEY',
                expiryDate: '2025-12-31'
        });
        tokenId = token.id;
        createdTokenIds.push(tokenId);
    });

    test('updates all token fields', async () => {
            const updates = {
                tokenName: 'Updated Token Name',
                serviceName: 'Updated Service',
                tokenValue: 'new_value_456',
                description: 'Updated description',
                tokenType: 'OAUTH',
                expiryDate: '2026-01-15'
            };
            
            const updated = await tokenModel.updateToken(tokenId, updates);
            
            expect(updated).toBeDefined();
            expect(updated.id).toBe(tokenId);
            expect(updated.tokenName).toBe('Updated Token Name');
            expect(updated.serviceName).toBe('Updated Service');
    });

    test('updates are persisted in database', async () => {
            const updates = {
                tokenName: 'Persisted Update',
                serviceName: 'Persistence Test',
                tokenValue: 'persist_123',
                description: 'Testing persistence',
                tokenType: 'JWT',
                expiryDate: '2027-03-20'
            };
            
            await tokenModel.updateToken(tokenId, updates);
            
            // Verify by getting all tokens
            const allTokens = await tokenModel.getTokens();
            const updatedToken = allTokens.find(t => t.id === tokenId);
            
            expect(updatedToken).toBeDefined();
            expect(updatedToken.service).toBe('Persistence Test');
    });

    test('throws error for non-existent token', async () => {
            const fakeId = '999999';
            const updates = {
                tokenName: 'Should Fail',
                serviceName: 'Service',
                tokenValue: 'value',
                tokenType: 'API_KEY'
            };
            
            await expect(
                tokenModel.updateToken(fakeId, updates)
            ).rejects.toThrow('not found');
    });

});

// deleteToken tests

describe('deleteToken', () => {
    test('deletes existing token', async () => {
        const token = await tokenModel.addToken({
            tokenName: 'Delete Me',
            serviceName: 'Delete Service',
            tokenValue: 'delete_123',
            tokenType: 'API_KEY'
        });

        const tokenId = token.id;

        const result = await tokenModel.deleteToken(tokenId);

        expect(result).toBeDefined();
        expect(result.deleted).toBe(true);
        expect(result.id).toBe(tokenId);
    });

    test('token is removed from database', async () => {
            // Create a token
            const token = await tokenModel.addToken({
                tokenName: 'Verify Deletion',
                serviceName: 'Deletion Test',
                tokenValue: 'verify_delete_123',
                tokenType: 'PERSONAL_ACCESS_TOKEN'
            });
            
            const tokenId = token.id;
            
            await tokenModel.deleteToken(tokenId);
            
            const allTokens = await tokenModel.getTokens();
            const deletedToken = allTokens.find(t => t.id === tokenId);
            
            expect(deletedToken).toBeUndefined();
    });

    test('throws error for non-existent token', async () => {
            const fakeId = '999999';
            
            await expect(
                tokenModel.deleteToken(fakeId)
            ).rejects.toThrow('not found');
    });
        
        test('deleting same token twice throws error', async () => {
            // Create and delete a token
            const token = await tokenModel.addToken({
                tokenName: 'Double Delete',
                serviceName: 'Service',
                tokenValue: 'double_123',
                tokenType: 'API_KEY'
            });
            
            await tokenModel.deleteToken(token.id);
            await expect(
                tokenModel.deleteToken(token.id)
            ).rejects.toThrow('not found');
        });
});

// integrated tests

describe('Integration Tests', () => {
        test('complete CRUD lifecycle', async () => {
            // 1. CREATE
            const newToken = await tokenModel.addToken({
                tokenName: 'Lifecycle Token',
                serviceName: 'Lifecycle Service',
                tokenValue: 'lifecycle_123',
                description: 'Testing full lifecycle',
                tokenType: 'API_KEY',
                expiryDate: '2025-12-31'
            });
            
            const tokenId = newToken.id;
            createdTokenIds.push(tokenId);
            
            expect(newToken.id).toBeDefined();
            
            // 2. READ
            const allTokens = await tokenModel.getTokens();
            const foundToken = allTokens.find(t => t.id === tokenId);
            expect(foundToken).toBeDefined();
            
            // 3. UPDATE
            const updated = await tokenModel.updateToken(tokenId, {
                tokenName: 'Updated Lifecycle',
                serviceName: 'Updated Service',
                tokenValue: 'updated_lifecycle_456',
                description: 'Updated lifecycle',
                tokenType: 'OAUTH',
                expiryDate: '2026-06-30'
            });
            expect(updated.tokenName).toBe('Updated Lifecycle');
            
            // 4. DELETE
            const deleted = await tokenModel.deleteToken(tokenId);
            expect(deleted.deleted).toBe(true);
            
            // 5. VERIFY DELETION
            const tokensAfterDelete = await tokenModel.getTokens();
            const shouldNotExist = tokensAfterDelete.find(t => t.id === tokenId);
            expect(shouldNotExist).toBeUndefined();
        });
        
        test('handles multiple tokens', async () => {
            const tokens = [];
            
            // Create 5 tokens
            for (let i = 1; i <= 5; i++) {
                const token = await tokenModel.addToken({
                    tokenName: `Batch Token ${i}`,
                    serviceName: `Service ${i}`,
                    tokenValue: `batch_value_${i}`,
                    tokenType: 'API_KEY',
                    expiryDate: `2025-${String(i).padStart(2, '0')}-15`
                });
                tokens.push(token.id);
                createdTokenIds.push(token.id);
            }
            
            // Verify all exist
            const allTokens = await tokenModel.getTokens();
            
            for (const id of tokens) {
                const found = allTokens.find(t => t.id === id);
                expect(found).toBeDefined();
            }
            
            // Delete all
            for (const id of tokens) {
                await tokenModel.deleteToken(id);
            }
        });
    });
});