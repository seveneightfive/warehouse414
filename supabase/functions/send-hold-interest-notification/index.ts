import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  productTitle: string;
  productSku: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { productTitle, productSku, customerName, customerEmail, customerPhone }: NotificationRequest = await req.json();

    const emailBody = `
New Interest in On-Hold Item

Product: ${productTitle}
SKU: ${productSku}

Customer Information:
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

The customer has expressed interest in this item that is currently on hold. Please follow up with them if the item becomes available.
    `.trim();

    console.log('Hold interest notification:', emailBody);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Warehouse414 <notifications@warehouse414.com>',
            to: ['chris@warehouse414.com'],
            subject: `Interest in On-Hold Item: ${productTitle}`,
            text: emailBody,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Resend API error:', errorText);
          throw new Error('Failed to send email via Resend');
        }

        const emailData = await emailResponse.json();
        console.log('Email sent successfully via Resend:', emailData);
      } catch (emailError) {
        console.error('Error sending email via Resend:', emailError);
        throw emailError;
      }
    } else {
      console.warn('RESEND_API_KEY not configured. Email would have been sent to chris@warehouse414.com');
      console.log('Email content:', emailBody);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        emailSent: !!resendApiKey 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing hold interest notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});