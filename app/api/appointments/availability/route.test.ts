import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

describe("GET /api/appointments/availability", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns 401 when user is not authenticated", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } })
      }
    });

    const { GET } = await import("@/app/api/appointments/availability/route");
    const request = new Request("http://localhost:3000/api/appointments/availability");
    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when required query params are missing", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } })
      }
    });

    const { GET } = await import("@/app/api/appointments/availability/route");
    const request = new Request("http://localhost:3000/api/appointments/availability?organizationId=abc");
    const response = await GET(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "organizationId, providerUserId, and date are required"
    });
  });
});
