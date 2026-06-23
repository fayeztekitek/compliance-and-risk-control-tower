const webhookUrl = process.env.SLACK_WEBHOOK_URL || "";

export const slackService = {
  async sendAlert(message: string, severity?: string): Promise<boolean> {
    if (!webhookUrl) return false;
    try {
      const emoji = severity === "CRITICAL" ? ":red_circle:" : severity === "HIGH" ? ":orange_circle:" : ":large_blue_circle:";
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${emoji} *${severity || "INFO"}* ${message}` }),
      });
      return true;
    } catch {
      return false;
    }
  },
};
