import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  mode?: "create" | "edit" | "view";
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = "Save",
  isLoading = false,
  disabled = false,
  mode = "create",
}: CrudDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
        {mode !== "view" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading || disabled}>
              Cancel
            </Button>
            <Button 
              className="gradient-primary text-primary-foreground" 
              onClick={onSave}
              disabled={isLoading || disabled}
            >
              {isLoading ? "Saving..." : saveLabel}
            </Button>
          </DialogFooter>
        )}
        {mode === "view" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
