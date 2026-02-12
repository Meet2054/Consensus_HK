export interface TransactionProgressPropsBuy {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    position: number;
    setPosition: (position: number) => void;
    isPendingApprove: boolean;
    isConfirmingApprove: boolean;
    isConfirmedApproved: boolean;
    isPendingBuy: boolean;
    isConfirmingBuy: boolean;
    isConfirmedBuy: boolean;
    onApprove: () => void;
    onBuy: () => void;
  }

export type StepType = 'position' | 'approve' | 'buy';
export type StepStatus = 'waiting' | 'pending' | 'confirming' | 'completed' | 'locked';