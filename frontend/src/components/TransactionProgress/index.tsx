import React from 'react';
import { X } from 'lucide-react';
import type { TransactionProgressProps, StepType, StepStatus } from './TransactionProgress.type';

const TransactionProgress: React.FC<TransactionProgressProps> = ({ 
  isOpen,
  onClose,
  amount,
  isPendingApprove,
  isConfirmingApprove,
  isConfirmedApproved,
  isPendingFunding,
  isConfirmingFunding,
  isConfirmedFunding,
  onApprove,
  onFunding
}) => {
  if (!isOpen) return null;

  const getStepStatus = (step: StepType): StepStatus => {
    switch (step) {
      case 'approve':
        if (isPendingApprove) return 'pending';
        if (isConfirmingApprove) return 'confirming';
        if (isConfirmedApproved) return 'completed';
        return 'waiting';
      case 'fund':
        if (!isConfirmedApproved) return 'locked';
        if (isPendingFunding) return 'pending';
        if (isConfirmingFunding) return 'confirming';
        if (isConfirmedFunding) return 'completed';
        return 'waiting';
      default:
        return 'waiting';
    }
  };

  const getBorderStyles = (status: StepStatus): string => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-900/20';
      case 'pending':
      case 'confirming':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'locked':
        return 'border-gray-700 bg-gray-800/50 opacity-50';
      default:
        return 'border-gray-600 bg-gray-800/50';
    }
  };

  const StatusDisplay: React.FC<{ status: StepStatus, type: StepType }> = ({ status, type }) => {
    switch (status) {
      case 'pending':
        return <div className="text-yellow-500 animate-pulse">Processing...</div>;
      case 'confirming':
        return <div className="text-yellow-500 animate-pulse">Confirming...</div>;
      case 'completed':
        return <div className="text-green-500">
          {type === 'approve' ? 'Approved' : 'Funded'} ✓
        </div>;
      case 'locked':
        return <div className="text-gray-500">Waiting for approval</div>;
      case 'waiting':
        return (
          <button 
            onClick={type === 'approve' ? onApprove : onFunding}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              type === 'approve' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {type === 'approve' ? 'Approve' : 'Fund'}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-lime-400 p-6 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-lime-400 mb-6 text-center">
          Transaction Progress
        </h2>

        <div className="space-y-6">
          {/* Approve Step */}
          <div className="relative">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 
              ${getBorderStyles(getStepStatus('approve'))}`}>
              <div>
                <h3 className="text-lg font-semibold text-white">Approve USDC</h3>
                <p className="text-sm text-gray-400">Amount: {amount} USDC</p>
              </div>
              <StatusDisplay status={getStepStatus('approve')} type="approve" />
            </div>
          </div>

          {/* Fund Step */}
          <div className="relative">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 
              ${getBorderStyles(getStepStatus('fund'))}`}>
              <div>
                <h3 className="text-lg font-semibold text-white">Add Funding</h3>
                <p className="text-sm text-gray-400">Fund the event</p>
              </div>
              <StatusDisplay status={getStepStatus('fund')} type="fund" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionProgress;