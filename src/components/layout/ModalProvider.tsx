"use client"

import * as React from 'react';
import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

// Modal types
export type ModalType = 'dialog' | 'sheet' | 'drawer' | 'fullscreen';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface ModalConfig {
  id: string;
  type?: ModalType;
  size?: ModalSize;
  variant?: ModalVariant;
  title: string;
  description?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  className?: string;
}

export interface ModalContextType {
  modals: Map<string, ModalConfig>;
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

/**
 * Modal Provider with responsive overlay management
 * Features:
 * - Automatic responsive modal type selection
 * - Multiple concurrent modals with z-index management
 * - Touch-friendly mobile interactions
 * - Keyboard navigation and focus management
 * - Customizable variants and sizes
 * - Gesture-based dismissal for mobile
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = React.useState<Map<string, ModalConfig>>(new Map());
  const [isMobile, setIsMobile] = React.useState(false);

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modals are open
  React.useEffect(() => {
    const hasModals = modals.size > 0;
    const hasPreventScroll = Array.from(modals.values()).some(m => m.preventScroll !== false);
    
    if (hasModals && hasPreventScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [modals]);

  const openModal = React.useCallback((config: ModalConfig) => {
    setModals(prev => new Map(prev.set(config.id, config)));
  }, []);

  const closeModal = React.useCallback((id: string) => {
    setModals(prev => {
      const newModals = new Map(prev);
      const modal = newModals.get(id);
      if (modal?.onClose) {
        modal.onClose();
      }
      newModals.delete(id);
      return newModals;
    });
  }, []);

  const closeAllModals = React.useCallback(() => {
    modals.forEach((modal) => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setModals(new Map());
  }, [modals]);

  const updateModal = React.useCallback((id: string, updates: Partial<ModalConfig>) => {
    setModals(prev => {
      const newModals = new Map(prev);
      const existingModal = newModals.get(id);
      if (existingModal) {
        newModals.set(id, { ...existingModal, ...updates });
      }
      return newModals;
    });
  }, []);

  const contextValue: ModalContextType = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    updateModal
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Render all active modals */}
      {Array.from(modals.entries()).map(([id, modal], index) => (
        <ModalRenderer
          key={id}
          modal={modal}
          isMobile={isMobile}
          zIndex={1000 + index * 10}
          onClose={() => closeModal(id)}
        />
      ))}
    </ModalContext.Provider>
  );
}

