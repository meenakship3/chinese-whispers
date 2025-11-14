import { useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { TokenTable } from '@/components/token-table';
import { TokenDialog } from '@/components/token-dialog';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Download, RefreshCw, ShieldCheck, HardDrive } from 'lucide-react';
import { Token } from '@/types/electron';

function App() {
  const { tokens, loading, error, loadTokens, deleteToken, getDecryptedTokens } = useTokens();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();

  const handleAddToken = () => {
    setDialogMode('add');
    setSelectedToken(undefined);
    setDialogOpen(true);
  };

  const handleEditToken = (token: Token) => {
    setDialogMode('edit');
    setSelectedToken(token);
    setDialogOpen(true);
  };

  const handleDeleteTokens = async (ids: string[]) => {
    if (confirm(`Delete ${ids.length} token(s)?`)) {
      for (const id of ids) {
        await deleteToken(id);
      }
    }
  };

  const handleExportEnv = () => {
    const envContent = tokens
      .map(t => `${t.service.toUpperCase().replace(/\s+/g, '_')}=${t.value}`)
      .join('\n');

    // Trigger download
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-mono">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-100">
        <div className="text-center text-red-500">
          <p className="font-mono text-lg mb-2">Error loading tokens</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <Toaster />

      {/* Retro scanline background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          background:
            "repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 3px), radial-gradient(1000px 500px at 50% -20%, #0f172a 0%, transparent 60%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-neutral-200 bg-gradient-to-b from-neutral-900 to-neutral-800 text-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-[8px] bg-neutral-700/60 border border-neutral-600 flex items-center justify-center shadow-inner">
            <ShieldCheck className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-bold tracking-[0.08em] font-mono">EnvVault</div>
            <div className="text-xs text-neutral-300 font-mono tracking-widest">Secure Token Management</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-neutral-300 font-mono">
            <HardDrive className="h-4 w-4 text-emerald-300" />
            {tokens.length} tokens
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative z-10 mx-auto max-w-7xl p-6">
        {/* Action Bar */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-lg p-4 flex items-center gap-3">
          <Button
            onClick={handleAddToken}
            className="bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-neutral-700 font-mono"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Token
          </Button>

          <Button
            variant="outline"
            onClick={loadTokens}
            className="font-mono"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={handleExportEnv}
            disabled={tokens.length === 0}
            className="font-mono"
          >
            <Download className="w-4 h-4 mr-2" />
            Export .env
          </Button>

          <div className="ml-auto text-xs text-neutral-500 font-mono">
            {tokens.length} {tokens.length === 1 ? 'token' : 'tokens'}
          </div>
        </div>

        {/* Token Table */}
        <div className="bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <TokenTable
            tokens={tokens}
            onEdit={handleEditToken}
            onDelete={handleDeleteTokens}
            getDecryptedTokens={async (ids) => {
              const result = await getDecryptedTokens(ids);
              return result || [];
            }}
          />
        </div>
      </section>

      {/* Add/Edit Dialog */}
      <TokenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        tokenData={selectedToken}
      />
    </main>
  );
}

export default App;