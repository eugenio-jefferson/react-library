export type NotificationType =
  | "book_available"
  | "due_date_approaching"
  | "overdue_alert";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_book_id: string | null;
  related_book_work_id: string | null;
  created_at: string;
}
