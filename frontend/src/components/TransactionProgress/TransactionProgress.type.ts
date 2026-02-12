// TransactionProgress.types.ts
export interface TransactionProgressProps {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    isPendingApprove: boolean;
    isConfirmingApprove: boolean;
    isConfirmedApproved: boolean;
    isPendingFunding: boolean;
    isConfirmingFunding: boolean;
    isConfirmedFunding: boolean;
    onApprove: () => void;
    onFunding: () => void;
  }
  
export type StepType = 'approve' | 'fund';
export type StepStatus = 'waiting' | 'pending' | 'confirming' | 'completed' | 'locked';

// TransactionProgress.types.ts
