import { Shield, Star, AlertTriangle, Ban } from 'lucide-react';

export default function ReputationBadge({ score, level, size = 'md', showScore = true }) {
  const getConfig = () => {
    if (score >= 80) {
      return {
        icon: Star,
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Xuất sắc'
      };
    } else if (score >= 60) {
      return {
        icon: Shield,
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        label: 'Tốt'
      };
    } else if (score >= 40) {
      return {
        icon: Shield,
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Trung bình'
      };
    } else if (score >= 20) {
      return {
        icon: AlertTriangle,
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        label: 'Thấp'
      };
    } else if (score >= 0) {
      return {
        icon: Ban,
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Rất thấp'
      };
    } else {
      return {
        icon: Ban,
        bg: 'bg-gray-900',
        text: 'text-white',
        border: 'border-gray-900',
        label: 'Vi phạm'
      };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {showScore && <span>{score}</span>}
      <span>{config.label}</span>
    </span>
  );
}
