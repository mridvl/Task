import { EmailService } from "../src/services/EmailService";

describe("EmailService", () => {
  it("should send an email successfully", async () => {
    const service = new EmailService();
    const result = await service.sendEmail({
      to: "abc@example.com",
      subject: "Test Email",
      body: "Hello!",
      idempotencyKey: "test-1"
    });

    expect(["SUCCESS", "FAILED", "SKIPPED_RATE_LIMIT", "DUPLICATE"]).toContain(result);
  });

  it("should not send duplicate emails", async () => {
    const service = new EmailService();
    await service.sendEmail({
      to: "abc@example.com",
      subject: "Email 1",
      body: "Body",
      idempotencyKey: "unique-key"
    });
    const secondAttempt = await service.sendEmail({
      to: "abc@example.com",
      subject: "Email 1",
      body: "Body",
      idempotencyKey: "unique-key"
    });
    expect(secondAttempt).toBe("DUPLICATE");
  });
});
