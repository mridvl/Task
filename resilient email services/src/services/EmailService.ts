import { ProviderA } from "../providers/ProviderA";
import { ProviderB } from "../providers/ProviderB";

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  idempotencyKey: string;
}

type Status = "SUCCESS" | "FAILED" | "SKIPPED_RATE_LIMIT" | "DUPLICATE";

export class EmailService {
  private providerA = new ProviderA();
  private providerB = new ProviderB();
  private sentKeys = new Set<string>();
  private rateLimitMap = new Map<string, number>();
  private statusMap = new Map<string, Status>();

  private MAX_RETRIES = 3;
  private RATE_LIMIT = 3; // per email

  async sendEmail(request: EmailRequest): Promise<Status> {
    const { to, subject, body, idempotencyKey } = request;

    if (this.sentKeys.has(idempotencyKey)) {
      this.statusMap.set(idempotencyKey, "DUPLICATE");
      return "DUPLICATE";
    }

    // rate limiting
    const now = Date.now();
    const count = this.rateLimitMap.get(to) || 0;
    if (count >= this.RATE_LIMIT) {
      this.statusMap.set(idempotencyKey, "SKIPPED_RATE_LIMIT");
      return "SKIPPED_RATE_LIMIT";
    }
    this.rateLimitMap.set(to, count + 1);

    let success = await this.trySend(() => this.providerA.send(to, subject, body));
    if (!success) {
      success = await this.trySend(() => this.providerB.send(to, subject, body));
    }

    const status = success ? "SUCCESS" : "FAILED";
    if (success) this.sentKeys.add(idempotencyKey);
    this.statusMap.set(idempotencyKey, status);

    return status;
  }

  private async trySend(sendFn: () => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      const success = await sendFn();
      if (success) return true;
      await this.delay(2 ** i * 100); // exponential backoff
    }
    return false;
  }

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  getStatus(idempotencyKey: string): Status | undefined {
    return this.statusMap.get(idempotencyKey);
  }
}
