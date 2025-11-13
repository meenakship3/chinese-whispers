import { useState } from 'react';
import { Token } from '@/types/electron';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenTableProps {
  tokens: Token[];
  onEdit: (token: Token) => void;
  onDelete: (ids: string[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function TokenTable({ tokens, onEdit, onDelete, onSelectionChange }: TokenTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  const maskToken = (value: string): string => {
    if (value.length <= 8) return '••••••••';
    const start = value.slice(0, 4);
    const end = value.slice(-4);
    return `${start}${'•'.repeat(value.length - 8)}${end}`;
  };

  const getTokenStatus = (expiryDate?: string): 'active' | 'expiring' | 'expired' => {
    if (!expiryDate) return 'active';

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'active';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(tokens.map(t => t.id));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const toggleTokenVisibility = (id: string) => {
    const newVisible = new Set(visibleTokens);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleTokens(newVisible);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      expiring: 'bg-amber-100 text-amber-800 border-amber-300',
      expired: 'bg-rose-100 text-rose-800 border-rose-300'
    };

    return (
      <Badge variant="outline" className={cn(variants[status as keyof typeof variants])}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded border">
          <span className="text-sm text-neutral-600">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === tokens.length && tokens.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Token Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                  No tokens found. Add your first token to get started.
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((token) => {
                const status = getTokenStatus(token.expiryDate);
                const isVisible = visibleTokens.has(token.id);

                return (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(token.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(token.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{token.service}</TableCell>
                    <TableCell>{token.token}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">
                          {isVisible ? token.value : maskToken(token.value)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {isVisible ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{token.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>
                      {token.expiryDate || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(token)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete([token.id])}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}