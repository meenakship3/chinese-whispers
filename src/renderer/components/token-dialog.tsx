import { useTokens } from '@/hooks/useTokens';
import { TokenForm } from '@/components/token-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Token, TokenData } from '@/types/electron';
import { toast } from 'sonner';

interface TokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  tokenData?: Token;
}

export function TokenDialog({ open, onOpenChange, mode, tokenData }: TokenDialogProps) {
  const { addToken, updateToken } = useTokens();

  const handleSubmit = async (formData: TokenData) => {
    try {
      if (mode === 'add') {
        await addToken(formData);
        toast.success('Token added successfully!');
      } else if (mode === 'edit' && tokenData) {
        await updateToken(tokenData.id, formData);
        toast.success('Token updated successfully!');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to ${mode} token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Token' : 'Edit Token'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Add a new API token or credential to your vault.'
              : 'Update the details of your token.'}
          </DialogDescription>
        </DialogHeader>
        <TokenForm
          mode={mode}
          initialData={tokenData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
