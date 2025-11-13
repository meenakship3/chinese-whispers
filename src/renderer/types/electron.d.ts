export interface Token {
    id: string;
    service: string;
    token: string;
    value: string;
    description?: string;
    type: string;
    expiryDate?: string;
}

export interface TokenData {
    tokenName: string;
    serviceName: string;
    tokenValue: string;
    description?: string;
    tokenType: 'API_KEY' | 'OAUTH' | 'JWT' | 'PERSONAL_ACCESS_TOKEN' | 'OTHER';
    expiryDate?: string;
}

export interface IElectronAPI {
    tokens: {
        getAll: () => Promise<Token[]>;
        getById: (ids: string[]) => Promise<Token[]>;
        add: (tokenData: TokenData) => Promise<Token>;
        update: (id: string, updates: TokenData) => Promise<Token>;
        delete: (id: string) => Promise<{ deleted: boolean; id: string }>;
    };
}

declare global {
    interface Window {
        api: IElectronAPI;
    }
}