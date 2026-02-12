import React from 'react';
import { X } from 'lucide-react';
import type { TransactionProgressPropsBuy, StepType, StepStatus } from './TransactionProgressBuy.type';
import { formatUnits } from 'viem';

const TransactionProgressBuy: React.FC<TransactionProgressPropsBuy> = ({ 
  isOpen,
  onClose,
  amount,
  position,
  setPosition,
  isPendingApprove,
  isConfirmingApprove,
  isConfirmedApproved,
  isPendingBuy,
  isConfirmingBuy,
  isConfirmedBuy,
  onApprove,
  onBuy,
}) => {
  if (!isOpen) return null;

  const getStepStatus = (step: StepType): StepStatus => {
    switch (step) {
      case 'position':
        if (position === -1) return 'waiting';
        return 'completed';
      case 'approve':
        if (position === -1) return 'locked';
        if (isPendingApprove) return 'pending';
        if (isConfirmingApprove) return 'confirming';
        if (isConfirmedApproved) return 'completed';
        return 'waiting';
      case 'buy':
        if (!isConfirmedApproved) return 'locked';
        if (isPendingBuy) return 'pending';
        if (isConfirmingBuy) return 'confirming';
        if (isConfirmedBuy) return 'completed';
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
          {/* Position Selection Step */}
          <div className="relative">
            <div className={`p-4 rounded-lg border-2 ${getBorderStyles(getStepStatus('position'))}`}>
              <h3 className="text-lg font-semibold text-white mb-3">Select Position</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setPosition(1)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all
                    ${position === 1 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setPosition(0)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all
                    ${position === 0
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Approve Step */}
          <div className="relative">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 
              ${getBorderStyles(getStepStatus('approve'))}`}>
              <div>
                <h3 className="text-lg font-semibold text-white">Approve USDC</h3>
                <p className="text-sm text-gray-400">Amount: {amount} USDC</p>
              </div>
              {getStepStatus('approve') === 'waiting' && (
                <button 
                  onClick={onApprove}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium"
                >
                  Approve
                </button>
              )}
              {getStepStatus('approve') === 'pending' && (
                <div className="text-yellow-500 animate-pulse">Processing...</div>
              )}
              {getStepStatus('approve') === 'confirming' && (
                <div className="text-yellow-500 animate-pulse">Confirming...</div>
              )}
              {getStepStatus('approve') === 'completed' && (
                <div className="text-green-500">Approved ✓</div>
              )}
            </div>
          </div>

          {/* Buy Step */}
          <div className="relative">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 
              ${getBorderStyles(getStepStatus('buy'))}`}>
              <div>
                <h3 className="text-lg font-semibold text-white">Buy Position</h3>
              </div>
              {getStepStatus('buy') === 'waiting' && (
                <button 
                  onClick={onBuy}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium"
                >
                  Buy {position === 1 ? 'Yes' : 'No'}
                </button>
              )}
              {getStepStatus('buy') === 'pending' && (
                <div className="text-yellow-500 animate-pulse">Processing...</div>
              )}
              {getStepStatus('buy') === 'confirming' && (
                <div className="text-yellow-500 animate-pulse">Confirming...</div>
              )}
              {getStepStatus('buy') === 'completed' && (
                <div className="text-green-500">Completed ✓</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionProgressBuy;