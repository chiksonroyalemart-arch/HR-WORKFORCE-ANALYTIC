import React from 'react';
import { AlertCircle, CheckCircle2, Clock, MinusCircle } from 'lucide-react';
import { ConfirmationCategory, ProbationCategory } from '../types/hr';

export const ProbationStatusLabel: React.FC<{ category: ProbationCategory; raw?: string }> = ({
  category,
}) => {
  const styles: Record<
    ProbationCategory,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    'In Progress': {
      text: 'text-[#0C0843]',
      bg: 'bg-[#EDECF5]',
      border: 'border-[#0C0843]/20',
      icon: <Clock className="w-3.5 h-3.5 text-[#0C0843] shrink-0" />,
    },
    'Approaching Deadline': {
      text: 'text-[#8C6812]',
      bg: 'bg-[#FBF6E9]',
      border: 'border-[#D2A946]/50',
      icon: <Clock className="w-3.5 h-3.5 text-[#D2A946] shrink-0" />,
    },
    'Due Within 7 Days': {
      text: 'text-[#92400E]',
      bg: 'bg-[#FEF3C7]',
      border: 'border-[#D2A946]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />,
    },
    Overdue: {
      text: 'text-[#991B1B]',
      bg: 'bg-[#FEE2E2]',
      border: 'border-[#FCA5A5]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />,
    },
    Completed: {
      text: 'text-[#166534]',
      bg: 'bg-[#DCFCE7]',
      border: 'border-[#86EFAC]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />,
    },
    'Not Required': {
      text: 'text-[#6B6B80]',
      bg: 'bg-[#F6F6FA]',
      border: 'border-[#E6E5ED]',
      icon: <MinusCircle className="w-3.5 h-3.5 text-[#6B6B80] shrink-0" />,
    },
    Unavailable: {
      text: 'text-[#6B6B80]',
      bg: 'bg-[#F6F6FA]',
      border: 'border-[#E6E5ED]',
      icon: <MinusCircle className="w-3.5 h-3.5 text-[#6B6B80] shrink-0" />,
    },
  };

  const s = styles[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}
    >
      {s.icon}
      <span>{category}</span>
    </span>
  );
};

export const ConfirmationStatusLabel: React.FC<{ category: ConfirmationCategory }> = ({
  category,
}) => {
  const styles: Record<
    ConfirmationCategory,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    Confirmed: {
      text: 'text-[#166534]',
      bg: 'bg-[#DCFCE7]',
      border: 'border-[#86EFAC]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />,
    },
    'Confirmation Due': {
      text: 'text-[#8C6812]',
      bg: 'bg-[#FBF6E9]',
      border: 'border-[#D2A946]',
      icon: <Clock className="w-3.5 h-3.5 text-[#D2A946] shrink-0" />,
    },
    'Overdue Confirmation': {
      text: 'text-[#991B1B]',
      bg: 'bg-[#FEE2E2]',
      border: 'border-[#FCA5A5]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />,
    },
    'Awaiting Confirmation': {
      text: 'text-[#0C0843]',
      bg: 'bg-[#EDECF5]',
      border: 'border-[#0C0843]/20',
      icon: <Clock className="w-3.5 h-3.5 text-[#0C0843] shrink-0" />,
    },
    'Missing Data': {
      text: 'text-[#6B6B80]',
      bg: 'bg-[#F6F6FA]',
      border: 'border-[#E6E5ED]',
      icon: <MinusCircle className="w-3.5 h-3.5 text-[#6B6B80] shrink-0" />,
    },
  };

  const s = styles[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}
    >
      {s.icon}
      <span>{category}</span>
    </span>
  );
};
