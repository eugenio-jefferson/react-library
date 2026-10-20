import { jest } from "@jest/globals";
import { AuthError, type User } from "@supabase/supabase-js";
import { NotificationService } from "../notificationService";
import { supabase } from "../supabaseClient";

type BuilderResult = { data: unknown; error: unknown };

interface MockBuilder {
  update: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
  select: ReturnType<typeof jest.fn>;
  eq: ReturnType<typeof jest.fn>;
  order: ReturnType<typeof jest.fn>;
  limit: ReturnType<typeof jest.fn>;
  single: ReturnType<typeof jest.fn>;
  maybeSingle: ReturnType<typeof jest.fn>;
  then: (
    onFulfilled?: ((value: BuilderResult) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
}

function createBuilder(result: BuilderResult): MockBuilder {
  const builder: MockBuilder = {
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

describe("NotificationService", () => {
  const service = new NotificationService();

  function mockGetUser(user: User | null, error: AuthError | null = null) {
    return jest
      .spyOn(supabase.auth, "getUser")
      .mockResolvedValue({
        data: { user },
        error,
      } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
  }

  function mockFrom(...builders: MockBuilder[]) {
    const fromSpy = jest.spyOn(supabase, "from");
    for (const builder of builders) {
      fromSpy.mockReturnValueOnce(builder as never);
    }
    return fromSpy;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMyNotifications", () => {
    it("returns notifications with the related book work id", async () => {
      const rows = [
        {
          id: "notif-1",
          user_id: "user-1",
          type: "book_available",
          title: "Book Available!",
          message: "Clean Architecture is now available to borrow.",
          is_read: false,
          related_book_id: "book-1",
          created_at: "2026-10-18T10:00:00.000Z",
          books: { work_id: "OL101W" },
        },
      ];
      const builder = createBuilder({ data: rows, error: null });
      mockFrom(builder);

      const result = await service.getMyNotifications("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("book_available");
      expect(result[0].is_read).toBe(false);
      expect(result[0].related_book_work_id).toBe("OL101W");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(builder.limit).toHaveBeenCalledWith(25);
    });
  });

  describe("markAsRead", () => {
    it("updates only unread notifications by id", async () => {
      const builder = createBuilder({ data: null, error: null });
      const fromSpy = mockFrom(builder);

      await service.markAsRead("notif-1");

      expect(builder.update).toHaveBeenCalledWith({ is_read: true });
      expect(builder.eq).toHaveBeenCalledWith("id", "notif-1");
      expect(builder.eq).toHaveBeenCalledWith("is_read", false);
      expect(fromSpy).toHaveBeenCalledWith("notifications");
    });
  });

  describe("removeNotification", () => {
    it("throws when the user is not authenticated", async () => {
      mockGetUser(null, new AuthError("User not authenticated"));

      await expect(service.removeNotification("notif-1")).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("deletes the notification of the current user", async () => {
      mockGetUser({ id: "user-1" } as User);

      const builder = createBuilder({ data: null, error: null });
      mockFrom(builder);

      await service.removeNotification("notif-1");

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "notif-1");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("clearAllNotifications", () => {
    it("deletes all notifications of the current user", async () => {
      mockGetUser({ id: "user-1" } as User);

      const builder = createBuilder({ data: null, error: null });
      mockFrom(builder);

      await service.clearAllNotifications();

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });
});
