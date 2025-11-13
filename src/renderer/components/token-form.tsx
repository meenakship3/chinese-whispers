import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Token, TokenData } from '@/types/electron';

interface TokenFormProps {
  mode: 'add' | 'edit';
  initialData?: Token;
  onSubmit: (data: TokenData) => void | Promise<void>;
  onCancel: () => void;
}

export function TokenForm({ mode, initialData, onSubmit, onCancel }: TokenFormProps) {
  const [formData, setFormData] = useState<TokenData>({
    tokenName: '',
    serviceName: '',
    tokenValue: '',
    description: '',
    tokenType: 'API_KEY',
    expiryDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        tokenName: initialData.token,
        serviceName: initialData.service,
        tokenValue: initialData.value,
        description: initialData.description || '',
        tokenType: initialData.type as TokenData['tokenType'],
        expiryDate: initialData.expiryDate || ''
      });
    }
  }, [mode, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tokenName.trim()) {
      newErrors.tokenName = 'Token name is required';
    }
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    }
    if (!formData.tokenValue.trim()) {
      newErrors.tokenValue = 'Token value is required';
    }
    if (!formData.tokenType) {
      newErrors.tokenType = 'Token type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TokenData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="serviceName">Service Name *</Label>
        <Input
          id="serviceName"
          value={formData.serviceName}
          onChange={(e) => handleChange('serviceName', e.target.value)}
          placeholder="e.g., GitHub, AWS, OpenAI"
          className={errors.serviceName ? 'border-red-500' : ''}
        />
        {errors.serviceName && (
          <p className="text-sm text-red-500">{errors.serviceName}</p>
        )}
      </div>

      {/* Token Name */}
      <div className="space-y-2">
        <Label htmlFor="tokenName">Token Name *</Label>
        <Input
          id="tokenName"
          value={formData.tokenName}
          onChange={(e) => handleChange('tokenName', e.target.value)}
          placeholder="e.g., Production API Key, Dev Token"
          className={errors.tokenName ? 'border-red-500' : ''}
        />
        {errors.tokenName && (
          <p className="text-sm text-red-500">{errors.tokenName}</p>
        )}
      </div>

      {/* Token Value */}
      <div className="space-y-2">
        <Label htmlFor="tokenValue">Token Value *</Label>
        <Textarea
          id="tokenValue"
          value={formData.tokenValue}
          onChange={(e) => handleChange('tokenValue', e.target.value)}
          placeholder="Paste your token here..."
          className={errors.tokenValue ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.tokenValue && (
          <p className="text-sm text-red-500">{errors.tokenValue}</p>
        )}
      </div>

      {/* Token Type */}
      <div className="space-y-2">
        <Label htmlFor="tokenType">Token Type *</Label>
        <Select
          value={formData.tokenType}
          onValueChange={(value) => handleChange('tokenType', value)}
        >
          <SelectTrigger className={errors.tokenType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select token type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="API_KEY">API Key</SelectItem>
            <SelectItem value="OAUTH">OAuth Token</SelectItem>
            <SelectItem value="JWT">JWT</SelectItem>
            <SelectItem value="PERSONAL_ACCESS_TOKEN">Personal Access Token</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.tokenType && (
          <p className="text-sm text-red-500">{errors.tokenType}</p>
        )}
      </div>

      {/* Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add notes about this token..."
          rows={2}
        />
      </div>

      {/* Expiry Date (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
        <Input
          id="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => handleChange('expiryDate', e.target.value)}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Token' : 'Update Token'}
        </Button>
      </div>
    </form>
  );
}