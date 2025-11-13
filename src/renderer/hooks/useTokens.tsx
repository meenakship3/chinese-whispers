import { TokenData } from '@/types/electron';
import { useState, useEffect } from 'react';

interface Token {
    id: string;
    service: string;
    token: string;
    value: string;
    description?: string;
    type: string;
    expiryDate?: string;
}

export function useTokens() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTokens();
    }, [])

    const loadTokens = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await window.api.tokens.getAll();
            setTokens(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                console.error('Failed to load tokens:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const addToken = async (tokenData: TokenData) => {
        try {
            const newToken = await window.api.tokens.add(tokenData);
            await loadTokens();
            return newToken;
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                throw err;
            }   
        }
    }

    const updateToken = async (id: string, updates: TokenData) => {
        try {
            await window.api.tokens.update(id, updates);
            await loadTokens();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                throw err;
            }
        }
    };

    const deleteToken = async (id: string) => {
        try {
            await window.api.tokens.delete(id);
            await loadTokens();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                throw err;
            }
        }
    };

    const getDecryptedTokens = async (ids: Array<string>) => {
        try {
            return await window.api.tokens.getById(ids);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                throw err;
            }
        }
    };

    return {
        tokens,
        loading,
        error,
        loadTokens,
        addToken,
        updateToken,
        deleteToken,
        getDecryptedTokens
    };

}