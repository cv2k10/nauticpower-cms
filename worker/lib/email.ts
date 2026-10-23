import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { Enquiry } from "../../src/cms/content";
import { enquiryEmailSubject, enquiryEmailText } from "../../src/cms/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails a new enquiry to the business inbox via the send_email binding. */
export const sendEnquiryEmail = async (env: Env, enquiry: Enquiry): Promise<void> => {
  const from = env.ENQUIRY_EMAIL_FROM;
  const to = env.ENQUIRY_EMAIL_TO;
  if (!from || !to) return;

  const msg = createMimeMessage();
  msg.setSender({ name: "Nautic Power website", addr: from });
  msg.setRecipient(to);
  msg.setSubject(`${enquiry.priority === "urgent" ? "[URGENT] " : ""}${enquiryEmailSubject(enquiry)}`);
  if (EMAIL_RE.test(enquiry.contact)) msg.setHeader("Reply-To", enquiry.contact);
  msg.addMessage({
    contentType: "text/plain",
    encoding: "8bit", // body contains UTF-8 (em dashes, customer text)
    data: `${enquiryEmailText(enquiry)}\n\n—\nManage this enquiry in the admin enquiries desk.`,
  });

  await env.EMAIL.send(new EmailMessage(from, to, msg.asRaw()));
};
