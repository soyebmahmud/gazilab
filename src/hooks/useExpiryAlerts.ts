import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpiryAlert {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_available: number;
  expiry_date: string;
  days_until_expiry: number;
  alert_level: 'expired' | 'critical' | 'warning' | 'info';
}

export function useExpiryAlerts(days: number = 90) {
  return useQuery({
    queryKey: ['expiry-alerts', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_expiry_alerts', { p_days: days });
      
      if (error) throw error;
      return data as ExpiryAlert[];
    },
  });
}

export function useExpiryAlertsSummary() {
  return useQuery({
    queryKey: ['expiry-alerts-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_expiry_alerts', { p_days: 90 });
      
      if (error) throw error;
      
      const alerts = data as ExpiryAlert[];
      
      return {
        expired: alerts.filter(a => a.alert_level === 'expired').length,
        critical: alerts.filter(a => a.alert_level === 'critical').length,
        warning: alerts.filter(a => a.alert_level === 'warning').length,
        info: alerts.filter(a => a.alert_level === 'info').length,
        total: alerts.length,
        alerts
      };
    },
  });
}
