import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface UsageData {
  daily_quota: string;
  monthly_quota: string;
  ratelimit_limit: string;
  ratelimit_remaining: string;
}

const UsageIndicator: React.FC = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/settings/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setUsage(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar uso:', error);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  if (!usage) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-black text-white text-xs font-mono tracking-tight rounded-sm">
      <div className="flex items-center gap-1.5 opacity-60">
        <Shield size={12} />
        <span>STATUS DA CONTA</span>
      </div>
      <div className="h-3 w-[1px] bg-white/20"></div>
      <div className="flex gap-4">
        <div>
          <span>RESTANTE (REQ): </span>
          <span className="text-white font-bold">{usage.ratelimit_remaining}</span>
          <span className="opacity-40"> / {usage.ratelimit_limit}</span>
        </div>
        {usage.daily_quota !== "0" && (
          <div>
            <span>DIÁRIO: </span>
            <span className="text-white font-bold">{usage.daily_quota}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageIndicator;
