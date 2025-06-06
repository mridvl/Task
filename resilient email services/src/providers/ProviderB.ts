export class ProviderB {
  async send(to: string, subject: string, body: string): Promise<boolean> {
    console.log("Sending with Provider B...");
    return Math.random() > 0.3;
  }
}
