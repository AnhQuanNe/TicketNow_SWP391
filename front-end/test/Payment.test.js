import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Payment from "../src/user/js/PaymentPage"; // hoặc đường dẫn đúng đến Payment.js


// Mock window.location.href
delete window.location;
window.location = { href: "" };

// Mock console.error
console.error = jest.fn();

// Mock localStorage
const mockLocalStorage = {};
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn((key) => mockLocalStorage[key] || null),
      setItem: jest.fn((key, value) => (mockLocalStorage[key] = value)),
      clear: jest.fn(() => Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])),
    },
    writable: true,
  });
});

// Mock data setup
const tickets = [
  { price: 100, quantity: 2 },
  { price: 50, quantity: 1 },
];

describe("💳 Payment Component", () => {

  // ========== HAPPY PATH ==========
  test("1️⃣ Load component with valid tickets and token", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    mockLocalStorage["token"] = "abc123";
    mockLocalStorage["eventTitle"] = "Concert 2025";
    mockLocalStorage["lastPaidEventId"] = "E1";

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(window.location.href).toBe("https://payos.vn");
  });

  test("2️⃣ Should call fetch without Authorization when token missing", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    delete mockLocalStorage["token"];

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const call = global.fetch.mock.calls[0][1];
    expect(call.headers.Authorization).toBeUndefined();
  });

  test("3️⃣ Should truncate long eventTitle to 25 chars", async () => {
    mockLocalStorage["eventTitle"] =
      "Sự kiện văn hóa Việt Nam đặc biệt 2025";
    mockLocalStorage["tickets"] = JSON.stringify(tickets);

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.description.length).toBeLessThanOrEqual(25);
  });

  test("4️⃣ Calculate total correctly for multiple tickets", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    mockLocalStorage["eventTitle"] = "Show A";
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.amount).toBe(250);
  });

  // ========== EDGE CASES ==========
  test("5️⃣ Handle null price safely", async () => {
    mockLocalStorage["tickets"] = JSON.stringify([{ price: null, quantity: 2 }]);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.amount).toBe(0);
  });

  test("6️⃣ Handle negative price or quantity", async () => {
    mockLocalStorage["tickets"] = JSON.stringify([{ price: -100, quantity: 2 }]);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.amount).toBe(-200);
  });

  test("7️⃣ Handle empty tickets list gracefully", async () => {
    mockLocalStorage["tickets"] = JSON.stringify([]);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.amount).toBe(0);
  });

  // ========== ERROR HANDLING ==========
  test("8️⃣ Log error on network failure", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<Payment />);
    await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.stringMatching("Lỗi tạo QR:"), expect.any(Error)));
  });

  test("9️⃣ Handle missing checkoutUrl", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(window.location.href).not.toContain("http");
  });

  test("🔟 Handle 500 API error gracefully", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockRejectedValueOnce(new Error("500 Internal Server Error"));

    render(<Payment />);
    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });

  // ========== UI TESTS ==========
  test("11️⃣ Show loading message initially", () => {
    render(<Payment />);
    expect(screen.getByText(/Đang tạo link thanh toán/)).toBeInTheDocument();
  });

  test("12️⃣ Show success link when checkoutUrl exists", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => screen.getByText(/bấm vào đây/i));
    expect(screen.getByText(/bấm vào đây/i)).toBeInTheDocument();
  });

  // ========== INTEGRATION ==========
  test("13️⃣ Should redirect to checkoutUrl", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => expect(window.location.href).toBe("https://payos.vn"));
  });

  test("14️⃣ Should call fetch only once on mount", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  // ========== STATE TEST ==========
  test("15️⃣ Should update checkoutUrl state correctly", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ checkoutUrl: "https://payos.vn" }),
    });

    render(<Payment />);
    await waitFor(() => expect(window.location.href).toBe("https://payos.vn"));
  });
    // ========== EXTRA TEST CASES ==========

  test("16️⃣ Body should include orderCode and eventId", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    mockLocalStorage["lastPaidEventId"] = "E9";
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toHaveProperty("orderCode");
    expect(body).toHaveProperty("eventId", "E9");
  });

  test("17️⃣ Should include Authorization header when token exists", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    mockLocalStorage["token"] = "jwt_abc";
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toMatch(/^Bearer /);
  });

  test("18️⃣ Should not crash if fetch returns invalid JSON", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({ json: async () => { throw new Error("Bad JSON"); } });

    render(<Payment />);
    await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.stringMatching("Lỗi tạo QR:"), expect.any(Error)));
  });

  test("19️⃣ UI should still show loading if fetch takes long", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ json: async () => ({}) }), 200))
    );

    render(<Payment />);
    expect(screen.getByText(/Đang tạo link thanh toán/)).toBeInTheDocument();
  });

  test("20️⃣ Should send correct Content-Type header", async () => {
    mockLocalStorage["tickets"] = JSON.stringify(tickets);
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });

    render(<Payment />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
  });

});


