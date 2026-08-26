# LifeLine — Test Case
> **Document**: Test Case  
> **Course**: CSC13002 - Introduction to Software Engineering
> **Team**: Sanguine (Team 05)  
> **Version**: 1.0 | **Date**: 11/08/2026  

*Author: Trịnh Khánh Linh | Reviewer: Trần Anh Kiệt | Editor: Trịnh Khánh Linh*

## Table of Contents

<!-- TOC_START -->
- [Revision History](#revision-history)
- [1. Overview](#1-overview)
- [2. Test Case Index](#2-test-case-index)
- [3. Detailed Test Cases](#3-detailed-test-cases)
  - [3.1. Feature 1: User Account Management](#31-feature-1-user-account-management)
    - [Testcase 1: Verify account activation via email link](#testcase-1-verify-account-activation-via-email-link)
    - [Testcase 2: Reject user registration with an already registered Citizen ID](#testcase-2-reject-user-registration-with-an-already-registered-citizen-id)
    - [Testcase 3: Reject user registration with a duplicate email address](#testcase-3-reject-user-registration-with-a-duplicate-email-address)
    - [Testcase 4: Reject user registration with invalid password format](#testcase-4-reject-user-registration-with-invalid-password-format)
    - [Testcase 5: Successful login with valid credentials](#testcase-5-successful-login-with-valid-credentials)
    - [Testcase 6: Reject login with incorrect password](#testcase-6-reject-login-with-incorrect-password)
    - [Testcase 7: Reject login with unregistered email address](#testcase-7-reject-login-with-unregistered-email-address)
    - [Testcase 8: Successful logout from the application](#testcase-8-successful-logout-from-the-application)
    - [Testcase 9: Successfully reset password with valid OTP and matching new passwords](#testcase-9-successfully-reset-password-with-valid-otp-and-matching-new-passwords)
    - [Testcase 10: Reject password reset with invalid OTP](#testcase-10-reject-password-reset-with-invalid-otp)
    - [Testcase 11: Successfully update user profile phone number or address](#testcase-11-successfully-update-user-profile-phone-number-or-address)
    - [Testcase 12: Verify read-only fields cannot be modified during profile update](#testcase-12-verify-read-only-fields-cannot-be-modified-during-profile-update)
  - [3.2. Feature 2: Booking & Location Services](#32-feature-2-booking-location-services)
    - [Testcase 1: Successfully locate nearest donation points via GPS](#testcase-1-successfully-locate-nearest-donation-points-via-gps)
    - [Testcase 2: Successfully perform manual location search when GPS is denied](#testcase-2-successfully-perform-manual-location-search-when-gps-is-denied)
    - [Testcase 3: Successfully filter locations by radius, date, and blood type](#testcase-3-successfully-filter-locations-by-radius-date-and-blood-type)
    - [Testcase 4: Reject appointment booking for unauthenticated user](#testcase-4-reject-appointment-booking-for-unauthenticated-user)
    - [Testcase 5: Successful appointment booking for eligible donor](#testcase-5-successful-appointment-booking-for-eligible-donor)
    - [Testcase 6: Reject appointment booking when last donation was less than 84 days ago](#testcase-6-reject-appointment-booking-when-last-donation-was-less-than-84-days-ago)
    - [Testcase 7: Reject appointment booking when a duplicate active appointment exists](#testcase-7-reject-appointment-booking-when-a-duplicate-active-appointment-exists)
    - [Testcase 8: Reject appointment booking for a fully booked campaign timeslot](#testcase-8-reject-appointment-booking-for-a-fully-booked-campaign-timeslot)
    - [Testcase 9: Successfully cancel an appointment more than 24 hours in advance](#testcase-9-successfully-cancel-an-appointment-more-than-24-hours-in-advance)
    - [Testcase 10: Successfully download E-Ticket as PDF for a confirmed appointment](#testcase-10-successfully-download-e-ticket-as-pdf-for-a-confirmed-appointment)
    - [Testcase 11: Display empty state when no campaigns match the applied filter](#testcase-11-display-empty-state-when-no-campaigns-match-the-applied-filter)
    - [Testcase 12: Reject appointment booking if user account is unverified](#testcase-12-reject-appointment-booking-if-user-account-is-unverified)
    - [Testcase 13: Successfully view details of an upcoming appointment](#testcase-13-successfully-view-details-of-an-upcoming-appointment)
    - [Testcase 14: Successfully view details of a completed appointment](#testcase-14-successfully-view-details-of-a-completed-appointment)
    - [Testcase 15: Reject appointment cancellation less than 24 hours before scheduled time](#testcase-15-reject-appointment-cancellation-less-than-24-hours-before-scheduled-time)
    - [Testcase 16: Verify E-Ticket QR code contains correct appointment data](#testcase-16-verify-e-ticket-qr-code-contains-correct-appointment-data)
  - [3.3. Feature 3: Campaign Management](#33-feature-3-campaign-management)
    - [Testcase 1: Successful campaign creation with valid details](#testcase-1-successful-campaign-creation-with-valid-details)
    - [Testcase 2: Reject campaign creation with an invalid date range](#testcase-2-reject-campaign-creation-with-an-invalid-date-range)
    - [Testcase 3: Reject campaign creation with zero or negative capacity](#testcase-3-reject-campaign-creation-with-zero-or-negative-capacity)
    - [Testcase 4: Successfully filter campaign list by active status](#testcase-4-successfully-filter-campaign-list-by-active-status)
    - [Testcase 5: Successfully update campaign capacity](#testcase-5-successfully-update-campaign-capacity)
    - [Testcase 6: Successfully view registered donors for a specific campaign](#testcase-6-successfully-view-registered-donors-for-a-specific-campaign)
    - [Testcase 7: Successfully update donor registration status to Checked-in](#testcase-7-successfully-update-donor-registration-status-to-checked-in)
    - [Testcase 8: Successfully search registered donor by Citizen ID](#testcase-8-successfully-search-registered-donor-by-citizen-id)
    - [Testcase 9: Successfully check-in donor by scanning a valid E-Ticket QR code](#testcase-9-successfully-check-in-donor-by-scanning-a-valid-e-ticket-qr-code)
    - [Testcase 10: Reject donor check-in with an expired or invalid E-Ticket QR code](#testcase-10-reject-donor-check-in-with-an-expired-or-invalid-e-ticket-qr-code)
    - [Testcase 11: Reject campaign creation when required fields are missing](#testcase-11-reject-campaign-creation-when-required-fields-are-missing)
    - [Testcase 12: Successfully use pagination to view multiple pages of campaigns](#testcase-12-successfully-use-pagination-to-view-multiple-pages-of-campaigns)
    - [Testcase 13: Reject editing a campaign that has already ended](#testcase-13-reject-editing-a-campaign-that-has-already-ended)
    - [Testcase 14: Successfully reject a donor registration](#testcase-14-successfully-reject-a-donor-registration)
    - [Testcase 15: Display empty state when searching for non-existent Citizen ID](#testcase-15-display-empty-state-when-searching-for-non-existent-citizen-id)
    - [Testcase 16: Successfully update donor registration status to Eligible after passing Clinical Vitals Exam at the Campaign](#testcase-16-successfully-update-donor-registration-status-to-eligible-after-passing-clinical-vitals-exam-at-the-campaign)
    - [Testcase 17: Successfully update donor registration status to Ineligible after failing Clinical Vitals Exam at the Campaign](#testcase-17-successfully-update-donor-registration-status-to-ineligible-after-failing-clinical-vitals-exam-at-the-campaign)
    - [Testcase 18: Successfully update donor registration status to Pass after passing the blood test after the campaign](#testcase-18-successfully-update-donor-registration-status-to-pass-after-passing-the-blood-test-after-the-campaign)
    - [Testcase 19: Successfully update donor registration status to Fail after failing the blood test after the campaign](#testcase-19-successfully-update-donor-registration-status-to-fail-after-failing-the-blood-test-after-the-campaign)
  - [3.4. Feature 4: SOS Request Management](#34-feature-4-sos-request-management)
    - [Testcase 1: Successful SOS request creation with valid details](#testcase-1-successful-sos-request-creation-with-valid-details)
    - [Testcase 2: Reject SOS request creation with missing required blood type](#testcase-2-reject-sos-request-creation-with-missing-required-blood-type)
    - [Testcase 3: Successfully view the active SOS request dashboard](#testcase-3-successfully-view-the-active-sos-request-dashboard)
    - [Testcase 4: Successfully mark an active SOS request as resolved](#testcase-4-successfully-mark-an-active-sos-request-as-resolved)
    - [Testcase 5: Verify resolved SOS request cannot be marked as resolved again](#testcase-5-verify-resolved-sos-request-cannot-be-marked-as-resolved-again)
    - [Testcase 6: Successfully cancel an active SOS request](#testcase-6-successfully-cancel-an-active-sos-request)
    - [Testcase 7: Display empty state when generating SOS report for a date range with no data](#testcase-7-display-empty-state-when-generating-sos-report-for-a-date-range-with-no-data)
    - [Testcase 8: Reject SOS request creation attempt for a different hospital location](#testcase-8-reject-sos-request-creation-attempt-for-a-different-hospital-location)
    - [Testcase 9: Verify notification is sent to eligible donors when a new SOS request is created](#testcase-9-verify-notification-is-sent-to-eligible-donors-when-a-new-sos-request-is-created)
    - [Testcase 10: Reject SOS request creation if required units is zero or negative](#testcase-10-reject-sos-request-creation-if-required-units-is-zero-or-negative)
    - [Testcase 11: Successfully filter SOS requests on the dashboard by blood type](#testcase-11-successfully-filter-sos-requests-on-the-dashboard-by-blood-type)
    - [Testcase 12: Successfully sort the active SOS request dashboard by urgency](#testcase-12-successfully-sort-the-active-sos-request-dashboard-by-urgency)
    - [Testcase 13: Verify SOS request automatically expires if not resolved within timeframe](#testcase-13-verify-sos-request-automatically-expires-if-not-resolved-within-timeframe)
  - [3.5. Feature 5: AI Conversational Support](#35-feature-5-ai-conversational-support)
    - [Testcase 1: Successfully open chatbot and receive default welcome message](#testcase-1-successfully-open-chatbot-and-receive-default-welcome-message)
    - [Testcase 2: Successfully receive correct eligibility response from chatbot](#testcase-2-successfully-receive-correct-eligibility-response-from-chatbot)
    - [Testcase 3: Successfully receive location guidance from chatbot](#testcase-3-successfully-receive-location-guidance-from-chatbot)
    - [Testcase 4: Verify graceful fallback behavior for irrelevant prompts](#testcase-4-verify-graceful-fallback-behavior-for-irrelevant-prompts)
    - [Testcase 5: Successfully maintain conversational context across multiple turns](#testcase-5-successfully-maintain-conversational-context-across-multiple-turns)
    - [Testcase 6: Verify chatbot prevents or ignores empty message submission](#testcase-6-verify-chatbot-prevents-or-ignores-empty-message-submission)
    - [Testcase 7: Verify chat history persistence when closing and reopening the chat window](#testcase-7-verify-chat-history-persistence-when-closing-and-reopening-the-chat-window)
    - [Testcase 8: Verify graceful error handling when AI backend times out](#testcase-8-verify-graceful-error-handling-when-ai-backend-times-out)
    - [Testcase 9: Successfully route user to booking page when action requested](#testcase-9-successfully-route-user-to-booking-page-when-action-requested)
    - [Testcase 10: Verify responsive layout of chatbot UI on mobile viewport](#testcase-10-verify-responsive-layout-of-chatbot-ui-on-mobile-viewport)
    - [Testcase 11: Verify chatbot sanitizes malicious input safely](#testcase-11-verify-chatbot-sanitizes-malicious-input-safely)
    - [Testcase 12: Verify chatbot displays a typing indicator while fetching a response](#testcase-12-verify-chatbot-displays-a-typing-indicator-while-fetching-a-response)
    - [Testcase 13: Handle extremely long messages without crashing](#testcase-13-handle-extremely-long-messages-without-crashing)
<!-- TOC_END -->

## Revision History

| Date       | Version | Description                                | Author           |
| :--------- | :------ | :----------------------------------------- | :--------------- |
| 11/08/2026 | 1.0     | Initial draft of Master Test Cases document | Trịnh Khánh Linh |


## 1. Overview

This document serves as the master index and consolidated view for all manual functional test cases across the five selected LifeLine features.
These test cases are designed specifically for manual execution.
Where applicable, existing Spec Kit-generated test cases were reviewed, refined for manual execution, and preserved, while additional test cases were authored to ensure comprehensive coverage.


## 2. Test Case Index

| Test Case ID | Feature | Related Use Case | Test Case Name | Type | Source |
|---|---|---|---|---|---|
| TC-F1-002 | User Account Management | LL-UC-01 – Register via Citizen ID | Verify account activation via email link | Positive | New |
| TC-F1-003 | User Account Management | LL-UC-01 – Register via Citizen ID | Reject user registration with an already registered Citizen ID | Negative | New |
| TC-F1-004 | User Account Management | LL-UC-01 – Register via Citizen ID | Reject user registration with a duplicate email address | Negative | New |
| TC-F1-006 | User Account Management | LL-UC-01 – Register via Citizen ID | Reject user registration with invalid password format | Validation | New |
| TC-F1-007 | User Account Management | LL-UC-02 – Login | Successful login with valid credentials | Positive | New |
| TC-F1-008 | User Account Management | LL-UC-02 – Login | Reject login with incorrect password | Negative | New |
| TC-F1-009 | User Account Management | LL-UC-02 – Login | Reject login with unregistered email address | Negative | New |
| TC-F1-011 | User Account Management | LL-UC-03 – Logout | Successful logout from the application | Positive | New |
| TC-F1-013 | User Account Management | LL-UC-04 – Reset Password | Successfully reset password with valid OTP and matching new passwords | Positive | New |
| TC-F1-014 | User Account Management | LL-UC-04 – Reset Password | Reject password reset with invalid OTP | Negative | New |
| TC-F1-015 | User Account Management | LL-UC-05 – Manage Profile | Successfully update user profile phone number or address | Positive | New |
| TC-F1-016 | User Account Management | LL-UC-05 – Manage Profile | Verify read-only fields cannot be modified during profile update | Security | New |
| TC-F2-001 | Booking & Location Services | LL-UC-06 – Browse Interactive Map | Successfully locate nearest donation points via GPS | Positive | Spec Kit - Reused |
| TC-F2-002 | Booking & Location Services | LL-UC-06 – Browse Interactive Map | Successfully perform manual location search when GPS is denied | Positive | Spec Kit - Reused |
| TC-F2-003 | Booking & Location Services | LL-UC-06 – Browse Interactive Map | Successfully filter locations by radius, date, and blood type | Positive | Spec Kit - Reused |
| TC-F2-004 | Booking & Location Services | LL-UC-07 – Book Appointment | Reject appointment booking for unauthenticated user | Role/Permission | Spec Kit - Reused |
| TC-F2-005 | Booking & Location Services | LL-UC-07 – Book Appointment | Successful appointment booking for eligible donor | Positive | Spec Kit - Refined |
| TC-F2-006 | Booking & Location Services | LL-UC-07 – Book Appointment | Reject appointment booking when last donation was less than 84 days ago | Business Rule | Spec Kit - Reused |
| TC-F2-007 | Booking & Location Services | LL-UC-07 – Book Appointment | Reject appointment booking when a duplicate active appointment exists | Business Rule | Spec Kit - Reused |
| TC-F2-008 | Booking & Location Services | LL-UC-07 – Book Appointment | Reject appointment booking for a fully booked campaign timeslot | Validation | Spec Kit - Reused |
| TC-F2-009 | Booking & Location Services | LL-UC-09 – Cancel Appointment | Successfully cancel an appointment more than 24 hours in advance | Positive | Spec Kit - Reused |
| TC-F2-010 | Booking & Location Services | LL-UC-10 – Download E-Ticket | Successfully download E-Ticket as PDF for a confirmed appointment | Positive | Spec Kit - Reused |
| TC-F2-011 | Booking & Location Services | LL-UC-06 – Browse Interactive Map | Display empty state when no campaigns match the applied filter | Negative | Spec Kit - Refined |
| TC-F2-012 | Booking & Location Services | LL-UC-07 – Schedule Appointment | Reject appointment booking if user account is unverified | Business Rule | New |
| TC-F2-013 | Booking & Location Services | LL-UC-08 – View Appointment Details | Successfully view details of an upcoming appointment | Positive | Spec Kit - Reused |
| TC-F2-014 | Booking & Location Services | LL-UC-08 – View Appointment Details | Successfully view details of a completed appointment | Positive | Spec Kit - Refined |
| TC-F2-015 | Booking & Location Services | LL-UC-09 – Cancel Appointment | Reject appointment cancellation less than 24 hours before scheduled time | Business Rule | Spec Kit - Reused |
| TC-F2-016 | Booking & Location Services | LL-UC-10 – Download E-Ticket | Verify E-Ticket QR code contains correct appointment data | Validation | Spec Kit - Refined |
| TC-F3-001 | Campaign Management | BC-UC-01 – Create Donation Campaign | Successful campaign creation with valid details | Positive | New |
| TC-F3-002 | Campaign Management | BC-UC-01 – Create Donation Campaign | Reject campaign creation with an invalid date range | Negative | New |
| TC-F3-003 | Campaign Management | BC-UC-01 – Create Donation Campaign | Reject campaign creation with zero or negative capacity | Validation | New |
| TC-F3-004 | Campaign Management | BC-UC-02 – View Donation Campaign List | Successfully filter campaign list by active status | Positive | New |
| TC-F3-005 | Campaign Management | BC-UC-03 – View/Edit Donation Campaign Details | Successfully update campaign capacity | Positive | New |
| TC-F3-006 | Campaign Management | BC-UC-04 – View Donor Registration List | Successfully view registered donors for a specific campaign | Positive | New |
| TC-F3-007 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully update donor registration status to Checked-in | Positive | New |
| TC-F3-008 | Campaign Management | BC-UC-06 – Search Donor Registration | Successfully search registered donor by Citizen ID | Positive | New |
| TC-F3-009 | Campaign Management | BC-UC-07 – QR Code Scan & Verification | Successfully check-in donor by scanning a valid E-Ticket QR code | Positive | New |
| TC-F3-010 | Campaign Management | BC-UC-07 – QR Code Scan & Verification | Reject donor check-in with an expired or invalid E-Ticket QR code | Negative | New |
| TC-F3-011 | Campaign Management | BC-UC-01 – Create Donation Campaign | Reject campaign creation when required fields are missing | Validation | New |
| TC-F3-012 | Campaign Management | BC-UC-02 – View Donation Campaign List | Successfully use pagination to view multiple pages of campaigns | Positive | New |
| TC-F3-013 | Campaign Management | BC-UC-03 – View/Edit Donation Campaign Details | Reject editing a campaign that has already ended | Business Rule | New |
| TC-F3-015 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully reject a donor registration | Positive | New |
| TC-F3-016 | Campaign Management | BC-UC-06 – Search Donor Registration | Display empty state when searching for non-existent Citizen ID | Negative | New |
| TC-F3-017 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully update donor registration status to Eligible after passing Clinical Vitals Exam at the Campaign | Positive | New |
| TC-F3-018 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully update donor registration status to Ineligible after failing Clinical Vitals Exam at the Campaign | Positive | New |
| TC-F3-019 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully update donor registration status to Pass after passing the blood test after the campaign | Positive | New |
| TC-F3-020 | Campaign Management | BC-UC-05 – View/Edit Donor Registration Details | Successfully update donor registration status to Fail after failing the blood test after the campaign | Positive | New |
| TC-F4-001 | SOS Request Management | HS-UC-01 – Create SOS Request | Successful SOS request creation with valid details | Positive | New |
| TC-F4-002 | SOS Request Management | HS-UC-01 – Create SOS Request | Reject SOS request creation with missing required blood type | Negative | New |
| TC-F4-004 | SOS Request Management | HS-UC-02 – Monitor SOS Request | Successfully view the active SOS request dashboard | Positive | New |
| TC-F4-005 | SOS Request Management | HS-UC-02 – Monitor SOS Request | Successfully mark an active SOS request as resolved | Positive | New |
| TC-F4-006 | SOS Request Management | HS-UC-02 – Monitor SOS Request | Verify resolved SOS request cannot be marked as resolved again | Validation | New |
| TC-F4-007 | SOS Request Management | HS-UC-02 – Monitor SOS Request | Successfully cancel an active SOS request | Positive | New |
| TC-F4-009 | SOS Request Management | HS-UC-03 – View SOS Reports | Display empty state when generating SOS report for a date range with no data | Positive | New |
| TC-F4-010 | SOS Request Management | HS-UC-01 – Create SOS Request | Reject SOS request creation attempt for a different hospital location | Role/Permission | New |
| TC-F4-011 | SOS Request Management | SOS-UC-01 – Receive SOS Emergency Alert | Verify notification is sent to eligible donors when a new SOS request is created | Positive | New |
| TC-F4-012 | SOS Request Management | SOS-UC-01 – Receive SOS Emergency Alert | Reject SOS request creation if required units is zero or negative | Validation | New |
| TC-F4-013 | SOS Request Management | SOS-UC-02 – Respond to SOS Emergency Alert | Successfully filter SOS requests on the dashboard by blood type | Positive | New |
| TC-F4-014 | SOS Request Management | SOS-UC-02 – Respond to SOS Emergency Alert | Successfully sort the active SOS request dashboard by urgency | Positive | New |
| TC-F4-016 | SOS Request Management | SOS-UC-01 – Receive SOS Emergency Alert | Verify SOS request automatically expires if not resolved within timeframe | Business Rule | New |
| TC-F5-001 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Successfully open chatbot and receive default welcome message | Positive | Spec Kit - Refined |
| TC-F5-002 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Successfully receive correct eligibility response from chatbot | AI Behavior | Spec Kit - Reused |
| TC-F5-003 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Successfully receive location guidance from chatbot | AI Behavior | Spec Kit - Reused |
| TC-F5-004 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify graceful fallback behavior for irrelevant prompts | AI Behavior | Spec Kit - Refined |
| TC-F5-005 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Successfully maintain conversational context across multiple turns | AI Behavior | Spec Kit - Reused |
| TC-F5-006 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify chatbot prevents or ignores empty message submission | Validation | New |
| TC-F5-007 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify chat history persistence when closing and reopening the chat window | Positive | Spec Kit - Refined |
| TC-F5-008 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify graceful error handling when AI backend times out | Error Handling | Spec Kit - Refined |
| TC-F5-009 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Successfully route user to booking page when action requested | AI Behavior | Spec Kit - Refined |
| TC-F5-010 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify responsive layout of chatbot UI on mobile viewport | Positive | New |
| TC-F5-012 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify chatbot sanitizes malicious input safely | Security | New |
| TC-F5-014 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Verify chatbot displays a typing indicator while fetching a response | UI/UX | Spec Kit - Refined |
| TC-F5-015 | AI Conversational Support | CB-UC-01 – Interact with AI Chatbot | Handle extremely long messages without crashing | Validation | New |

## 3. Detailed Test Cases

### 3.1. Feature 1: User Account Management

#### Testcase 1: Verify account activation via email link

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-002 |
| **Test case name** | Verify account activation via email link |
| **Description** | Verify that a newly registered user can activate their account by clicking the verification link sent to their email. |
| **Related Use case** | LL-UC-01 – Register via Citizen ID |
| **Input Data** | Role: Newly Registered User (Pending Verification). |
| **Expected Output** | The account is activated and the user is redirected to the login page with a success message. |
| **Test steps** | 1. Complete the registration process to reach the 'Pending Verification' state.<br>2. (Mock or actual) Retrieve the verification email sent by the system.<br>3. Click the verification link in the email.<br>4. Verify that the system redirects to the Login page.<br>5. Verify that a success message confirming account activation is displayed. |

#### Testcase 2: Reject user registration with an already registered Citizen ID

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-003 |
| **Test case name** | Reject user registration with an already registered Citizen ID |
| **Description** | Verify that the system prevents registration when the provided Citizen ID is already associated with an existing account. |
| **Related Use case** | LL-UC-01 – Register via Citizen ID |
| **Input Data** | Role: Unauthenticated User. Citizen ID: 079204001234 (already exists in DB); Name: Nguyen Van B; DoB: 20/10/1995; Email: nguyenvanb@example.com; Password: StrongPass123! |
| **Expected Output** | The system displays an appropriate validation message and prevents account creation. The user remains on the Registration page. |
| **Test steps** | 1. Open the LifeLine application in a web browser.<br>2. Navigate to the Login page and click on 'Register'.<br>3. Enter the existing Citizen ID.<br>4. Fill in all other required fields with valid data.<br>5. Click the 'Register' button.<br>6. Verify that a validation error message ('Citizen ID already exists' or similar) is displayed.<br>7. Verify that the user is not redirected to the Login page. |

#### Testcase 3: Reject user registration with a duplicate email address

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-004 |
| **Test case name** | Reject user registration with a duplicate email address |
| **Description** | Verify that the system prevents registration when the provided email address is already in use by another account. |
| **Related Use case** | LL-UC-01 – Register via Citizen ID |
| **Input Data** | Role: Unauthenticated User. Citizen ID: 079204001111; Email: nguyenvana@example.com (already exists in DB). |
| **Expected Output** | The system displays a duplicate email validation error and prevents account creation. |
| **Test steps** | 1. Open the LifeLine application.<br>2. Navigate to the Login page and click 'Register'.<br>3. Enter a valid new Citizen ID and Name.<br>4. Enter an email address that is already registered.<br>5. Click the 'Register' button.<br>6. Verify that an error message indicating the email is already in use is displayed next to the email field.<br>7. Verify that the account is not created. |

#### Testcase 4: Reject user registration with invalid password format

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-006 |
| **Test case name** | Reject user registration with invalid password format |
| **Description** | Verify that the system enforces password strength policies during registration. |
| **Related Use case** | LL-UC-01 – Register via Citizen ID |
| **Input Data** | Role: Unauthenticated User. Password: '123' (Too short, no special characters). |
| **Expected Output** | The system displays a password strength validation error and prevents account creation. |
| **Test steps** | 1. Navigate to the Registration page.<br>2. Fill in all fields with valid data except the password.<br>3. Enter a weak password (e.g., '123').<br>4. Click the 'Register' button.<br>5. Verify that a validation error message describing the password requirements is displayed.<br>6. Verify that the account is not created. |

#### Testcase 5: Successful login with valid credentials

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-007 |
| **Test case name** | Successful login with valid credentials |
| **Description** | Verify that a registered user can log in successfully using correct credentials. |
| **Related Use case** | LL-UC-02 – Login |
| **Input Data** | Role: Unauthenticated User. Email: nguyenvana@example.com (registered); Password: StrongPass123! (correct). |
| **Expected Output** | The user is authenticated successfully, a session is established, and the user is redirected to their Dashboard. |
| **Test steps** | 1. Navigate to the Login page.<br>2. Enter the registered email address.<br>3. Enter the correct password.<br>4. Click the 'Login' button.<br>5. Verify that the user is redirected to the Dashboard or Home page.<br>6. Verify that the user's profile avatar or name is visible in the navigation bar. |

#### Testcase 6: Reject login with incorrect password

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-008 |
| **Test case name** | Reject login with incorrect password |
| **Description** | Verify that the system denies access when a valid email is provided with an incorrect password. |
| **Related Use case** | LL-UC-02 – Login |
| **Input Data** | Role: Unauthenticated User. Email: nguyenvana@example.com; Password: WrongPassword123! |
| **Expected Output** | The system denies access, displays an 'Invalid credentials' error message, and the user remains on the Login page. |
| **Test steps** | 1. Navigate to the Login page.<br>2. Enter the registered email address.<br>3. Enter an incorrect password.<br>4. Click the 'Login' button.<br>5. Verify that an error message indicating invalid credentials is displayed.<br>6. Verify that the user is not redirected to the Dashboard. |

#### Testcase 7: Reject login with unregistered email address

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-009 |
| **Test case name** | Reject login with unregistered email address |
| **Description** | Verify that the system denies access when attempting to log in with an email not present in the system. |
| **Related Use case** | LL-UC-02 – Login |
| **Input Data** | Role: Unauthenticated User. Email: unregistered@example.com; Password: AnyPassword123! |
| **Expected Output** | The system denies access and displays an appropriate 'Account not found' or 'Invalid credentials' message. |
| **Test steps** | 1. Navigate to the Login page.<br>2. Enter an unregistered email address.<br>3. Enter any password.<br>4. Click the 'Login' button.<br>5. Verify that an error message is displayed.<br>6. Verify that the user remains unauthenticated. |

#### Testcase 8: Successful logout from the application

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-011 |
| **Test case name** | Successful logout from the application |
| **Description** | Verify that an authenticated user can successfully log out and their session is terminated. |
| **Related Use case** | LL-UC-03 – Logout |
| **Input Data** | Role: Authenticated Donor. |
| **Expected Output** | The user is logged out, the session is cleared, and the user is redirected to the Login or Home page. |
| **Test steps** | 1. Log in to the application.<br>2. Click on the User Profile icon in the navigation bar.<br>3. Select the 'Logout' option from the dropdown menu.<br>4. Verify that the application redirects to the Login or Home page.<br>5. Attempt to navigate back to a protected route (e.g., Dashboard) via the browser URL.<br>6. Verify that access is denied and the user is redirected back to the Login page. |

#### Testcase 9: Successfully reset password with valid OTP and matching new passwords

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-013 |
| **Test case name** | Successfully reset password with valid OTP and matching new passwords |
| **Description** | Verify that a user can complete the password reset process by providing a valid OTP and a matching pair of strong new passwords. |
| **Related Use case** | LL-UC-04 – Reset Password |
| **Input Data** | Role: Unauthenticated User in reset flow. Valid OTP. New Password: 'NewStrongPass1!'. |
| **Expected Output** | The password is updated successfully and the user is redirected to the login page. |
| **Test steps** | 1. Navigate to the Forgot Password page and request an OTP.<br>2. Enter the valid OTP received via email.<br>3. On the new password creation form, enter a strong new password.<br>4. Enter the exact same password in the confirmation field.<br>5. Click 'Confirm'.<br>6. Verify that a success message is displayed.<br>7. Verify that the user is redirected to the Login page and can log in with the new password. |

#### Testcase 10: Reject password reset with invalid OTP

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-014 |
| **Test case name** | Reject password reset with invalid OTP |
| **Description** | Verify that the system rejects password reset attempts when the provided OTP is incorrect. |
| **Related Use case** | LL-UC-04 – Reset Password |
| **Input Data** | Role: Unauthenticated User in reset flow. Incorrect OTP: '000000'. |
| **Expected Output** | The system displays an error message indicating the OTP is invalid and does not proceed to the new password form. |
| **Test steps** | 1. Navigate to the Forgot Password page and request an OTP.<br>2. On the OTP verification screen, enter an incorrect OTP (e.g., '000000').<br>3. Submit the OTP.<br>4. Verify that an error message indicating invalid OTP is displayed.<br>5. Verify that the user is not allowed to proceed to the password reset form. |

#### Testcase 11: Successfully update user profile phone number or address

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-015 |
| **Test case name** | Successfully update user profile phone number or address |
| **Description** | Verify that an authenticated user can update their profile information with valid data. |
| **Related Use case** | LL-UC-05 – Manage Profile |
| **Input Data** | Role: Authenticated Donor. Phone number: 0901234567. |
| **Expected Output** | The profile is updated successfully. A success notification is displayed, and the new phone number is reflected on the profile page. |
| **Test steps** | 1. Log in to the application.<br>2. Navigate to the User Profile page.<br>3. Click on the 'Edit Profile' button.<br>4. Locate the Phone Number field and enter the new valid phone number.<br>5. Click the 'Save Changes' button.<br>6. Verify that a success notification is displayed.<br>7. Verify that the Profile page now displays the updated phone number. |

#### Testcase 12: Verify read-only fields cannot be modified during profile update

<!-- METADATA: Type="Security" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F1-016 |
| **Test case name** | Verify read-only fields cannot be modified during profile update |
| **Description** | Verify that identity-verified fields (e.g., Name, Date of Birth, ID Number) are locked and cannot be edited by the user. |
| **Related Use case** | LL-UC-05 – Manage Profile |
| **Input Data** | Role: Authenticated Donor. Action: Attempt to edit Name/DoB/ID. |
| **Expected Output** | The identity fields are disabled in the UI and cannot be altered. |
| **Test steps** | 1. Log in to the application and navigate to the User Profile page.<br>2. Click 'Edit Profile'.<br>3. Verify that the fields for Full Name, Date of Birth, and ID Number are visually marked as read-only or disabled.<br>4. Attempt to modify the values in these fields.<br>5. Verify that the system does not allow typing or changing these values. |

### 3.2. Feature 2: Booking & Location Services

#### Testcase 1: Successfully locate nearest donation points via GPS

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-001 |
| **Test case name** | Successfully locate nearest donation points via GPS |
| **Description** | Verify that the map automatically centers on the user's location and displays nearby campaigns when GPS permission is granted. |
| **Related Use case** | LL-UC-06 – Browse Interactive Map |
| **Input Data** | Role: Any user. Browser GPS permission: Granted. Active campaigns exist within 15km. |
| **Expected Output** | The map centers on the user's current coordinates. A success toast is displayed, and pins for nearby donation campaigns are visible on the map. |
| **Test steps** | 1. Navigate to the Interactive Map page.<br>2. When prompted by the browser, click 'Allow' for location access.<br>3. Toggle the 'GPS' button to ON if it is not automatic.<br>4. Verify that a success toast appears.<br>5. Verify that the map view centers on the current physical location.<br>6. Verify that donation campaign markers within a 15km radius are displayed on the map and in the list. |

#### Testcase 2: Successfully perform manual location search when GPS is denied

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-002 |
| **Test case name** | Successfully perform manual location search when GPS is denied |
| **Description** | Verify that the user can manually search for donation locations using keywords when GPS is disabled or denied. |
| **Related Use case** | LL-UC-06 – Browse Interactive Map |
| **Input Data** | Role: Any user. Browser GPS permission: Denied. Search Keyword: 'District 5'. |
| **Expected Output** | The UI indicates manual search mode. The map centers on the searched district, displaying relevant campaigns. |
| **Test steps** | 1. Navigate to the Interactive Map page.<br>2. Deny the browser location permission or toggle 'GPS' to OFF.<br>3. Locate the search input field in the header.<br>4. Enter the keyword 'District 5'.<br>5. Press Enter or click the search icon.<br>6. Verify that the map view updates to center on District 5.<br>7. Verify that the list displays campaigns located in or near District 5. |

#### Testcase 3: Successfully filter locations by radius, date, and blood type

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-003 |
| **Test case name** | Successfully filter locations by radius, date, and blood type |
| **Description** | Verify that the map and campaign list update correctly when multiple filters are applied. |
| **Related Use case** | LL-UC-06 – Browse Interactive Map |
| **Input Data** | Role: Any user. Filters - Radius: 10km; Date: 20/10/2026; Blood Type: O+. |
| **Expected Output** | The campaign list and map markers update in real-time, displaying only the campaigns that match all selected filter criteria. |
| **Test steps** | 1. Navigate to the Interactive Map page.<br>2. Open the Filter panel.<br>3. Adjust the radius slider to 10km.<br>4. Select 'O+' in the Blood Type filter.<br>5. Select '20/10/2026' in the Date filter.<br>6. Click 'Apply' (if required).<br>7. Verify that the map markers reduce to only show matching campaigns.<br>8. Verify that the list view on the side only displays the filtered campaigns. |

#### Testcase 4: Reject appointment booking for unauthenticated user

<!-- METADATA: Type="Role/Permission" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-004 |
| **Test case name** | Reject appointment booking for unauthenticated user |
| **Description** | Verify that the system requires a user to be logged in before they can initiate the booking process. |
| **Related Use case** | LL-UC-07 – Book Appointment |
| **Input Data** | Role: Unauthenticated User. Selected Campaign: Any active campaign. |
| **Expected Output** | The system redirects the user to the Login page and displays a warning message indicating that login is required. |
| **Test steps** | 1. Ensure you are logged out.<br>2. Navigate to the Interactive Map page.<br>3. Click on an active donation campaign marker.<br>4. Click the 'Book Appointment' button.<br>5. Verify that the application redirects to the Login page.<br>6. Verify that a warning toast or message is displayed requesting the user to log in. |

#### Testcase 5: Successful appointment booking for eligible donor

<!-- METADATA: Type="Positive" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-005 |
| **Test case name** | Successful appointment booking for eligible donor |
| **Description** | Verify that an authenticated and eligible donor can successfully complete the booking flow. |
| **Related Use case** | LL-UC-07 – Book Appointment |
| **Input Data** | Role: Authenticated Donor (eligible). Campaign: Active with available slots. Screening: All answers 'No'. |
| **Expected Output** | The appointment is created with 'Pending' status. The user is redirected to the My Appointments page and sees a success message. |
| **Test steps** | 1. Log in as an eligible donor.<br>2. Navigate to a campaign and click 'Book Appointment'.<br>3. Select an available date and timeslot. Click 'Continue'.<br>4. Complete the Health Screening form by answering 'No' to all risk factors. Click 'Submit'.<br>5. Review the booking summary.<br>6. Click 'Confirm Booking'.<br>7. Verify that a success screen is displayed.<br>8. Verify that the user is redirected to the 'My Appointments' page.<br>9. Verify that the new appointment appears in the list with a 'Pending' status. |

#### Testcase 6: Reject appointment booking when last donation was less than 84 days ago

<!-- METADATA: Type="Business Rule" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-006 |
| **Test case name** | Reject appointment booking when last donation was less than 84 days ago |
| **Description** | Verify that the system enforces the 84-day rest period business rule between donations. |
| **Related Use case** | LL-UC-07 – Book Appointment |
| **Input Data** | Role: Authenticated Donor (last donation was 50 days ago). Campaign: Active. |
| **Expected Output** | The system prevents booking and displays an error message specifying that the donor is ineligible due to the 84-day rule. |
| **Test steps** | 1. Log in with an account that has a completed donation 50 days ago.<br>2. Navigate to a campaign and click 'Book Appointment'.<br>3. Select a timeslot and proceed to confirmation.<br>4. Attempt to confirm the booking.<br>5. Verify that an error message is displayed (e.g., 'Not eligible... minimum 84 days required').<br>6. Verify that the appointment is not created in the My Appointments list. |

#### Testcase 7: Reject appointment booking when a duplicate active appointment exists

<!-- METADATA: Type="Business Rule" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-007 |
| **Test case name** | Reject appointment booking when a duplicate active appointment exists |
| **Description** | Verify that a donor cannot hold more than one active (Pending/Confirmed) appointment at the same time. |
| **Related Use case** | LL-UC-07 – Book Appointment |
| **Input Data** | Role: Authenticated Donor (already has 1 Pending appointment). Campaign: Active. |
| **Expected Output** | The system prevents booking and displays a duplicate appointment error message. |
| **Test steps** | 1. Log in with an account that already has an upcoming appointment.<br>2. Navigate to the map and attempt to book a new appointment at a different campaign.<br>3. Proceed through the booking steps and attempt to confirm.<br>4. Verify that an error message is displayed stating a duplicate appointment exists.<br>5. Verify that the second appointment is not created. |

#### Testcase 8: Reject appointment booking for a fully booked campaign timeslot

<!-- METADATA: Type="Validation" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-008 |
| **Test case name** | Reject appointment booking for a fully booked campaign timeslot |
| **Description** | Verify that timeslots that have reached maximum capacity are disabled and cannot be booked. |
| **Related Use case** | LL-UC-07 – Book Appointment |
| **Input Data** | Role: Authenticated Donor. Campaign Timeslot: Registered Count >= Capacity. |
| **Expected Output** | The full timeslot is visually indicated as unavailable and cannot be selected by the user. |
| **Test steps** | 1. Log in to the application.<br>2. Navigate to a campaign known to have a fully booked timeslot.<br>3. Open the timeslot selection view.<br>4. Locate the fully booked timeslot.<br>5. Verify that the timeslot is visually disabled (greyed out or marked 'Full').<br>6. Attempt to click on the timeslot.<br>7. Verify that the timeslot cannot be selected and the 'Continue' button remains disabled. |

#### Testcase 9: Successfully cancel an appointment more than 24 hours in advance

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-009 |
| **Test case name** | Successfully cancel an appointment more than 24 hours in advance |
| **Description** | Verify that a donor can cancel their appointment if it is far enough in the future. |
| **Related Use case** | LL-UC-09 – Cancel Appointment |
| **Input Data** | Role: Authenticated Donor. Appointment: Pending/Confirmed, scheduled > 24 hours from now. Reason: 'Busy'. |
| **Expected Output** | The appointment status is updated to 'Cancelled'. A success message is displayed. |
| **Test steps** | 1. Log in and navigate to 'My Appointments'.<br>2. Select an upcoming appointment that is more than 24 hours away.<br>3. Open the appointment details.<br>4. Click the 'Cancel Appointment' button.<br>5. Select a cancellation reason in the modal (e.g., 'Busy').<br>6. Click 'Confirm Cancellation'.<br>7. Verify that a success message is displayed.<br>8. Verify that the appointment status in the list changes to 'Cancelled'. |

#### Testcase 10: Successfully download E-Ticket as PDF for a confirmed appointment

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-010 |
| **Test case name** | Successfully download E-Ticket as PDF for a confirmed appointment |
| **Description** | Verify that an eligible donor can generate and download their E-Ticket for a confirmed booking. |
| **Related Use case** | LL-UC-10 – Download E-Ticket |
| **Input Data** | Role: Authenticated Donor. Appointment: Status is 'Confirmed'. |
| **Expected Output** | The system generates the E-Ticket and the browser successfully downloads the PDF file. |
| **Test steps** | 1. Log in and navigate to 'My Appointments'.<br>2. Locate an appointment with the 'Confirmed' status.<br>3. Open the appointment details.<br>4. Locate and click the 'Download E-Ticket (PDF)' button.<br>5. Verify that the browser initiates a file download.<br>6. Open the downloaded PDF file.<br>7. Verify that the PDF contains the appointment details and a visible QR code. |

#### Testcase 11: Display empty state when no campaigns match the applied filter

<!-- METADATA: Type="Negative" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-011 |
| **Test case name** | Display empty state when no campaigns match the applied filter |
| **Description** | Verify that the system correctly handles situations where filter criteria result in no active campaigns. |
| **Related Use case** | LL-UC-06 – Browse Interactive Map |
| **Input Data** | Role: Any user. Filters: Blood Type AB-, Date: Very restricted range. |
| **Expected Output** | The list and map show zero results, and a friendly empty state message is displayed. |
| **Test steps** | 1. Navigate to the Interactive Map.<br>2. Open the filter panel.<br>3. Apply highly restrictive filters (e.g., specific rare blood type, narrow future date).<br>4. Click 'Apply'.<br>5. Verify that the map displays no pins.<br>6. Verify that the list displays an empty state message indicating no campaigns found. |

#### Testcase 12: Reject appointment booking if user account is unverified

<!-- METADATA: Type="Business Rule" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-012 |
| **Test case name** | Reject appointment booking if user account is unverified |
| **Description** | Verify that only verified users (email or phone verified) can proceed to book a blood donation appointment. |
| **Related Use case** | LL-UC-07 – Schedule Appointment |
| **Input Data** | Role: Authenticated but Unverified Donor. Action: Attempt to book timeslot. |
| **Expected Output** | The booking is rejected, and the system prompts the user to verify their account. |
| **Test steps** | 1. Log in with an unverified account.<br>2. Navigate to a campaign and open available timeslots.<br>3. Select a timeslot and attempt to book.<br>4. Verify that an error message or modal appears indicating the account must be verified.<br>5. Verify that the booking is not recorded in the database. |

#### Testcase 13: Successfully view details of an upcoming appointment

<!-- METADATA: Type="Positive" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-013 |
| **Test case name** | Successfully view details of an upcoming appointment |
| **Description** | Verify that donors can view the full details of their future scheduled appointments, including time, location, and instructions. |
| **Related Use case** | LL-UC-08 – View Appointment Details |
| **Input Data** | Role: Authenticated Donor. Appointment: Future and Confirmed. |
| **Expected Output** | The appointment detail screen displays all relevant information accurately. |
| **Test steps** | 1. Log in and navigate to 'My Appointments'.<br>2. Select an upcoming appointment from the list.<br>3. Verify that the detail screen displays the correct campaign name, date, timeslot, and location.<br>4. Verify that preparation instructions for donors are visible.<br>5. Verify that options to Cancel or Download E-Ticket are available. |

#### Testcase 14: Successfully view details of a completed appointment

<!-- METADATA: Type="Positive" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-014 |
| **Test case name** | Successfully view details of a completed appointment |
| **Description** | Verify that donors can access their appointment history and view details of past donations. |
| **Related Use case** | LL-UC-08 – View Appointment Details |
| **Input Data** | Role: Authenticated Donor. Appointment: Past and Completed (Checked-in). |
| **Expected Output** | The detail screen displays the past appointment details without modification options. |
| **Test steps** | 1. Log in and navigate to 'My Appointments' or 'History'.<br>2. Select a past, completed appointment.<br>3. Verify that details are displayed accurately.<br>4. Verify that the 'Cancel Appointment' button is not present or disabled.<br>5. Verify that the status correctly reflects 'Completed' or 'Checked-in'. |

#### Testcase 15: Reject appointment cancellation less than 24 hours before scheduled time

<!-- METADATA: Type="Business Rule" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-015 |
| **Test case name** | Reject appointment cancellation less than 24 hours before scheduled time |
| **Description** | Verify that the system enforces the 24-hour cancellation rule to prevent last-minute drop-offs. |
| **Related Use case** | LL-UC-09 – Cancel Appointment |
| **Input Data** | Role: Authenticated Donor. Appointment: Scheduled within the next 24 hours. |
| **Expected Output** | The system prevents cancellation and displays a policy notice. |
| **Test steps** | 1. Log in and navigate to 'My Appointments'.<br>2. Select an appointment that is scheduled within the next 24 hours.<br>3. Open the appointment details.<br>4. Verify that the 'Cancel Appointment' button is either disabled or displays a warning when clicked.<br>5. Attempt to proceed with cancellation.<br>6. Verify that an error message indicating the 24-hour policy is displayed, and the appointment remains active. |

#### Testcase 16: Verify E-Ticket QR code contains correct appointment data

<!-- METADATA: Type="Validation" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F2-016 |
| **Test case name** | Verify E-Ticket QR code contains correct appointment data |
| **Description** | Verify that the generated QR code on the E-Ticket embeds the correct identifiers for fast check-in at the campaign. |
| **Related Use case** | LL-UC-10 – Download E-Ticket |
| **Input Data** | Role: Authenticated Donor. Action: Scan downloaded E-Ticket QR. |
| **Expected Output** | The QR code decodes to a valid string containing the Appointment ID and User ID. |
| **Test steps** | 1. Download the E-Ticket PDF for a confirmed appointment.<br>2. Open the PDF and locate the QR code.<br>3. Use a standard QR code scanner (or mock test utility) to decode the QR image.<br>4. Verify that the decoded payload matches the expected format (e.g., JSON or encrypted string with Appointment ID).<br>5. Ensure no sensitive plaintext data (like passwords) is exposed in the QR code. |

### 3.3. Feature 3: Campaign Management

#### Testcase 1: Successful campaign creation with valid details

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-001 |
| **Test case name** | Successful campaign creation with valid details |
| **Description** | Verify that a Blood Center staff member can successfully create a new blood donation campaign. |
| **Related Use case** | BC-UC-01 – Create Donation Campaign |
| **Input Data** | Role: Blood Center Staff. Name: Summer Drive; Start: Future Date; End: Future Date + 5 days; Capacity: 100; Location: valid address. |
| **Expected Output** | The campaign is created successfully, a success notification is displayed, and it appears in the active campaigns list. |
| **Test steps** | 1. Log in using a Blood Center Staff account.<br>2. Navigate to the Campaign Management dashboard.<br>3. Click on 'Create Campaign'.<br>4. Enter a valid Campaign Name.<br>5. Select a valid future Start Date.<br>6. Select an End Date that is after the Start Date.<br>7. Enter a positive Capacity (e.g., 100).<br>8. Select a valid Location.<br>9. Click the 'Submit' or 'Create' button.<br>10. Verify that a success message is displayed.<br>11. Verify that the new campaign appears in the campaign list with the correct status. |

#### Testcase 2: Reject campaign creation with an invalid date range

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-002 |
| **Test case name** | Reject campaign creation with an invalid date range |
| **Description** | Verify that the system prevents campaign creation when the end date is earlier than the start date. |
| **Related Use case** | BC-UC-01 – Create Donation Campaign |
| **Input Data** | Role: Blood Center Staff. Start Date: 25/08/2026; End Date: 20/08/2026; other fields valid. |
| **Expected Output** | The system displays a date validation message and prevents campaign creation. No invalid campaign is added to the list. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to Campaign Management.<br>3. Select 'Create Campaign'.<br>4. Enter valid campaign information for all fields except dates.<br>5. Set the Start Date to a future date.<br>6. Set the End Date to a date earlier than the Start Date.<br>7. Click 'Submit'.<br>8. Verify that a validation error message regarding the dates is displayed.<br>9. Verify that the campaign is not created. |

#### Testcase 3: Reject campaign creation with zero or negative capacity

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-003 |
| **Test case name** | Reject campaign creation with zero or negative capacity |
| **Description** | Verify that the system requires a positive capacity value for new campaigns. |
| **Related Use case** | BC-UC-01 – Create Donation Campaign |
| **Input Data** | Role: Blood Center Staff. Capacity: 0 or -10. |
| **Expected Output** | The system displays a capacity validation message and prevents campaign creation. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to 'Create Campaign'.<br>3. Fill in all required fields with valid data except Capacity.<br>4. Enter '0' (or a negative number) in the Capacity field.<br>5. Click 'Submit'.<br>6. Verify that a validation error message indicates capacity must be greater than zero.<br>7. Verify that the campaign is not created. |

#### Testcase 4: Successfully filter campaign list by active status

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-004 |
| **Test case name** | Successfully filter campaign list by active status |
| **Description** | Verify that staff can filter the campaigns list to view only currently active campaigns. |
| **Related Use case** | BC-UC-02 – View Donation Campaign List |
| **Input Data** | Role: Blood Center Staff. Filter: Status = 'Active'. Multiple campaigns exist with mixed statuses. |
| **Expected Output** | The list updates to display only campaigns that currently have the 'Active' status. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the Campaign Management list view.<br>3. Locate the Status filter dropdown.<br>4. Select 'Active' from the filter options.<br>5. Click 'Apply' (if necessary).<br>6. Verify that the list reloads.<br>7. Verify that every campaign displayed in the filtered list has the status 'Active'. |

#### Testcase 5: Successfully update campaign capacity

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-005 |
| **Test case name** | Successfully update campaign capacity |
| **Description** | Verify that staff can edit an existing active campaign and increase its donor capacity. |
| **Related Use case** | BC-UC-03 – View/Edit Donation Campaign Details |
| **Input Data** | Role: Blood Center Staff. Campaign: Active. New Capacity: 150 (greater than current). |
| **Expected Output** | The campaign capacity is updated successfully. The new value is reflected in the campaign details and list. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to Campaign Management.<br>3. Click on an existing Active campaign to view its details.<br>4. Click the 'Edit' button.<br>5. Change the Capacity field to a higher valid number (e.g., 150).<br>6. Click 'Save'.<br>7. Verify that a success message is displayed.<br>8. Verify that the campaign details now show the updated capacity. |

#### Testcase 6: Successfully view registered donors for a specific campaign

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-006 |
| **Test case name** | Successfully view registered donors for a specific campaign |
| **Description** | Verify that staff can access the list of donors who have booked appointments for a campaign. |
| **Related Use case** | BC-UC-04 – View Donor Registration List |
| **Input Data** | Role: Blood Center Staff. Campaign: Active, contains at least 1 registered donor. |
| **Expected Output** | The system displays a table or list containing the details of all donors registered for the selected campaign. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to Campaign Management.<br>3. Open the details of a campaign that has registered donors.<br>4. Click on the 'View Donors' or 'Registrations' tab/button.<br>5. Verify that a list of donors is displayed.<br>6. Verify that the list includes donor names, appointment times, and their current registration status (e.g., Pending, Confirmed). |

#### Testcase 7: Successfully update donor registration status to Checked-in

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-007 |
| **Test case name** | Successfully update donor registration status to Checked-in |
| **Description** | Verify that staff can manually update a donor's appointment status upon their physical arrival. |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Donor Status: Confirmed. |
| **Expected Output** | The donor's status is successfully updated to 'Checked-in' and the UI reflects the change. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the donor registration list for a campaign.<br>3. Locate a donor with a 'Confirmed' status.<br>4. Select the donor or click the edit action.<br>5. Change the status to 'Checked-in'.<br>6. Save the changes.<br>7. Verify that a success message is displayed.<br>8. Verify that the donor's status in the list is now 'Checked-in'. |

#### Testcase 8: Successfully search registered donor by Citizen ID

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-008 |
| **Test case name** | Successfully search registered donor by Citizen ID |
| **Description** | Verify that staff can quickly find a specific donor in a large list using their Citizen ID. |
| **Related Use case** | BC-UC-06 – Search Donor Registration |
| **Input Data** | Role: Blood Center Staff. Search Term: A specific, existing Citizen ID (e.g., 079204001234). |
| **Expected Output** | The list filters down to display only the single donor record matching the provided Citizen ID. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the donor registration list for a campaign.<br>3. Locate the search input field.<br>4. Enter the exact Citizen ID of a known registered donor.<br>5. Trigger the search (press Enter or wait for auto-filter).<br>6. Verify that the list updates.<br>7. Verify that only the donor matching the specific Citizen ID is displayed. |

#### Testcase 9: Successfully check-in donor by scanning a valid E-Ticket QR code

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-009 |
| **Test case name** | Successfully check-in donor by scanning a valid E-Ticket QR code |
| **Description** | Verify that staff can use the QR scanner tool to automatically retrieve and check-in a donor. |
| **Related Use case** | BC-UC-07 – QR Code Scan & Verification |
| **Input Data** | Role: Blood Center Staff. QR Code: Valid, active E-Ticket payload for today's campaign. |
| **Expected Output** | The system successfully reads the QR code, displays the donor's details, and allows the staff to confirm check-in. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the QR Scanner or Check-in module.<br>3. Activate the scanner interface.<br>4. Scan a valid E-Ticket QR code (using camera or simulated input).<br>5. Verify that the system retrieves and displays the correct donor and appointment details.<br>6. Click the button to confirm check-in.<br>7. Verify that a success message is displayed indicating the donor is Checked-in. |

#### Testcase 10: Reject donor check-in with an expired or invalid E-Ticket QR code

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-010 |
| **Test case name** | Reject donor check-in with an expired or invalid E-Ticket QR code |
| **Description** | Verify that the scanner rejects QR codes that are not recognized or belong to past appointments. |
| **Related Use case** | BC-UC-07 – QR Code Scan & Verification |
| **Input Data** | Role: Blood Center Staff. QR Code: Invalid format or from an appointment dated 1 year ago. |
| **Expected Output** | The system displays an error message indicating the QR code is invalid or expired, and prevents check-in. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the QR Scanner module.<br>3. Scan an invalid or expired QR code.<br>4. Verify that the system does not display the check-in confirmation screen.<br>5. Verify that a clear error message (e.g., 'Invalid or Expired E-Ticket') is displayed on the screen. |

#### Testcase 11: Reject campaign creation when required fields are missing

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-011 |
| **Test case name** | Reject campaign creation when required fields are missing |
| **Description** | Verify that the system enforces validation on required fields (e.g., Name, Location) when creating a campaign. |
| **Related Use case** | BC-UC-01 – Create Donation Campaign |
| **Input Data** | Role: Blood Center Staff. Missing Name or Location, but valid dates and capacity. |
| **Expected Output** | The system prevents creation and highlights the missing required fields. |
| **Test steps** | 1. Navigate to the Create Campaign form.<br>2. Leave the Campaign Name field blank.<br>3. Fill in all other fields with valid data.<br>4. Click 'Submit'.<br>5. Verify that an error message indicates the Name field is required.<br>6. Verify that the campaign is not created. |

#### Testcase 12: Successfully use pagination to view multiple pages of campaigns

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-012 |
| **Test case name** | Successfully use pagination to view multiple pages of campaigns |
| **Description** | Verify that staff can navigate through a large list of campaigns using pagination controls. |
| **Related Use case** | BC-UC-02 – View Donation Campaign List |
| **Input Data** | Role: Blood Center Staff. Database has > 10 campaigns (or items per page). |
| **Expected Output** | The list updates to show the next page of results correctly. |
| **Test steps** | 1. Navigate to the Campaign Management list view.<br>2. Verify that pagination controls are visible at the bottom of the list.<br>3. Click the 'Next' page button or select page '2'.<br>4. Verify that the list updates to display the second page of campaigns.<br>5. Verify that the total count of campaigns remains accurate. |

#### Testcase 13: Reject editing a campaign that has already ended

<!-- METADATA: Type="Business Rule" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-013 |
| **Test case name** | Reject editing a campaign that has already ended |
| **Description** | Verify that campaigns in a 'Completed' or 'Ended' state can be viewed but not modified. |
| **Related Use case** | BC-UC-03 – View/Edit Donation Campaign Details |
| **Input Data** | Role: Blood Center Staff. Campaign: Status is 'Ended'. |
| **Expected Output** | The Edit button is disabled or an error prevents saving changes to an ended campaign. |
| **Test steps** | 1. Navigate to the Campaign Management dashboard.<br>2. Filter or search for a campaign that has already Ended.<br>3. Click to view its details.<br>4. Verify that the 'Edit' button is hidden or visually disabled.<br>5. (If editable) Attempt to change a field and save.<br>6. Verify that the system rejects the update with an appropriate business rule error. |

#### Testcase 14: Successfully reject a donor registration

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-015 |
| **Test case name** | Successfully reject a donor registration |
| **Description** | Verify that staff can manually reject a donor's appointment (e.g., due to medical ineligibility discovered beforehand). |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Registration: Status is 'Pending' or 'Confirmed'. |
| **Expected Output** | The registration status is updated to 'Rejected' and the donor is notified. |
| **Test steps** | 1. Open a campaign and navigate to the donor registration list.<br>2. Click on a specific donor registration to view details.<br>3. Click the 'Reject' button.<br>4. Provide a rejection reason if prompted.<br>5. Submit the rejection.<br>6. Verify that the status in the UI updates to 'Rejected'. |

#### Testcase 15: Display empty state when searching for non-existent Citizen ID

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-016 |
| **Test case name** | Display empty state when searching for non-existent Citizen ID |
| **Description** | Verify that the system handles searches for unregistered or invalid Citizen IDs gracefully. |
| **Related Use case** | BC-UC-06 – Search Donor Registration |
| **Input Data** | Role: Blood Center Staff. Search Term: '000000000000' (non-existent). |
| **Expected Output** | The list is empty and an appropriate message is displayed. |
| **Test steps** | 1. Navigate to the donor registration list for a campaign.<br>2. Enter a non-existent Citizen ID in the search field.<br>3. Trigger the search.<br>4. Verify that the list shows zero results.<br>5. Verify that a user-friendly message (e.g., 'No matching records found') is displayed. |

#### Testcase 16: Successfully update donor registration status to Eligible after passing Clinical Vitals Exam at the Campaign

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-017 |
| **Test case name** | Successfully update donor registration status to Eligible after passing Clinical Vitals Exam at the Campaign |
| **Description** | Verify that staff can update a donor registration status to Eligible after the donor successfully passes the clinical vitals examination on-site at the campaign. |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Registration: Status is 'Checked-in'. Clinical vitals exam: Passed / Normal. |
| **Expected Output** | The donor registration status is updated to 'Eligible' and the UI reflects the updated status. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the donor registration list of an active campaign.<br>3. Select a donor with 'Checked-in' status.<br>4. Open the clinical examination/status update panel and select 'Eligible'.<br>5. Confirm and save the clinical examination result.<br>6. Verify that the donor status badge updates to 'Eligible'. |

#### Testcase 17: Successfully update donor registration status to Ineligible after failing Clinical Vitals Exam at the Campaign

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-018 |
| **Test case name** | Successfully update donor registration status to Ineligible after failing Clinical Vitals Exam at the Campaign |
| **Description** | Verify that staff can update a donor registration status to Ineligible when the donor does not pass the clinical vitals examination on-site at the campaign. |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Registration: Status is 'Checked-in'. Clinical vitals exam: Failed / Abnormal vitals. |
| **Expected Output** | The donor registration status is updated to 'Ineligible' with the recorded ineligibility reason. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the donor registration list of an active campaign.<br>3. Select a donor with 'Checked-in' status.<br>4. Open the clinical examination/status update panel and select 'Ineligible'.<br>5. Enter the disqualification/ineligibility reason and save.<br>6. Verify that the donor status badge updates to 'Ineligible'. |

#### Testcase 18: Successfully update donor registration status to Pass after passing the blood test after the campaign

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-019 |
| **Test case name** | Successfully update donor registration status to Pass after passing the blood test after the campaign |
| **Description** | Verify that staff can update a donor registration status to Pass after laboratory testing confirms the collected blood unit is qualified and safe. |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Registration: Status is 'Eligible' / Blood collected. Lab test result: Passed (Negative for infectious diseases). |
| **Expected Output** | The donor registration status is updated to 'Pass' and blood test results are recorded successfully. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the post-campaign donor test results management section.<br>3. Select a donor record whose blood sample has undergone laboratory testing.<br>4. Update the test status to 'Pass'.<br>5. Confirm and submit the update.<br>6. Verify that the status is successfully saved as 'Pass'. |

#### Testcase 19: Successfully update donor registration status to Fail after failing the blood test after the campaign

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F3-020 |
| **Test case name** | Successfully update donor registration status to Fail after failing the blood test after the campaign |
| **Description** | Verify that staff can update a donor registration status to Fail when post-donation blood testing indicates unqualified or unsafe test results. |
| **Related Use case** | BC-UC-05 – View/Edit Donor Registration Details |
| **Input Data** | Role: Blood Center Staff. Registration: Status is 'Eligible' / Blood collected. Lab test result: Failed (Unqualified/Inconclusive). |
| **Expected Output** | The donor registration status is updated to 'Fail' and the total donor list count remains accurate without unintended deletion. |
| **Test steps** | 1. Log in as a Blood Center staff member.<br>2. Navigate to the post-campaign donor test results management section.<br>3. Select a donor record requiring status update after laboratory testing.<br>4. Update the test status to 'Fail'.<br>5. Save the updated result.<br>6. Verify that the status is updated to 'Fail' and the donor record remains intact in the registration list. |

### 3.4. Feature 4: SOS Request Management

#### Testcase 1: Successful SOS request creation with valid details

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-001 |
| **Test case name** | Successful SOS request creation with valid details |
| **Description** | Verify that a Hospital Administrator can broadcast an emergency blood request. |
| **Related Use case** | HS-UC-01 – Create SOS Request |
| **Input Data** | Role: Hospital Admin. Blood Type: O-; Urgency: High; Required Units: 10. |
| **Expected Output** | The SOS Request is created, its status is 'Active', and it appears on the SOS Dashboard. |
| **Test steps** | 1. Log in using a Hospital Administrator account.<br>2. Navigate to the SOS Request module.<br>3. Click 'Create New SOS'.<br>4. Select 'O-' as the Blood Type.<br>5. Select 'High' as the Urgency level.<br>6. Enter '10' for Required Units.<br>7. Click 'Submit Broadcast'.<br>8. Verify that a success message is displayed.<br>9. Verify that the request appears in the active SOS list. |

#### Testcase 2: Reject SOS request creation with missing required blood type

<!-- METADATA: Type="Negative" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-002 |
| **Test case name** | Reject SOS request creation with missing required blood type |
| **Description** | Verify that the system prevents SOS creation if mandatory fields like blood type are omitted. |
| **Related Use case** | HS-UC-01 – Create SOS Request |
| **Input Data** | Role: Hospital Admin. Blood Type: (Blank); Urgency: High; Required Units: 10. |
| **Expected Output** | The system displays a validation error for the missing field and prevents creation. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to 'Create New SOS'.<br>3. Leave the Blood Type field blank.<br>4. Fill in all other fields.<br>5. Click 'Submit Broadcast'.<br>6. Verify that a validation error message ('Blood Type is required') is displayed.<br>7. Verify that the SOS request is not created. |

#### Testcase 3: Successfully view the active SOS request dashboard

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-004 |
| **Test case name** | Successfully view the active SOS request dashboard |
| **Description** | Verify that hospital staff can monitor the real-time status of their active SOS requests. |
| **Related Use case** | HS-UC-02 – Monitor SOS Request |
| **Input Data** | Role: Hospital Admin. Precondition: At least one active SOS request exists for the hospital. |
| **Expected Output** | The dashboard successfully loads and displays the active request along with metrics like 'units collected vs required'. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to the SOS Dashboard.<br>3. Verify that the page loads without errors.<br>4. Verify that the active SOS request is visible in the list.<br>5. Verify that progress indicators (e.g., X / Y units collected) are displayed correctly for the active request. |

#### Testcase 4: Successfully mark an active SOS request as resolved

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-005 |
| **Test case name** | Successfully mark an active SOS request as resolved |
| **Description** | Verify that hospital staff can manually close an SOS request when the blood need is fulfilled. |
| **Related Use case** | HS-UC-02 – Monitor SOS Request |
| **Input Data** | Role: Hospital Admin. Target: An active SOS request. |
| **Expected Output** | The SOS status updates to 'Resolved', and it is moved out of the active emergency views. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to the SOS Dashboard.<br>3. Select an active SOS request.<br>4. Click the 'Mark as Resolved' button.<br>5. Confirm the action in the prompt.<br>6. Verify that a success message is displayed.<br>7. Verify that the request's status changes to 'Resolved'.<br>8. Verify that it no longer appears in the 'Active' filter view. |

#### Testcase 5: Verify resolved SOS request cannot be marked as resolved again

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-006 |
| **Test case name** | Verify resolved SOS request cannot be marked as resolved again |
| **Description** | Verify that state transitions are enforced, preventing redundant actions on closed requests. |
| **Related Use case** | HS-UC-02 – Monitor SOS Request |
| **Input Data** | Role: Hospital Admin. Target: An already 'Resolved' SOS request. |
| **Expected Output** | The 'Mark as Resolved' action is hidden or disabled for requests that are already resolved. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to the SOS Request history/list.<br>3. Open the details of a 'Resolved' SOS request.<br>4. Observe the available action buttons.<br>5. Verify that the 'Mark as Resolved' button is either hidden entirely or visually disabled.<br>6. Verify that no state transition can be triggered. |

#### Testcase 6: Successfully cancel an active SOS request

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-007 |
| **Test case name** | Successfully cancel an active SOS request |
| **Description** | Verify that hospital staff can cancel an emergency request if it is made in error or no longer needed. |
| **Related Use case** | HS-UC-02 – Monitor SOS Request |
| **Input Data** | Role: Hospital Admin. Target: An active SOS request. |
| **Expected Output** | The SOS status updates to 'Cancelled' and system broadcasts are halted. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to the SOS Dashboard.<br>3. Open the details of an active SOS request.<br>4. Click the 'Cancel Request' button.<br>5. Confirm the cancellation action.<br>6. Verify that a success message is displayed.<br>7. Verify that the request's status changes to 'Cancelled'. |

#### Testcase 7: Display empty state when generating SOS report for a date range with no data

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-009 |
| **Test case name** | Display empty state when generating SOS report for a date range with no data |
| **Description** | Verify that the reporting module gracefully handles queries for time periods with zero activity. |
| **Related Use case** | HS-UC-03 – View SOS Reports |
| **Input Data** | Role: Hospital Admin. Date Range: A future month or a known empty period. |
| **Expected Output** | The system displays a clear 'No data available' message without crashing. |
| **Test steps** | 1. Log in as a Hospital Admin.<br>2. Navigate to the SOS Reports module.<br>3. Select a date range in the future (where no data exists).<br>4. Click 'Generate Report'.<br>5. Verify that the report view loads.<br>6. Verify that a message such as 'No data available for this period' is displayed instead of charts or tables.<br>7. Verify there are no application crashes or console errors. |

#### Testcase 8: Reject SOS request creation attempt for a different hospital location

<!-- METADATA: Type="Role/Permission" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-010 |
| **Test case name** | Reject SOS request creation attempt for a different hospital location |
| **Description** | Verify that hospital accounts are restricted to creating SOS requests only for their own registered location. |
| **Related Use case** | HS-UC-01 – Create SOS Request |
| **Input Data** | Role: Admin of Hospital A. Location field manipulation. |
| **Expected Output** | The location field is locked to Hospital A's address and cannot be changed to another hospital. |
| **Test steps** | 1. Log in as the Admin for Hospital A.<br>2. Navigate to 'Create New SOS'.<br>3. Locate the 'Requesting Facility' or 'Location' field.<br>4. Attempt to edit or select a different hospital from the field.<br>5. Verify that the field is read-only or disabled, permanently locked to Hospital A's details.<br>6. Verify that the user cannot submit an SOS on behalf of Hospital B. |

#### Testcase 9: Verify notification is sent to eligible donors when a new SOS request is created

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-011 |
| **Test case name** | Verify notification is sent to eligible donors when a new SOS request is created |
| **Description** | Verify that push notifications or emails are properly dispatched to donors who match the SOS request blood type and location. |
| **Related Use case** | SOS-UC-01 – Receive SOS Emergency Alert |
| **Input Data** | Role: System/Donor. A new valid SOS request for blood type 'O-' is created. |
| **Expected Output** | Eligible donors (matching O- and nearby) receive an alert immediately. |
| **Test steps** | 1. Create a new SOS request for a specific blood type and location as an Admin/Hospital.<br>2. Log in as an eligible Donor who matches the criteria.<br>3. Verify that the Donor receives an in-app notification or email alert.<br>4. Verify the notification details match the created SOS request. |

#### Testcase 10: Reject SOS request creation if required units is zero or negative

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-012 |
| **Test case name** | Reject SOS request creation if required units is zero or negative |
| **Description** | Verify that the system validates the requested quantity of blood units. |
| **Related Use case** | SOS-UC-01 – Receive SOS Emergency Alert |
| **Input Data** | Role: Hospital Admin. Units Required: 0 or -5. |
| **Expected Output** | The system rejects the creation and shows a validation error. |
| **Test steps** | 1. Navigate to the SOS request creation form.<br>2. Fill in all fields with valid data except 'Units Required'.<br>3. Enter '0' (or a negative number).<br>4. Submit the form.<br>5. Verify that a validation error message indicates the units must be greater than zero.<br>6. Verify the SOS request is not saved. |

#### Testcase 11: Successfully filter SOS requests on the dashboard by blood type

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-013 |
| **Test case name** | Successfully filter SOS requests on the dashboard by blood type |
| **Description** | Verify that users can filter active SOS requests to see only those matching specific blood types. |
| **Related Use case** | SOS-UC-02 – Respond to SOS Emergency Alert |
| **Input Data** | Role: Authenticated Donor. Filter: Blood Type 'AB+'. |
| **Expected Output** | The dashboard updates to display only SOS requests requiring 'AB+' blood. |
| **Test steps** | 1. Navigate to the SOS Request dashboard.<br>2. Open the filter panel.<br>3. Select the blood type 'AB+' and apply the filter.<br>4. Verify that the list reloads.<br>5. Verify that every SOS request in the filtered list specifically requires AB+ blood. |

#### Testcase 12: Successfully sort the active SOS request dashboard by urgency

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-014 |
| **Test case name** | Successfully sort the active SOS request dashboard by urgency |
| **Description** | Verify that users can sort the SOS list to prioritize the most urgent requests. |
| **Related Use case** | SOS-UC-02 – Respond to SOS Emergency Alert |
| **Input Data** | Role: Authenticated Donor. Sort: 'Urgency (High to Low)' or 'Time Created (Newest)'. |
| **Expected Output** | The list of SOS requests is reordered correctly according to the chosen criteria. |
| **Test steps** | 1. Navigate to the SOS Request dashboard.<br>2. Locate the sorting dropdown menu.<br>3. Select 'Urgency: High to Low' (or similar criteria).<br>4. Verify that the list reloads.<br>5. Verify that the most urgent requests (e.g., 'Critical' status or closest deadline) appear at the top. |

#### Testcase 13: Verify SOS request automatically expires if not resolved within timeframe

<!-- METADATA: Type="Business Rule" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F4-016 |
| **Test case name** | Verify SOS request automatically expires if not resolved within timeframe |
| **Description** | Verify the system automatically closes SOS requests that have exceeded their valid deadline without being resolved. |
| **Related Use case** | SOS-UC-01 – Receive SOS Emergency Alert |
| **Input Data** | Role: System. SOS Request: Active, but its deadline has passed in the background. |
| **Expected Output** | The system updates the request status to 'Expired' and removes it from the active dashboard. |
| **Test steps** | 1. Identify or create an active SOS request with a deadline set to 1 minute from now.<br>2. Wait for the deadline to pass.<br>3. Refresh the active SOS dashboard.<br>4. Verify that the SOS request no longer appears in the active list.<br>5. Navigate to the SOS history or report.<br>6. Verify that the request status is correctly marked as 'Expired'. |

### 3.5. Feature 5: AI Conversational Support

#### Testcase 1: Successfully open chatbot and receive default welcome message

<!-- METADATA: Type="Positive" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-001 |
| **Test case name** | Successfully open chatbot and receive default welcome message |
| **Description** | Verify that a user can initiate the chatbot interface and is greeted properly. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Action: Click chatbot widget. |
| **Expected Output** | The chat window opens and displays a predefined welcome message. |
| **Test steps** | 1. Log in to the application.<br>2. Locate the Chatbot floating icon/widget.<br>3. Click the icon to open the chat interface.<br>4. Verify that the chat window expands smoothly.<br>5. Verify that a default welcome message from the AI (e.g., 'Hello! How can I help you with blood donation today?') is immediately visible. |

#### Testcase 2: Successfully receive correct eligibility response from chatbot

<!-- METADATA: Type="AI Behavior" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-002 |
| **Test case name** | Successfully receive correct eligibility response from chatbot |
| **Description** | Verify that the AI correctly answers standard medical FAQ questions using its knowledge base. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Prompt: 'Can I donate if I have a cold?' |
| **Expected Output** | The AI responds accurately based on medical guidelines, advising the user to wait until symptoms clear. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type the message: 'Can I donate if I have a cold?'<br>3. Click Send.<br>4. Wait for the AI response.<br>5. Verify that the response explicitly addresses having a cold.<br>6. Verify that the response states the user is temporarily ineligible and must recover before donating. |

#### Testcase 3: Successfully receive location guidance from chatbot

<!-- METADATA: Type="AI Behavior" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-003 |
| **Test case name** | Successfully receive location guidance from chatbot |
| **Description** | Verify that the AI can direct users to donation locations when asked. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Prompt: 'Where can I donate blood?' |
| **Expected Output** | The AI responds with instructions and/or a direct link to the Interactive Map page. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type the message: 'Where can I donate blood?'<br>3. Click Send.<br>4. Wait for the AI response.<br>5. Verify that the AI provides information on how to find locations.<br>6. Verify that the response includes a clickable link or button that navigates the user to the Map page. |

#### Testcase 4: Verify graceful fallback behavior for irrelevant prompts

<!-- METADATA: Type="AI Behavior" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-004 |
| **Test case name** | Verify graceful fallback behavior for irrelevant prompts |
| **Description** | Verify that the chatbot refuses to answer non-domain questions and redirects focus to blood donation. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Prompt: 'What is the recipe for chocolate cake?' |
| **Expected Output** | The AI politely declines the off-topic prompt and offers help related to LifeLine's services. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type the message: 'What is the recipe for chocolate cake?'<br>3. Click Send.<br>4. Wait for the AI response.<br>5. Verify that the AI does NOT provide a recipe.<br>6. Verify that the response states the AI is designed for blood donation support and asks if they need help with that domain. |

#### Testcase 5: Successfully maintain conversational context across multiple turns

<!-- METADATA: Type="AI Behavior" Source="Spec Kit - Reused" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-005 |
| **Test case name** | Successfully maintain conversational context across multiple turns |
| **Description** | Verify that the AI remembers information provided earlier in the same chat session. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Turn 1: 'I am O+'. Turn 2: 'Who can I donate to?' |
| **Expected Output** | The AI uses the context from turn 1 to answer turn 2 correctly. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type: 'I am blood type O+'.<br>3. Click Send and wait for acknowledgment.<br>4. Type: 'Who can I donate to?'.<br>5. Click Send.<br>6. Verify that the AI's response lists the correct recipient blood types for O+ (O+, A+, B+, AB+).<br>7. Verify that the AI did not ask for the user's blood type again. |

#### Testcase 6: Verify chatbot prevents or ignores empty message submission

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-006 |
| **Test case name** | Verify chatbot prevents or ignores empty message submission |
| **Description** | Verify that the system does not process blank inputs. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Prompt: '' (Empty string). |
| **Expected Output** | The send button is disabled, or clicking it does nothing, and no empty message bubble appears. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Leave the input field completely empty.<br>3. Observe the 'Send' button.<br>4. Verify that the 'Send' button is visually disabled.<br>5. Attempt to press Enter or click Send.<br>6. Verify that no message is added to the chat history and no API call is made. |

#### Testcase 7: Verify chat history persistence when closing and reopening the chat window

<!-- METADATA: Type="Positive" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-007 |
| **Test case name** | Verify chat history persistence when closing and reopening the chat window |
| **Description** | Verify that a user does not lose their current conversation if they temporarily minimize the widget. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Pre-existing conversation in the current session. |
| **Expected Output** | The chat messages remain visible when the window is reopened. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Send a test message (e.g., 'Hello') and receive a reply.<br>3. Click the close/minimize button on the chat widget.<br>4. Verify the chat window hides.<br>5. Click the chatbot widget to reopen it.<br>6. Verify that the previous 'Hello' message and the AI's reply are still visible in the chat history. |

#### Testcase 8: Verify graceful error handling when AI backend times out

<!-- METADATA: Type="Error Handling" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-008 |
| **Test case name** | Verify graceful error handling when AI backend times out |
| **Description** | Verify that the UI does not hang indefinitely if the AI service is unreachable or slow. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Simulated condition: AI Backend delay/timeout. |
| **Expected Output** | The UI shows a loading state, followed by a friendly error message, allowing the user to try again. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. (Requires backend manipulation or network throttle to simulate delay).<br>3. Type a message and send.<br>4. Verify that a loading indicator (e.g., 'AI is thinking...') appears.<br>5. Wait for the timeout threshold (e.g., 15-30 seconds).<br>6. Verify that the loading indicator disappears.<br>7. Verify that a clear error message (e.g., 'Sorry, the service is currently busy. Please try again later.') is displayed in the chat. |

#### Testcase 9: Successfully route user to booking page when action requested

<!-- METADATA: Type="AI Behavior" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-009 |
| **Test case name** | Successfully route user to booking page when action requested |
| **Description** | Verify that the AI can act as a navigational assistant for platform actions it cannot perform directly. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Prompt: 'Book an appointment for me'. |
| **Expected Output** | The AI explains its limitation and provides a direct link to the booking flow. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type the message: 'Can you book an appointment for me?'<br>3. Click Send.<br>4. Wait for the AI response.<br>5. Verify that the AI states it cannot directly book appointments.<br>6. Verify that the AI provides a button or link directing the user to the Booking/Map page. |

#### Testcase 10: Verify responsive layout of chatbot UI on mobile viewport

<!-- METADATA: Type="Positive" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-010 |
| **Test case name** | Verify responsive layout of chatbot UI on mobile viewport |
| **Description** | Verify that the chat interface remains usable on smaller screens. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Authenticated Donor. Environment: Mobile browser or simulated mobile viewport. |
| **Expected Output** | The chat window adapts to the screen size, text is readable, and the input field is fully accessible. |
| **Test steps** | 1. Open the application using a mobile device or browser DevTools set to a mobile viewport.<br>2. Open the Chatbot interface.<br>3. Verify that the chat window fits within the screen bounds without horizontal scrolling.<br>4. Tap the input field to open the virtual keyboard.<br>5. Verify that the input field remains visible (is not obscured by the keyboard).<br>6. Verify that the chat messages remain scrollable and readable. |

#### Testcase 11: Verify chatbot sanitizes malicious input safely

<!-- METADATA: Type="Security" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-012 |
| **Test case name** | Verify chatbot sanitizes malicious input safely |
| **Description** | Verify that the chat input field is secure against Cross-Site Scripting (XSS) and injection attacks. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Any user. Input: `<script>alert('XSS')</script>` or similar payload. |
| **Expected Output** | The input is treated as plain text; no script is executed in the browser. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Enter a standard XSS test script in the input field.<br>3. Send the message.<br>4. Verify that the browser does not execute an alert box or the script.<br>5. Verify that the user's message is displayed safely in the UI as plain text.<br>6. Verify the AI handles it gracefully (e.g., states it doesn't understand the code). |

#### Testcase 12: Verify chatbot displays a typing indicator while fetching a response

<!-- METADATA: Type="UI/UX" Source="Spec Kit - Refined" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-014 |
| **Test case name** | Verify chatbot displays a typing indicator while fetching a response |
| **Description** | Verify that the system provides visual feedback to the user while the AI backend is generating a reply. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Any user. Prompt: 'Tell me about blood donation'. |
| **Expected Output** | A typing animation (e.g., three dots or 'AI is typing...') appears immediately after sending, before the response arrives. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Type a relatively complex question and press send.<br>3. Immediately observe the chat window.<br>4. Verify that a loading/typing indicator appears in the message thread.<br>5. Verify that the indicator disappears exactly when the actual AI response is rendered. |

#### Testcase 13: Handle extremely long messages without crashing

<!-- METADATA: Type="Validation" Source="New" -->
| Field | Details |
|---|---|
| **Test case ID** | TC-F5-015 |
| **Test case name** | Handle extremely long messages without crashing |
| **Description** | Verify that the chat input handles character limits safely (truncation or error message) rather than causing backend or UI crashes. |
| **Related Use case** | CB-UC-01 – Interact with AI Chatbot |
| **Input Data** | Role: Any user. Input: A string exceeding 5000 characters. |
| **Expected Output** | The system either prevents the input, truncates it safely, or returns a polite error message about length limits. |
| **Test steps** | 1. Open the Chatbot interface.<br>2. Paste a block of text containing more than 5000 characters into the input field.<br>3. Attempt to send the message.<br>4. Verify that the app does not crash or freeze.<br>5. Verify that either the input is truncated, or a validation message (e.g., 'Message too long') is shown. |

