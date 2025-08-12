import { test, expect } from "@playwright/test";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ENDPOINT = "/api/submissions/latest";

test.describe(`GET ${ENDPOINT}`, () => {
  const validEmail = "test@coderpush.com";
  const invalidEmail = "user@gmail.com";
  const noSubmissionEmail = "nopulse@coderpush.com";
  const validOrigin = "http://localhost:3000";
  const invalidOrigin = "https://evil.com";

  const unauthorizedHeader = {};
  const authorizedHeader = {
    Authorization: `Bearer ${process.env.CODERPUSH_PULSE_SECRET_KEY || "test-super-secret-key"}`,
  };

  test("should return 401 if not authorized", async ({ request }) => {
    const res = await request.get(`${BASE_URL}${ENDPOINT}?email=${validEmail}`, {
      headers: {
        Origin: validOrigin,
        ...unauthorizedHeader,
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("should return 403 if origin is not allowed", async ({ request }) => {
    const res = await request.get(`${BASE_URL}${ENDPOINT}?email=${validEmail}`, {
      headers: {
        Origin: invalidOrigin,
        ...authorizedHeader,
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("CORS forbidden");
  });

  test("should return 400 for invalid email", async ({ request }) => {
    const res = await request.get(`${BASE_URL}${ENDPOINT}?email=${invalidEmail}`, {
      headers: {
        Origin: validOrigin,
        ...authorizedHeader,
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or missing email");
  });

  test("should return 404 if no submission is found", async ({ request }) => {
    const res = await request.get(`${BASE_URL}${ENDPOINT}?email=${noSubmissionEmail}`, {
      headers: {
        Origin: validOrigin,
        ...authorizedHeader,
      },
    });

    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("No submission found");
  });

  test("should return 200 and submission data for valid request", async ({ request }) => {
    const res = await request.get(`${BASE_URL}${ENDPOINT}?email=${validEmail}`, {
      headers: {
        Origin: validOrigin,
        ...authorizedHeader,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("primary_project_name");
    expect(body).toHaveProperty("additional_projects");
    expect(body).toHaveProperty("primary_project_hours");
    expect(body).toHaveProperty("manager");
  });

  test("OPTIONS request should return 204", async ({ request }) => {
    const res = await request.fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "OPTIONS",
      headers: {
        Origin: validOrigin,
        ...authorizedHeader,
      },
    });

    expect(res.status()).toBe(204);
  });
});
