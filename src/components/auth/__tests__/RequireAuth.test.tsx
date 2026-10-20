import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { Session } from "@supabase/supabase-js";
import RequireAuth from "../RequireAuth";
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

function renderLoansRoute() {
  return render(
    <MemoryRouter initialEntries={["/loans"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/loans"
          element={
            <RequireAuth>
              <div>Private loans content</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects logged-out users to the login page", async () => {
    mockAuth(null);

    renderLoansRoute();

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
    expect(screen.queryByText("Private loans content")).not.toBeInTheDocument();
  });

  it("renders the protected content for logged-in users", async () => {
    mockAuth({ user: { id: "user-1" }, access_token: "token" } as Session);

    renderLoansRoute();

    await waitFor(() => {
      expect(screen.getByText("Private loans content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