// Modal Renderer Component
function ModalRenderer({
  modal,
  isMobile,
  zIndex,
  onClose
}: {
  modal: ModalConfig;
  isMobile: boolean;
  zIndex: number;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = () => {
    if (modal.closable !== false) {
      setIsOpen(false);
      setTimeout(onClose, 200); // Wait for animation
    }
  };

  const handleOverlayClick = () => {
    if (modal.closeOnOverlayClick !== false) {
      handleClose();
    }
  };

  // Auto-select modal type based on screen size and config
  const getModalType = (): ModalType => {
    if (modal.type) return modal.type;
    
    if (isMobile) {
      if (modal.size === 'full') return 'fullscreen';
      return 'sheet';
    }
    
    return 'dialog';
  };

  const modalType = getModalType();
  const variant = modal.variant || 'default';

  // Variant icons and colors
  const variantConfig = {
    default: { icon: null, color: '' },
    destructive: { icon: AlertTriangle, color: 'text-red-600' },
    success: { icon: CheckCircle, color: 'text-green-600' },
    warning: { icon: AlertCircle, color: 'text-yellow-600' },
    info: { icon: Info, color: 'text-blue-600' }
  };

  const VariantIcon = variantConfig[variant].icon;

  // Common header content
  const HeaderContent = ({ className = "" }: { className?: string }) => (
    <div className={cn("flex items-start space-x-3", className)}>
      {VariantIcon && (
        <VariantIcon className={cn("w-5 h-5 mt-0.5", variantConfig[variant].color)} />
      )}
      <div className="flex-1">
        <div className="text-lg font-semibold">{modal.title}</div>
        {modal.description && (
          <div className="text-sm text-muted-foreground mt-1">
            {modal.description}
          </div>
        )}
      </div>
    </div>
  );

  // Render based on modal type
  switch (modalType) {
    case 'dialog':
      return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent
            className={cn(
              getSizeClasses(modal.size, 'dialog'),
              modal.className
            )}
            style={{ zIndex }}
            onInteractOutside={handleOverlayClick}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">{modal.title}</DialogTitle>
              <HeaderContent />
              {modal.description && (
                <DialogDescription className="sr-only">
                  {modal.description}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4">
              {modal.content}
            </div>
            {modal.footer && (
              <DialogFooter>
                {modal.footer}
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      );

    case 'sheet':
      return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
          <SheetContent
            className={cn(
              getSizeClasses(modal.size, 'sheet'),
              modal.className
            )}
            style={{ zIndex }}
            side={isMobile ? 'bottom' : 'right'}
            onInteractOutside={handleOverlayClick}
          >
            <SheetHeader>
              <SheetTitle className="sr-only">{modal.title}</SheetTitle>
              <HeaderContent />
              {modal.description && (
                <SheetDescription className="sr-only">
                  {modal.description}
                </SheetDescription>
              )}
            </SheetHeader>
            <div className="py-4 flex-1 overflow-auto">
              {modal.content}
            </div>
            {modal.footer && (
              <SheetFooter className="border-t pt-4">
                {modal.footer}
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      );

    case 'drawer':
      return (
        <Drawer open={isOpen} onOpenChange={handleClose}>
          <DrawerContent
            className={cn(
              getSizeClasses(modal.size, 'drawer'),
              modal.className
            )}
            style={{ zIndex }}
          >
            <DrawerHeader>
              <DrawerTitle className="sr-only">{modal.title}</DrawerTitle>
              <HeaderContent />
              {modal.description && (
                <DrawerDescription className="sr-only">
                  {modal.description}
                </DrawerDescription>
              )}
            </DrawerHeader>
            <div className="px-4 py-4 flex-1 overflow-auto">
              {modal.content}
            </div>
            {modal.footer && (
              <DrawerFooter className="border-t">
                {modal.footer}
              </DrawerFooter>
            )}
          </DrawerContent>
        </Drawer>
      );

    case 'fullscreen':
      return (
        <div 
          className="fixed inset-0 bg-background z-50"
          style={{ zIndex }}
        >
          <div className="flex flex-col h-full">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <HeaderContent />
              {modal.closable !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Fullscreen Content */}
            <div className="flex-1 overflow-auto p-4">
              {modal.content}
            </div>
            
            {/* Fullscreen Footer */}
            {modal.footer && (
              <div className="border-t p-4">
                {modal.footer}
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Size class utilities
function getSizeClasses(size: ModalSize = 'md', type: ModalType): string {
  const sizeClasses = {
    dialog: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full h-full'
    },
    sheet: {
      sm: 'w-80',
      md: 'w-96',
      lg: 'w-[32rem]',
      xl: 'w-[40rem]',
      full: 'w-full'
    },
    drawer: {
      sm: 'max-h-[50vh]',
      md: 'max-h-[60vh]',
      lg: 'max-h-[70vh]',
      xl: 'max-h-[80vh]',
      full: 'h-full'
    }
  };

  return sizeClasses[type][size] || sizeClasses[type]['md'];
}

// Convenience hooks for common modal patterns
export function useConfirmModal() {
  const { openModal } = useModal();

  return (config: {
    title: string;
    description?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: ModalVariant;
  }) => {
    const modalId = `confirm-${Date.now()}`;
    
    openModal({
      id: modalId,
      title: config.title,
      description: config.description,
      variant: config.variant || 'default',
      content: (
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      ),
      footer: (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              config.onCancel?.();
              // Close modal would be handled by the button click
            }}
          >
            {config.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={config.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              config.onConfirm();
              // Close modal would be handled by the button click
            }}
          >
            {config.confirmText || 'Confirm'}
          </Button>
        </div>
      )
    });
  };
}

export function useAlertModal() {
  const { openModal } = useModal();

  return (config: {
    title: string;
    description?: string;
    onClose?: () => void;
    variant?: ModalVariant;
  }) => {
    const modalId = `alert-${Date.now()}`;
    
    openModal({
      id: modalId,
      title: config.title,
      description: config.description,
      variant: config.variant || 'info',
      content: (
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      ),
      footer: (
        <Button onClick={() => config.onClose?.()}>
          OK
        </Button>
      )
    });
  };
}

export default ModalProvider;