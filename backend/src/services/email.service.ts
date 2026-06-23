import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

const from = process.env.SMTP_FROM || "noreply@controltower.local";

function buildHtml(title: string, bodyLines: string[], severity?: string): string {
  const color = severity === "CRITICAL" ? "#dc2626" : severity === "HIGH" ? "#ea580c" : "#2563eb";
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<div style="border-left:4px solid ${color};padding:16px;background:#f8fafc">
<h2 style="margin:0 0 12px;color:#1e293b">${title}</h2>
${bodyLines.map(l => `<p style="margin:4px 0;color:#475569">${l}</p>`).join("")}
</div>
<p style="color:#94a3b8;font-size:12px;margin-top:24px">Control Tower Notification</p>
</body></html>`;
}

export const emailService = {
  async sendAlert(params: { to: string[]; subject: string; title: string; bodyLines: string[]; severity?: string }): Promise<boolean> {
    try {
      await transporter.sendMail({
        from,
        to: params.to.join(", "),
        subject: params.subject,
        html: buildHtml(params.title, params.bodyLines, params.severity),
      });
      return true;
    } catch {
      return false;
    }
  },
};
