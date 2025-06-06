export class ProviderA {
  async send(to: string, subject: string, body: string): Promise<boolean> {
    console.log("Sending with Provider A...");
    return Math.random() > 0.3; // randomly succeed or fail
  }
}
