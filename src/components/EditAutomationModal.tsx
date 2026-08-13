import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';

interface Automation {
  id: string;
  name: string;
  type: 'scheduled' | 'auto-reply' | 'drip' | 'trigger';
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  action: string;
  messagesCount: number;
  lastRun?: string;
}

interface EditAutomationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: Automation | null;
  onSave: (automation: Automation) => void;
}

export const EditAutomationModal: React.FC<EditAutomationModalProps> = ({
  open,
  onOpenChange,
  automation,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    type: 'scheduled' | 'auto-reply' | 'drip' | 'trigger';
    trigger: string;
    action: string;
  }>({
    name: '',
    type: 'scheduled',
    trigger: '',
    action: '',
  });

  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name,
        type: automation.type,
        trigger: automation.trigger,
        action: automation.action,
      });
    }
  }, [automation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!automation) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an automation name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.trigger.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a trigger condition',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.action.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an action',
        variant: 'destructive',
      });
      return;
    }

    const updatedAutomation: Automation = {
      ...automation,
      ...formData,
    };

    onSave(updatedAutomation);
    toast({
      title: 'Success',
      description: 'Automation updated successfully',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Automation</DialogTitle>
          <DialogDescription>
            Update your automation settings and workflow configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Automation Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Welcome Message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled Messages</SelectItem>
                <SelectItem value="auto-reply">Auto-Reply</SelectItem>
                <SelectItem value="drip">Drip Campaign</SelectItem>
                <SelectItem value="trigger">Trigger-Based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Condition</Label>
            <Input
              id="trigger"
              value={formData.trigger}
              onChange={(e) =>
                setFormData({ ...formData, trigger: e.target.value })
              }
              placeholder={
                formData.type === 'scheduled'
                  ? 'e.g., Every Monday 9:00 AM'
                  : formData.type === 'auto-reply'
                  ? 'e.g., New contact added'
                  : formData.type === 'drip'
                  ? 'e.g., Tag: Product Interest'
                  : 'e.g., Cart abandoned > 24h'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Textarea
              id="action"
              value={formData.action}
              onChange={(e) =>
                setFormData({ ...formData, action: e.target.value })
              }
              placeholder="Describe what action should be taken"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};