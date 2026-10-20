import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import WishlistsPage from "../WishlistsPage";
import { supabase } from "@/services/supabaseClient";

function mockAuth(session: Session | null) {
  jest
    .spyOn(supabase.auth, "getSession")
    .mockResolvedValue({
      data: { session },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

  jest.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
    data: {
      subscription: { unsubscribe: jest.fn() },
    },
    error: null,
  } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>);
}

function renderWishlistsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/wishlists"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/wishlists" element={<WishlistsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WishlistsPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects logged-out users to the login page", async () => {
    mockAuth(null);

    renderWishlistsPage();

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
    expect(screen.queryByText("My Wish Lists")).not.toBeInTheDocument();
  });
});
