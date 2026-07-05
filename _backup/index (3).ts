import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, studentName, eventName, certificateData } = await req.json();

    if (!email || !studentName || !eventName || !certificateData) {
      throw new Error('Missing required fields');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .certificate-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #6366f1; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Certificate of Participation</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              
              <p>Congratulations! Your certificate for participating in <strong>${eventName}</strong> is ready.</p>
              
              <div class="certificate-details">
                <h3 style="color: #667eea; margin-top: 0;">Certificate Details:</h3>
                <div class="detail-row">
                  <span class="label">Student Name:</span>
                  <span>${certificateData.studentName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Roll Number:</span>
                  <span>${certificateData.rollNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Department:</span>
                  <span>${certificateData.department}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Year:</span>
                  <span>${certificateData.year}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Section:</span>
                  <span>${certificateData.section}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Event:</span>
                  <span>${certificateData.eventName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Club:</span>
                  <span>${certificateData.clubName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Event Date:</span>
                  <span>${certificateData.eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Credit Points:</span>
                  <span><strong>${certificateData.creditPoints}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Certificate ID:</span>
                  <span>${certificateData.certificateId}</span>
                </div>
                <div class="detail-row" style="border-bottom: none;">
                  <span class="label">Issued Date:</span>
                  <span>${certificateData.issuedDate}</span>
                </div>
              </div>
              
              <p><strong>Note:</strong> You can also download your certificate from your student dashboard.</p>
              
              <p>Keep up the great work and continue participating in more events!</p>
              
              <p>Best regards,<br>
              <strong>Event Management Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Events Team <onboarding@resend.dev>",
      to: [email],
      subject: `Certificate for ${eventName}`,
      html: emailHtml,
    });

    console.log("Certificate email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Certificate email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error in send-certificate-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
