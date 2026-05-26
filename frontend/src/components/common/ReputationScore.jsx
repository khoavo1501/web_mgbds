import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { getMyReputationScore } from '../../services/reputationService';
import ReputationBadge from './ReputationBadge';

export default function ReputationScore({ compact = false }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const response = await getMyReputationScore();
      if (response.success) {
        setScoreData(response.data);
      }
    } catch (error) {
      console.error('Error fetching reputation score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
    );
  }

  if (!scoreData) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ReputationBadge score={scoreData.currentScore} level={scoreData.level} size="sm" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Điểm uy tín</h3>
        <ReputationBadge score={scoreData.currentScore} level={scoreData.level} />
      </div>

      {/* Score Display */}
      <div className="flex items-end gap-2 mb-4">
        <div className="text-5xl font-extrabold text-gray-900">
          {scoreData.currentScore}
        </div>
        <div className="text-gray-500 mb-2">/100</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${
            scoreData.currentScore >= 80
              ? 'bg-green-600'
              : scoreData.currentScore >= 60
              ? 'bg-blue-600'
              : scoreData.currentScore >= 40
              ? 'bg-yellow-600'
              : scoreData.currentScore >= 20
              ? 'bg-orange-600'
              : 'bg-red-600'
          }`}
          style={{ width: `${Math.min(scoreData.currentScore, 100)}%` }}
        ></div>
      </div>

      {/* Restriction Message */}
      {scoreData.restrictionMessage && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">
            {scoreData.restrictionMessage}
          </p>
        </div>
      )}

      {/* Max Appointments Info */}
      {scoreData.canBookAppointment && scoreData.maxAppointments < 999 && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-semibold">Giới hạn:</span> Tối đa {scoreData.maxAppointments} lịch hẹn cùng lúc
        </div>
      )}
    </div>
  );
}
