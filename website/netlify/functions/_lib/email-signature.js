// Shared sign-off appended to every outbound parent-facing HTML email sent
// from this repository's Netlify Functions (registration, waitlist,
// birthday, and confirmation emails). Keep this as the single place the
// signature is defined so a future change to contact details or the
// combined logo only has to happen once.

const SIGNATURE_IMAGE_URL = 'https://krianatutoring.com/images/email-signature/kriana-tutoring-young-engineers-full-quality-signature.png'
// Source image is 1920x341 (~5.63:1). Displayed narrower for email clients;
// height is kept proportional so it never looks stretched.
const SIGNATURE_IMAGE_WIDTH = 440
const SIGNATURE_IMAGE_HEIGHT = 78

export function emailSignatureHtml() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td style="border-top:1px solid #e2e8f0;padding-top:16px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">Jignasa Parghi</p>
          <p style="margin:2px 0 0;font-size:13px;color:#475569;">Kriana Tutoring | Young Engineers Kanata</p>
          <p style="margin:8px 0 0;font-size:13px;color:#475569;">
            <a href="tel:+16134006921" style="color:#0c6162;text-decoration:none;">613-400-6921</a>
            &nbsp;·&nbsp;
            <a href="mailto:info@krianatutoring.com" style="color:#0c6162;text-decoration:none;">info@krianatutoring.com</a>
            &nbsp;·&nbsp;
            <a href="https://krianatutoring.com" style="color:#0c6162;text-decoration:none;">krianatutoring.com</a>
          </p>
          <a href="https://krianatutoring.com" target="_blank" style="display:inline-block;text-decoration:none;">
            <img
              src="${SIGNATURE_IMAGE_URL}"
              width="${SIGNATURE_IMAGE_WIDTH}"
              height="${SIGNATURE_IMAGE_HEIGHT}"
              alt="Kriana Tutoring | Young Engineers Kanata"
              style="display:block;width:${SIGNATURE_IMAGE_WIDTH}px;height:${SIGNATURE_IMAGE_HEIGHT}px;border:0;margin-top:12px;"
            >
          </a>
        </td>
      </tr>
    </table>`
}
