import React from 'react';
import type { SOSStatus, SOSUrgency } from '../services/mockSosData';
import { AlertCircle, CheckCircle, Clock, Search, Loader, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SOSStatusBadgeProps {
  status?: SOSStatus;
  urgency?: SOSUrgency;
  className?: string;
}

export const SOSStatusBadge: React.FC<SOSStatusBadgeProps> = ({ status, urgency, className }) => {
  if (urgency) {
    const urgencyConfig = {
      Critical: {
        bg: 'bg-brand-error/10',
        text: 'text-brand-error',
        border: 'border-brand-error/20',
        icon: ShieldAlert,
        label: 'Critical',
      },
      High: {
        bg: 'bg-brand-warning/10',
        text: 'text-brand-warning',
        border: 'border-brand-warning/20',
        icon: AlertCircle,
        label: 'High',
      },
      Medium: {
        bg: 'bg-brand-info/10',
        text: 'text-brand-info',
        border: 'border-brand-info/20',
        icon: Clock,
        label: 'Medium',
      },
    };

    const config = urgencyConfig[urgency];
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', config.bg, config.text, config.border, className)}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  }

  if (status) {
    const statusConfig = {
      Pending: {
        bg: 'bg-brand-bg-muted',
        text: 'text-brand-text-secondary',
        border: 'border-brand-border-dark',
        icon: Clock,
        label: 'Pending',
      },
      Validating: {
        bg: 'bg-brand-info/10',
        text: 'text-brand-info',
        border: 'border-brand-info/20',
        icon: Search,
        label: 'Validating',
      },
      Processing: {
        bg: 'bg-brand-primary/10',
        text: 'text-brand-primary',
        border: 'border-brand-primary/20',
        icon: Loader,
        label: 'Processing',
      },
      Rejected: {
        bg: 'bg-brand-error/10',
        text: 'text-brand-error',
        border: 'border-brand-error/20',
        icon: AlertCircle,
        label: 'Rejected',
      },
      EvaluationInProgress: {
        bg: 'bg-brand-info/10',
        text: 'text-brand-info',
        border: 'border-brand-info/20',
        icon: Search,
        label: 'Evaluating',
      },
      NotificationsDispatched: {
        bg: 'bg-brand-primary/10',
        text: 'text-brand-primary',
        border: 'border-brand-primary/20',
        icon: Loader,
        label: 'Notified',
      },
      InventoryDispatched: {
        bg: 'bg-brand-warning/10',
        text: 'text-brand-warning',
        border: 'border-brand-warning/20',
        icon: Loader,
        label: 'Đã xuất kho',
      },
      Fulfilled: {
        bg: 'bg-brand-success/10',
        text: 'text-brand-success',
        border: 'border-brand-success/20',
        icon: CheckCircle,
        label: 'Fulfilled',
      },
      EvaluationFailed: {
        bg: 'bg-brand-error/10',
        text: 'text-brand-error',
        border: 'border-brand-error/20',
        icon: AlertCircle,
        label: 'Eval Failed',
      },
      Expired: {
        bg: 'bg-brand-error/10',
        text: 'text-brand-error',
        border: 'border-brand-error/20',
        icon: AlertCircle,
        label: 'Expired',
      },
      Cancelled: {
        bg: 'bg-brand-error/10',
        text: 'text-brand-error',
        border: 'border-brand-error/20',
        icon: AlertCircle,
        label: 'Cancelled',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200',
      icon: Clock,
      label: status,
    };
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', config.bg, config.text, config.border, className)}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {config.label}
      </span>
    );
  }

  return null;
};
