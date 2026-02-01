import { createTransport, type Transporter } from 'nodemailer';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../config.js';

const ICON_PATH = join(__dirname, '../../assets/icon.png');

function getIconBase64(): string | null {
  try {
    if (existsSync(ICON_PATH)) {
      const buf = readFileSync(ICON_PATH);
      return buf.toString('base64');
    }
  } catch {
    // ignore
  }
  return null;
}

function buildHtml(code: string, iconBase64: string | null): string {
  const iconImg = iconBase64
    ? `<img src="data:image/png;base64,${iconBase64}" alt="Carnawaze" width="80" height="80" style="display:block;margin:0 auto 16px;" />`
    : '';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail - Carnawaze</title>
</head>
<body style="margin:0;font-family:sans-serif;background:#1a1a2e;color:#fff;padding:24px;">
  <div style="max-width:360px;margin:0 auto;background:#16213e;border-radius:16px;padding:24px;text-align:center;">
    ${iconImg}
    <h1 style="color:#e94560;font-size:22px;margin:0 0 8px;">Carnawaze</h1>
    <p style="color:#a0a0a0;font-size:14px;margin:0 0 24px;">Trios elétricos no Carnaval de Salvador</p>
    <p style="color:#fff;font-size:16px;margin:0 0 8px;">Seu código de confirmação:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#e94560;margin:16px 0;">${code}</p>
    <p style="color:#a0a0a0;font-size:12px;margin:16px 0 0;">Válido por 10 minutos.</p>
  </div>
</body>
</html>
`.trim();
}

export interface MailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

export function getMailConfig(config: Config): MailConfig | null {
  if (!config.SMTP_HOST || !config.MAIL_FROM) return null;
  return {
    from: config.MAIL_FROM,
    host: config.SMTP_HOST,
    port: config.SMTP_PORT ?? 587,
    secure: config.SMTP_SECURE ?? false,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  };
}

export async function sendConfirmationEmail(
  config: Config,
  to: string,
  code: string
): Promise<void> {
  const mailConfig = getMailConfig(config);
  const iconBase64 = getIconBase64();
  const html = buildHtml(code, iconBase64);

  if (!mailConfig) {
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      console.log('\n[Mail] SMTP não configurado — código de confirmação (copie no app):');
      console.log('  E-mail:', to);
      console.log('  Código:', code);
      console.log('');
    }
    return;
  }

  const transportOptions: Parameters<typeof createTransport>[0] = {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
  };
  if (mailConfig.user != null) {
    transportOptions.auth = { user: mailConfig.user, pass: mailConfig.pass ?? '' };
  }
  const transporter: Transporter = createTransport(transportOptions);

  await transporter.sendMail({
    from: mailConfig.from,
    to,
    subject: 'Confirme seu e-mail - Carnawaze',
    html,
    text: `Seu código de confirmação Carnawaze: ${code}\nVálido por 10 minutos.`,
  });
}
