import { Token } from '@/types/electron';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface TokenListProps {
  tokens: Token[];
  showValues?: boolean;
  onTokenClick?: (token: Token) => void;
}

export function TokenList({ tokens, showValues = false, onTokenClick }: TokenListProps) {
  const maskToken = (value: string): string => {
    if (value.length <= 8) return '••••••••';
    const start = value.slice(0, 4);
    const end = value.slice(-4);
    return `${start}${'•'.repeat(value.length - 8)}${end}`;
  };

  return (
    <div className="space-y-2">
      {tokens.map((token) => (
        <Card
          key={token.id}
          className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
          onClick={() => onTokenClick?.(token)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{token.service}</span>
                <Badge variant="outline" className="text-xs">{token.type}</Badge>
              </div>
              <p className="text-sm text-neutral-600">{token.token}</p>
              {token.description && (
                <p className="text-xs text-neutral-500 mt-1">{token.description}</p>
              )}
            </div>
            <code className="text-xs font-mono bg-neutral-100 px-3 py-1 rounded">
              {showValues ? token.value : maskToken(token.value)}
            </code>
          </div>
        </Card>
      ))}
    </div>
  );
}