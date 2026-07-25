# Quickstart: Donation Booking & Location

## Prerequisites

- Backend Core is running.
- MongoDB is connected.
- Authentication module is enabled.
- Booking module is registered.
- Campaign data exists.

---

# Booking Flow

## Step 1

Login as Donor.

Expected Result:

JWT Token received.

---

## Step 2

Browse donation campaigns.

Request

GET /campaigns

Expected Result

Nearby campaigns returned.

---

## Step 3

## Step 3

Book appointment.

Request

POST /appointments

Expected Result

Appointment created.

Campaign capacity updated.

Latest Screening Form template retrieved.

Donor information pre-populated.

Screening responses validated.

Eligibility determined.

Completed Screening Form persisted.

Signed E-ticket generated.

QR Code generated.

---

## Step 4

View appointment.

Request

GET /appointments/{id}

Expected Result

Appointment information returned.

---

## Step 5

Download E-ticket.

Request

GET /appointments/{id}/ticket

Expected Result

PDF downloaded.

---

## Step 6

Cancel appointment.

Request

DELETE /appointments/{id}

Expected Result

Appointment cancelled.

Campaign capacity restored.

---

# Validation Checklist

✓ Authentication required

✓ Campaign active

✓ Capacity available

✓ 84-day rule

✓ Duplicate appointment

✓ Cancellation deadline

---

# Expected Outcome

The donor completes the booking workflow successfully.

Database should contain

- Appointment
- Screening Form
- E-ticket

Campaign capacity is updated.