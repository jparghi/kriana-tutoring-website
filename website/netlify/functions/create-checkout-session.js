import Stripe from 'stripe'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { registrationId, programId, sessionId, programTitle, sessionTitle, amountCents } = body
  if (!registrationId || !sessionId || !amountCents) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing registrationId, sessionId, or amountCents' }) }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not set' }) }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: programTitle ?? 'Kriana Tutoring Program',
              description: sessionTitle ?? undefined,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://krianatutoring.com/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://krianatutoring.com/booking/cancel`,
      metadata: { registrationId, programId: programId ?? '', sessionId },
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: checkoutSession.url }),
    }
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
