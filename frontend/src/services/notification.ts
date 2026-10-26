import { supabase } from '@/lib/supabase';
import { parseErrorMessage } from './database';

// =====================
// Notification Service
// =====================

export type NotificationType = 'alert' | 'info' | 'warning' | 'success' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TargetType = 'user' | 'role' | 'ward' | 'hospital' | 'all';

export interface Notification {
  notification_id: string;
  title: string | null;
  message: string | null;
  type: NotificationType | null;
  priority: NotificationPriority | null;
  target_type: TargetType | null;
  target_user_id: string | null;
  target_role: string | null;
  target_ward_number: number | null;
  target_hospital_id: string | null;
  related_entity: string | null;
  related_entity_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  target_type?: TargetType;
  target_user_id?: string;
  target_role?: string;
  target_ward_number?: number;
  target_hospital_id?: string;
  related_entity?: string;
  related_entity_id?: string;
  created_by?: string;
}

export const notificationService = {
  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<{ data: Notification | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: input.title,
          message: input.message,
          type: input.type || 'info',
          priority: input.priority || 'medium',
          target_type: input.target_type || 'all',
          target_user_id: input.target_user_id || null,
          target_role: input.target_role || null,
          target_ward_number: input.target_ward_number || null,
          target_hospital_id: input.target_hospital_id || null,
          related_entity: input.related_entity || null,
          related_entity_id: input.related_entity_id || null,
          created_by: input.created_by || null
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  /**
   * Create a notification for a citizen when their lab report is ready
   */
  async notifyLabReportReady(
    citizenId: string,
    reportId: string,
    testName: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: 'Lab Report Ready',
          message: `Your lab test report for ${testName} is ready. You can now view or download the report.`,
          type: 'success',
          priority: 'medium',
          target_type: 'user',
          target_user_id: citizenId, // This will be the citizen's user_id if available
          related_entity: 'diagnostic_report',
          related_entity_id: reportId
        });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  /**
   * Get all notifications (for admin/staff view)
   */
  async getAll(): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  /**
   * Get notifications for a specific user
   */
  async getByUserId(userId: string): Promise<{ data: Notification[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`target_user_id.eq.${userId},target_type.eq.all`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  /**
   * Mark notification as read (if using a read_status table)
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // This would require a notification_reads table or a read field
      // For now, we'll just return success
      console.log('Marking notification as read:', notificationId);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOld(daysOld: number = 30): Promise<{ success: boolean; error: string | null }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  }
};

export default notificationService;
