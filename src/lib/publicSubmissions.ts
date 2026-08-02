import { supabase } from "@/integrations/supabase/client";

type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
};

type DealerLeadSubmission = Omit<ContactSubmission, "subject"> & {
  dealerId: string;
  listingId?: string;
};

async function invoke(functionName: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const subscribeNewsletter = (email: string) =>
  invoke("newsletter-subscribe", { email: email.trim().toLowerCase() });

export const submitContact = (submission: ContactSubmission) =>
  invoke("contact-submit", submission);

export const submitDealerLead = ({ dealerId, listingId, ...submission }: DealerLeadSubmission) =>
  invoke("contact-submit", {
    ...submission,
    subject: "Händleranfrage",
    dealer_id: dealerId,
    listing_id: listingId,
  });
