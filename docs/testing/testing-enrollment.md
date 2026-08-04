Here is the quickest complete test.

### 1. Log into the staff portal

Open [http://localhost:8889/login](http://localhost:8889/login).

- Email: `admin@local.test`
- Password: `LocalTest123!`

### 2. Create a test program

Open [Manage Programs](http://localhost:8889/tutor/booking/programs), then click **+ New Program**.

Use:

- Title: `Bricks Challenge`
- Category: `Robotics`
- Description: `Local enrollment-flow test`
- Partner: `Young Engineers`
- Age range: `6–12`
- Price: `250`
- Active: checked
- Deposit only: unchecked

Click **Save Program**.

You should see a blue **Request only** badge and a message that card-payment controls are parked.

### 3. Create a class offering

On the Bricks Challenge card, click **Class Schedules**, then **+ New Offering**.

Suggested values:

- Name: `Fall 2026 Monday Program`
- Location: `Kriana Tutoring`
- First class: `2026-08-03`
- Last class: `2026-09-28`
- Weekday: `Monday`
- Time: `5:00 PM–6:15 PM`
- Classes: `8`
- Capacity: `1`
- Tuition: `250`
- Status: `Open`
- Published: checked
- Waitlist enabled: checked
- Enrollment opens: `2026-07-01 12:00 AM`
- Enrollment closes: `2026-09-28 11:00 PM`

Click **Save Offering**.

### 4. Submit a parent request

Open [the robotics page](http://localhost:8890/robotics).

Find **Bricks Challenge** and click **Request a Spot**. If the schedule does not appear immediately, refresh after approximately one minute because the public catalogue has a short cache.

Complete the form with test information and click **Submit Registration Request**.

Expected result:

- You see **Request Received**.
- No Stripe, credit-card, or e-transfer screen appears.
- The message explains that the seat still requires staff review.

### 5. Review the request as staff

Return to [Registrations](http://localhost:8889/tutor/booking/registrations).

The request should show:

- Registration: `Pending Review`
- Payment: `Not Requested`

Click **Offer Seat** and confirm.

Expected:

- Registration becomes `Offered`.
- Offering `heldCount` becomes `1`.
- The seat is held for 72 hours.
- Payment remains `Not Requested`.

Now click **Confirm Placement**.

Expected:

- Registration becomes `Confirmed`.
- `heldCount` returns to `0`.
- `confirmedCount` becomes `1`.
- The one-seat offering becomes `Full`.
- Payment still remains `Not Requested`.

### 6. Test the waitlist

Refresh the public Bricks Challenge page after the catalogue cache clears. Because capacity is one, the action should now say **Join Waitlist**.

Submit another child using a different email. Then open [Waitlist](http://localhost:8889/tutor/booking/waitlist).

Test:

1. Cancel the first confirmed registration to release its seat.
2. Click **Offer Seat** for the first waiting family.
3. Confirm that `heldCount` becomes `1`.
4. Click **Confirm Placement**.
5. Confirm the waitlist entry becomes `Converted` and the offering returns to full.

### 7. Confirm payment is disabled

Open these old payment URLs:

- [Card-payment route](http://localhost:8890/booking/pay/test)
- [E-transfer route](http://localhost:8890/booking/etransfer/test)
- [My bookings](http://localhost:8890/my-bookings)

They should show disabled/unavailable messaging and must not provide a payment or email-only lookup flow.

You can inspect every generated document and counter in the [Firebase Emulator UI](http://localhost:4000/firestore). Production remains untouched.