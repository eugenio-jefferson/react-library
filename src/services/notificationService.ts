import { supabase } from "./supabaseClient";
import type { AppNotification, NotificationType } from "../type/notification";

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean | null;
  related_book_id: string | null;
  created_at: string;
  books: { work_id: string } | null;
}

export class NotificationService {
  private async requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new Error("You must be logged in to view notifications.");
    }
    return data.user;
  }

  async getMyNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, books:related_book_id(work_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: row.is_read ?? false,
      related_book_id: row.related_book_id,
      related_book_work_id: row.books?.work_id ?? null,
      created_at: row.created_at,
    }));
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("is_read", false);

    if (error) {
      throw new Error(error.message || "Unable to mark the notification as read.");
    }
  }

  async markAllAsRead(): Promise<void> {
    const user = await this.requireUser();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      throw new Error(
        error.message || "Unable to mark all notifications as read.",
      );
    }
  }

  async removeNotification(notificationId: string): Promise<void> {
    const user = await this.requireUser();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message || "Unable to remove the notification.");
    }
  }

  async clearAllNotifications(): Promise<void> {
    const user = await this.requireUser();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message || "Unable to clear the notifications.");
    }
  }
}

export const notificationService = new NotificationService();
