# LifeLine — Test Execution & Bug Report
> **Document**: Test Execution & Bug Report  
> **Course**: CSC13002 - Introduction to Software Engineering  
> **Team**: Sanguine (Team 05)  
> **Version**: 1.1 | **Date**: 25/08/2026  

*Author: Trịnh Khánh Linh | Reviewer: Trần Anh Kiệt | Editor: Trịnh Khánh Linh*

---

## Table of Contents

<!-- TOC_START -->
- [1. Executive Summary & Test Metrics](#1-executive-summary--test-metrics)
  - [1.1. Overview](#11-overview)
  - [1.2. Execution Statistics Summary](#12-execution-statistics-summary)
  - [1.3. Feature-by-Feature Results Breakdown](#13-feature-by-feature-results-breakdown)
  - [1.4. Defect Severity & Status Metrics](#14-defect-severity--status-metrics)
- [2. Detailed Test Execution Log (Initial Run)](#2-detailed-test-execution-log-initial-run)
  - [2.1. Feature 1: User Account Management (TC-F1)](#21-feature-1-user-account-management-tc-f1)
  - [2.2. Feature 2: Booking & Location Services (TC-F2)](#22-feature-2-booking--location-services-tc-f2)
  - [2.3. Feature 3: Campaign Management (TC-F3)](#23-feature-3-campaign-management-tc-f3)
  - [2.4. Feature 4: SOS Request Management (TC-F4)](#24-feature-4-sos-request-management-tc-f4)
  - [2.5. Feature 5: AI Conversational Support (TC-F5)](#25-feature-5-ai-conversational-support-tc-f5)
- [3. Retest & Verification Log](#3-retest--verification-log)
- [4. Detailed Bug Reports (Defect Tracking)](#4-detailed-bug-reports-defect-tracking)
  - [4.1. Bug Summary Table](#41-bug-summary-table)
  - [4.2. Bug Details](#42-bug-details)
    - [BUG-001: Duplicate Key Error during campaignCode generation and missing bloodCenterID](#bug-001-duplicate-key-error-during-campaigncode-generation-and-missing-bloodcenterid)
    - [BUG-002: Timezone offset error when querying early morning campaigns](#bug-002-timezone-offset-error-when-querying-early-morning-campaigns)
    - [BUG-003: Chatbot fails to retrieve and display campaign list data](#bug-003-chatbot-fails-to-retrieve-and-display-campaign-list-data)
    - [BUG-004: Chatbot loses conversational context across multi-turn dialogs](#bug-004-chatbot-loses-conversational-context-across-multi-turn-dialogs)
    - [BUG-005: QR scanner lacks campaign validation and allows cross-campaign check-in](#bug-005-qr-scanner-lacks-campaign-validation-and-allows-cross-campaign-check-in)
    - [BUG-006: Registration list count decrements by 1 when updating test status to Fail](#bug-006-registration-list-count-decrements-by-1-when-updating-test-status-to-fail)
    - [BUG-007: Completed campaigns still allow modifying priority blood types](#bug-007-completed-campaigns-still-allow-modifying-priority-blood-types)
    - [BUG-008: Chatbot displays incorrect campaign start and end times](#bug-008-chatbot-displays-incorrect-campaign-start-and-end-times)
    - [BUG-009: White screen crash when editing phone number or address on Profile page](#bug-009-white-screen-crash-when-editing-phone-number-or-address-on-profile-page)
    - [BUG-010: Fulfilled SOS request displays 0 ml received instead of actual fulfilled quantity](#bug-010-fulfilled-sos-request-displays-0-ml-received-instead-of-actual-fulfilled-quantity)
    - [BUG-011: System allows appointment cancellation within 24 hours of scheduled time](#bug-011-system-allows-appointment-cancellation-within-24-hours-of-scheduled-time)
    - [BUG-012: Appointment booking checks overall campaign target instead of timeslot capacity](#bug-012-appointment-booking-checks-overall-campaign-target-instead-of-timeslot-capacity)
    - [BUG-013: Donor registration record disappears after quick approval in Pending tab](#bug-013-donor-registration-record-disappears-after-quick-approval-in-pending-tab)
    - [BUG-014: Clicking thank-you notifications redirects incorrectly to /content route](#bug-014-clicking-thank-you-notifications-redirects-incorrectly-to-content-route)
    - [BUG-015: Timeslot capacity is not restored upon donor cancellation or staff rejection](#bug-015-timeslot-capacity-is-not-restored-upon-donor-cancellation-or-staff-rejection)
    - [BUG-016: Discrepancy between configured timeslot hours and default campaign start/end time](#bug-016-discrepancy-between-configured-timeslot-hours-and-default-campaign-startend-time)
    - [BUG-017: Appointment details view automatically jumps to the latest record every 5 seconds](#bug-017-appointment-details-view-automatically-jumps-to-the-latest-record-every-5-seconds)
    - [BUG-018: Stocked-in blood unit is not linked to donor record and displays incorrect collection date](#bug-018-stocked-in-blood-unit-is-not-linked-to-donor-record-and-displays-incorrect-collection-date)
<!-- TOC_END -->

---

## 1. Executive Summary & Test Metrics

### 1.1. Overview
This document records the results of manual functional test execution and defect management (Bug Reports & Defect Tracking) for the **LifeLine** system across five core functional modules.
The testing phase took place from **August 14, 2026** to **August 17, 2026**, encompassing initial test execution runs (Initial Run) and subsequent verification runs (Retest) following the deployment of bug fixes by the development team.

* **Total Test Cases in Scope:** 73 Test Cases (100% synchronized with `TestCases.md`).
* **Total Defects Logged:** 18 Defects (`BUG-001` through `BUG-018`).
* **Test Environment:** Web Application (Chrome/Edge DevTools, Local and Staging Environments).

---

### 1.2. Execution Statistics Summary

| Metric | Count | Percentage (%) | Notes |
| :--- | :---: | :---: | :--- |
| **Total Test Cases Executed** | **73** | 100% | All 73 TCs in scope |
| **Initial Run - Pass** | **63** | 86.3% | Passed on initial execution |
| **Initial Run - Fail** | **8** | 11.0% | Failed and required remediation |
| **Initial Run - Warning** | **2** | 2.7% | Functional with minor non-blocking defects |
| **Retests Executed** | **7** | - | Verified resolved defects |
| **Retest - Pass** | **6** | 85.7% | 6 out of 7 retest attempts passed successfully |
| **Final Passed / Verified Test Cases** | **69** | **94.5%** | Overall pass rate after critical bug fixes |

---

### 1.3. Feature-by-Feature Results Breakdown

| No. | Functional Feature | TC Prefix | Total TCs | Initial Pass | Initial Fail | Warning | Retest Pass | Final Pass Rate |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | User Account Management | `TC-F1` | 12 | 11 | 1 | 0 | - | 91.7% |
| 2 | Booking & Location Services | `TC-F2` | 16 | 13 | 3 | 0 | 2 | 93.8% |
| 3 | Campaign Management | `TC-F3` | 19 | 15 | 2 | 2 | 2 | 89.5% |
| 4 | SOS Request Management | `TC-F4` | 13 | 12 | 1 | 0 | - | 92.3% |
| 5 | AI Conversational Support | `TC-F5` | 13 | 10 | 3 | 0 | 2 | 92.3% |
| **Total** | **Entire System** | | **73** | **61** | **10** | **2** | **6** | **94.5%** |

---

### 1.4. Defect Severity & Status Metrics

```
  Defect Severity Breakdown                Defect Resolution Status
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │  Critical :  1 ( 5.6%)       │         │  Finished : 18 (100.0%)      │
  │  High     :  7 (38.9%)       │         │  Open     :  0 (  0.0%)      │
  │  Medium   :  7 (38.9%)       │         └──────────────────────────────┘
  │  Low      :  3 (16.7%)       │
  └──────────────────────────────┘
```

---

## 2. Detailed Test Execution Log (Initial Run)

### 2.1. Feature 1: User Account Management (TC-F1)

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Initial Run | `TC-F1-002` | Verify account activation via email link | 14/08/2026 | **Pass** | Registration succeeded; success notification displayed and activation email received. Clicking the activation link successfully redirected the user to the Login page. | - |
| Initial Run | `TC-F1-003` | Reject user registration with an already registered Citizen ID | 14/08/2026 | **Pass** | The system displays a "User with this email or ID Document already exists" message and prevents account creation. The user remains on the Registration page. | - |
| Initial Run | `TC-F1-004` | Reject user registration with a duplicate email address | 14/08/2026 | **Pass** | The system displays a "User with this email or ID Document already exists" message and prevents account creation. The user remains on the Registration page. | - |
| Initial Run | `TC-F1-006` | Reject user registration with invalid password format | 14/08/2026 | **Pass** | Displays validation error: "Password must include uppercase, lowercase, number, and special character." | - |
| Initial Run | `TC-F1-007` | Successful login with valid credentials | 14/08/2026 | **Pass** | Displays "Successful" message and redirects the authenticated user to the home dashboard. | - |
| Initial Run | `TC-F1-008` | Reject login with incorrect password | 14/08/2026 | **Pass** | Displays "Invalid credentials" error message and prevents authentication. | - |
| Initial Run | `TC-F1-009` | Reject login with unregistered email address | 14/08/2026 | **Pass** | Displays "Invalid credentials" error message and keeps the user on the Login page. | - |
| Initial Run | `TC-F1-011` | Successful logout from the application | 14/08/2026 | **Pass** | User session is invalidated successfully and the application navigates back to the Login page. | - |
| Initial Run | `TC-F1-013` | Successfully reset password with valid OTP and matching new passwords | 14/08/2026 | **Pass** | Displays "OTP verification successful", allows creating a new valid password, and enables successful login with the new credentials. | - |
| Initial Run | `TC-F1-014` | Reject password reset with invalid OTP | 14/08/2026 | **Pass** | Displays "Incorrect OTP code." error message and prevents proceeding to the reset form. | - |
| Initial Run | `TC-F1-015` | Successfully update user profile phone number or address | 14/08/2026 | **Fail** | A blank white screen crash occurs when clicking Edit on the Profile page. | `BUG-009` |
| Initial Run | `TC-F1-016` | Verify read-only fields cannot be modified during profile update | 14/08/2026 | **Pass** | Read-only fields (e.g., Citizen ID, Full Name, Date of Birth) cannot be focused or edited. | - |

---

### 2.2. Feature 2: Booking & Location Services (TC-F2)

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Initial Run | `TC-F2-001` | Successfully locate nearest donation points via GPS | 15/08/2026 | **Pass** | The map centers on the user's current coordinates. A success toast is displayed, and pins for nearby donation campaigns are visible on the map. | - |
| Initial Run | `TC-F2-002` | Successfully perform manual location search when GPS is denied | 15/08/2026 | **Pass** | The UI indicates manual search mode. The map centers on the searched district, displaying relevant campaigns. | - |
| Initial Run | `TC-F2-003` | Successfully filter locations by radius, date, and blood type | 15/08/2026 | **Pass** | Campaign list and map markers update in real-time and accurately reflect all applied filter criteria. | - |
| Initial Run | `TC-F2-004` | Reject appointment booking for unauthenticated user | 15/08/2026 | **Pass** | The Find Locations page on the public landing area only supports browsing locations without displaying the "Book Appointment" button for unauthenticated users. | - |
| Initial Run | `TC-F2-005` | Successful appointment booking for eligible donor | 15/08/2026 | **Pass** | Clicking "Confirm booking" navigates to the registration success page. Clicking "View My Appointments" shows the new booking in Pending status. | - |
| Initial Run | `TC-F2-006` | Reject appointment booking when last donation was less than 84 days ago | 15/08/2026 | **Pass** | Booking is blocked with message: "Insufficient interval between donations: Minimum 84-day spacing from last donation required." No appointment is created. | - |
| Initial Run | `TC-F2-007` | Reject appointment booking when a duplicate active appointment exists | 15/08/2026 | **Pass** | Booking is blocked with error message: "Duplicate appointment detected." | - |
| Initial Run | `TC-F2-008` | Reject appointment booking for a fully booked campaign timeslot | 15/08/2026 | **Fail** | System allows registration even though the selected timeslot has already reached full capacity. | `BUG-012`, `BUG-015` |
| Initial Run | `TC-F2-009` | Successfully cancel an appointment more than 24 hours in advance | 15/08/2026 | **Pass** | Appointment is successfully cancelled prior to the 24-hour deadline. | - |
| Initial Run | `TC-F2-010` | Successfully download E-Ticket as PDF for a confirmed appointment | 15/08/2026 | **Pass** | Successfully downloads the E-Ticket PDF file for a confirmed appointment. | - |
| Initial Run | `TC-F2-011` | Display empty state when no campaigns match the applied filter | 15/08/2026 | **Pass** | Displays empty state friendly message: "No donation points found. No campaigns match the current filter. Try expanding search radius or changing blood type. Reset filters." | - |
| Initial Run | `TC-F2-012` | Reject appointment booking if user account is unverified | 15/08/2026 | **Pass** | Unverified account cannot log in, thereby preventing unauthorized appointment booking. | - |
| Initial Run | `TC-F2-013` | Successfully view details of an upcoming appointment | 15/08/2026 | **Pass** | Successfully displays comprehensive appointment details (location, timeslot, screening form status). | - |
| Initial Run | `TC-F2-014` | Successfully view details of a completed appointment | 15/08/2026 | **Fail** | After viewing a completed appointment for a few seconds, the UI automatically resets and jumps to the top/latest appointment. | `BUG-017` |
| Initial Run | `TC-F2-015` | Reject appointment cancellation less than 24 hours before scheduled time | 15/08/2026 | **Fail** | System allows cancelling the appointment less than 24 hours before the scheduled time. | `BUG-011` |
| Initial Run | `TC-F2-016` | Verify E-Ticket QR code contains correct appointment data | 15/08/2026 | **Pass** | Scanning the E-Ticket QR code retrieves the exact signed passcode and appointment data. | - |

---

### 2.3. Feature 3: Campaign Management (TC-F3)

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Initial Run | `TC-F3-001` | Successful campaign creation with valid details | 15/08/2026 | **Fail** | Campaign creation fails despite providing complete valid details. | `BUG-001`, `BUG-002` |
| Initial Run | `TC-F3-002` | Reject campaign creation with an invalid date range | 15/08/2026 | **Pass** | Displays validation error: "Timeslot 07:30 today cannot be earlier than current time (23:52)!" | - |
| Initial Run | `TC-F3-003` | Reject campaign creation with zero or negative capacity | 15/08/2026 | **Pass** | Prevents entering negative or zero values in the Target Capacity field. | - |
| Initial Run | `TC-F3-004` | Successfully filter campaign list by active status | 15/08/2026 | **Pass** | Displays only active donation campaigns as expected. | - |
| Initial Run | `TC-F3-005` | Successfully update campaign capacity | 15/08/2026 | **Pass** | Displays "Campaign updated successfully" toast and persists the new capacity. | - |
| Initial Run | `TC-F3-006` | Successfully view registered donors for a specific campaign | 15/08/2026 | **Pass** | Successfully views the registered donor roster for the selected campaign. | `BUG-013` |
| Initial Run | `TC-F3-007` | Successfully update donor registration status to Checked-in | 15/08/2026 | **Pass** | Updates registration status to Checked-in upon confirmation. | - |
| Initial Run | `TC-F3-008` | Successfully search registered donor by Citizen ID | 15/08/2026 | **Pass** | Donor search by Citizen ID returns accurate matching records. | - |
| Initial Run | `TC-F3-009` | Successfully check-in donor by scanning a valid E-Ticket QR code | 15/08/2026 | **Pass** | Scanning valid QR code checks in the donor successfully. | - |
| Initial Run | `TC-F3-010` | Reject donor check-in with an expired or invalid E-Ticket QR code | 15/08/2026 | **Fail** | Scanning a QR code belonging to a different campaign displays donor info and allows check-in without cross-campaign rejection. | `BUG-005` |
| Initial Run | `TC-F3-011` | Reject campaign creation when required fields are missing | 15/08/2026 | **Pass** | Form submission is blocked and missing required fields are highlighted. | - |
| Initial Run | `TC-F3-012` | Successfully use pagination to view multiple pages of campaigns | 15/08/2026 | **Pass** | Successfully navigates across multiple pages of campaign listings. | - |
| Initial Run | `TC-F3-013` | Reject editing a campaign that has already ended | 15/08/2026 | **Warning** | Timeslot editing is locked, but modifying target blood groups is still unexpectedly permitted. | `BUG-007` |
| Initial Run | `TC-F3-015` | Successfully reject a donor registration | 15/08/2026 | **Pass** | Registration rejection succeeds and status updates to Rejected. | - |
| Initial Run | `TC-F3-016` | Display empty state when searching for non-existent Citizen ID | 15/08/2026 | **Pass** | Displays message: "No screening records match the filter." | - |
| Initial Run | `TC-F3-017` | Successfully update donor registration status to Eligible after passing Clinical Vitals Exam at the Campaign | 15/08/2026 | **Pass** | Status is successfully updated to Eligible following vitals examination. | - |
| Initial Run | `TC-F3-018` | Successfully update donor registration status to Ineligible after failing Clinical Vitals Exam at the Campaign | 15/08/2026 | **Pass** | Status is successfully updated to Ineligible with rejection reason. | - |
| Initial Run | `TC-F3-019` | Successfully update donor registration status to Pass after passing the blood test after the campaign | 15/08/2026 | **Pass** | Status is successfully updated to Pass after post-campaign laboratory testing. | `BUG-018` |
| Initial Run | `TC-F3-020` | Successfully update donor registration status to Fail after failing the blood test after the campaign | 15/08/2026 | **Warning** | Status updates to Fail, but the registration list count erroneously decrements by 1 instead of keeping the record count intact. | `BUG-006` |

---

### 2.4. Feature 4: SOS Request Management (TC-F4)

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Initial Run | `TC-F4-001` | Successful SOS request creation with valid details | 15/08/2026 | **Pass** | Successfully creates an emergency SOS blood request with valid parameters. | - |
| Initial Run | `TC-F4-002` | Reject SOS request creation with missing required blood type | 15/08/2026 | **Pass** | Blood type selection is strictly required by the UI; form cannot be submitted without selecting a blood type. | - |
| Initial Run | `TC-F4-004` | Successfully view the active SOS request dashboard | 15/08/2026 | **Pass** | Active SOS dashboard renders correctly with progress metrics and urgency indicators. | - |
| Initial Run | `TC-F4-005` | Successfully mark an active SOS request as resolved | 15/08/2026 | **Pass** | System automatically marks the request as fulfilled once required units are met. | `BUG-010` |
| Initial Run | `TC-F4-006` | Verify resolved SOS request cannot be marked as resolved again | 15/08/2026 | **Pass** | System auto-locks resolved requests, preventing redundant status transitions. | - |
| Initial Run | `TC-F4-007` | Successfully cancel an active SOS request | 15/08/2026 | **Pass** | Successfully cancels an active SOS broadcast request. | - |
| Initial Run | `TC-F4-009` | Display empty state when generating SOS report for a date range with no data | 15/08/2026 | **Pass** | Displays: "No SOS requests found for the selected criteria." The Export CSV button is dimmed. | - |
| Initial Run | `TC-F4-010` | Reject SOS request creation attempt for a different hospital location | 15/08/2026 | **Pass** | Successfully warns on required fields. (Note: Hospital selection field was not locked initially; Staff at Hospital A could select Hospital B). | - |
| Initial Run | `TC-F4-011` | Verify notification is sent to eligible donors when a new SOS request is created | 15/08/2026 | **Fail** | Matching eligible donor accounts did not receive the expected SOS push notification. | - |
| Initial Run | `TC-F4-012` | Reject SOS request creation if required units is zero or negative | 15/08/2026 | **Pass** | Displays validation notification: "Value must be greater than or equal to 250." | - |
| Initial Run | `TC-F4-013` | Successfully filter SOS requests on the dashboard by blood type | 15/08/2026 | **Pass** | Filters the SOS list accurately by selected blood group. | - |
| Initial Run | `TC-F4-014` | Successfully sort the active SOS request dashboard by urgency | 15/08/2026 | **Pass** | Reorders active SOS requests by urgency level accurately. | - |
| Initial Run | `TC-F4-016` | Verify SOS request automatically expires if not resolved within timeframe | 15/08/2026 | **Pass** | Expired SOS requests automatically transition out of the active broadcast queue. | - |

---

### 2.5. Feature 5: AI Conversational Support (TC-F5)

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Initial Run | `TC-F5-001` | Successfully open chatbot and receive default welcome message | 15/08/2026 | **Pass** | Successfully opens the chatbot widget and receives the standard greeting message. | - |
| Initial Run | `TC-F5-002` | Successfully receive correct eligibility response from chatbot | 15/08/2026 | **Pass** | Returns accurate guidance on blood donation eligibility rules and intervals. | - |
| Initial Run | `TC-F5-003` | Successfully receive location guidance from chatbot | 15/08/2026 | **Fail** | Chatbot returned campaigns in HCMC without identifying specific campaign names, and displayed mismatched event dates/times. | `BUG-003`, `BUG-008` |
| Initial Run | `TC-F5-004` | Verify graceful fallback behavior for irrelevant prompts | 15/08/2026 | **Pass** | Returns a polite domain disclaimer and fallback response for off-topic questions. | - |
| Initial Run | `TC-F5-005` | Successfully maintain conversational context across multiple turns | 15/08/2026 | **Fail** | Chatbot did not retain chat history context and only answered based on generic system data without multi-turn synthesis. | `BUG-004` |
| Initial Run | `TC-F5-006` | Verify chatbot prevents or ignores empty message submission | 15/08/2026 | **Pass** | Send button is disabled for whitespace or empty inputs; no empty bubbles are sent. | - |
| Initial Run | `TC-F5-007` | Verify chat history persistence when closing and reopening the chat window | 15/08/2026 | **Pass** | Active conversation history is preserved when minimizing and reopening the widget. | - |
| Initial Run | `TC-F5-008` | Verify graceful error handling when AI backend times out | 15/08/2026 | **Pass** | Gracefully handles API latency and displays a friendly retry message upon timeout. | - |
| Initial Run | `TC-F5-009` | Successfully route user to booking page when action requested | 15/08/2026 | **Pass** | Provides actionable booking cards and navigation links when appointment scheduling is requested. | - |
| Initial Run | `TC-F5-010` | Verify responsive layout of chatbot UI on mobile viewport | 15/08/2026 | **Fail** | Mobile viewport responsive deployment not yet completed in the testing environment. | - |
| Initial Run | `TC-F5-012` | Verify chatbot sanitizes malicious input safely | 15/08/2026 | **Pass** | Safely sanitizes malicious script payloads (XSS injection) and renders plain text without execution. | - |
| Initial Run | `TC-F5-014` | Verify chatbot displays a typing indicator while fetching a response | 15/08/2026 | **Pass** | Displays animated typing indicator continuously while awaiting backend LLM response. | - |
| Initial Run | `TC-F5-015` | Handle extremely long messages without crashing | 15/08/2026 | **Pass** | Safely truncates/processes messages exceeding 5,000 characters without crashing the UI. | - |

---

## 3. Retest & Verification Log

The table below records all verification retest attempts executed after the development team deployed bug fixes:

| Test Run | Test Case ID | Test Case Name | Execution Date | Status | Actual Result / Verification Notes | Bug ID |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| Retest | `TC-F3-001` | Successful campaign creation with valid details | 16/08/2026 | **Fail** | Campaign created with valid details, but early morning timeslots (02:30–03:30 on 16/08) displayed on 15/08 on the Donor map due to UTC offset. | `BUG-002` |
| Retest | `TC-F3-001` | Successful campaign creation with valid details | 16/08/2026 | **Pass** | Campaign created successfully with valid details; dates and timeslots appear on the correct calendar date on the Map page. | - |
| Retest | `TC-F5-003` | Successfully receive location guidance from chatbot | 16/08/2026 | **Pass** | Chatbot provides comprehensive and accurate campaign details matching user location criteria. | `BUG-003`, `BUG-008` (Resolved) |
| Retest | `TC-F5-005` | Successfully maintain conversational context across multiple turns | 17/08/2026 | **Pass** | Chatbot successfully synthesizes context from prior turns (e.g., body weight and recent tattoo) to provide accurate multi-turn guidance. | `BUG-004` (Resolved) |
| Retest | `TC-F3-010` | Reject donor check-in with an expired or invalid E-Ticket QR code | 15/08/2026 | **Pass** | Successfully rejects QR codes from other campaigns and invalid QR payloads with clear error messages. | `BUG-005` (Resolved) |
| Retest | `TC-F2-015` | Reject appointment cancellation less than 24 hours before scheduled time | 15/08/2026 | **Pass** | Displays message: "Cannot cancel appointment. The cancellation deadline has passed. Cancellations within 24 hours of scheduled time are prohibited." | `BUG-011` (Resolved) |
| Retest | `TC-F2-008` | Reject appointment booking for a fully booked campaign timeslot | 15/08/2026 | **Pass** | Disables fully booked timeslots; prevents proceeding to next step if no slots remain for the chosen date. | `BUG-012` (Resolved) |
| Retest | `TC-F3-020` | Successfully update donor registration status to Fail after failing the blood test after the campaign | 16/08/2026 | **Pass** | Updating blood test status to Fail keeps the registration count intact without decrementing the roster total. | `BUG-006` (Resolved) |
| Retest | `TC-F3-019` | Successfully update donor registration status to Pass after passing the blood test after the campaign | 17/08/2026 | **Pass** | Automatically stocked-in blood bag details display full donor information, correct collection date, and matching campaign name. | `BUG-018` (Resolved) |

---

## 4. Detailed Bug Reports (Defect Tracking)

### 4.1. Bug Summary Table

| Bug ID | Feature | Related Test Case | Bug Title / Summary | Severity | Status |
| :---: | :--- | :---: | :--- | :---: | :---: |
| `BUG-001` | Feature 3: Campaign Management | `TC-F3-001` | Missing `bloodCenterID` association and MongoDB E11000 Duplicate Key Error on `campaignCode` auto-generation | **Critical** | Finished |
| `BUG-002` | Feature 3: Campaign Management | `TC-F3-001` | Timezone offset error shifts early morning campaigns to the previous calendar day on Donor Map | **High** | Finished |
| `BUG-003` | Feature 5: AI Chatbot | `TC-F5-003` | Chatbot fails to retrieve and display active donation campaigns | **High** | Finished |
| `BUG-004` | Feature 5: AI Chatbot | `TC-F5-005` | Chatbot fails to maintain conversational context across multi-turn dialogs | **High** | Finished |
| `BUG-005` | Feature 3: Campaign Management | `TC-F3-010` | QR scanner allows cross-campaign check-in without verifying campaign membership | **Medium** | Finished |
| `BUG-006` | Feature 3: Campaign Management | `TC-F3-020` | Registration list count erroneously decrements by 1 when donor fails post-campaign test | **Medium** | Finished |
| `BUG-007` | Feature 3: Campaign Management | `TC-F3-013` | Completed campaigns still allow modifying priority blood types | **Low** | Finished |
| `BUG-008` | Feature 5: AI Chatbot | `TC-F5-003` | Chatbot displays inaccurate campaign start and end times | **Medium** | Finished |
| `BUG-009` | Feature 1: User Account Management | `TC-F1-015` | White screen crash when clicking Edit Profile on user profile page | **Medium** | Finished |
| `BUG-010` | Feature 4: SOS Request Management | `TC-F4-005` | Fulfilled SOS request displays 0 ml received instead of actual fulfilled quantity | **Medium** | Finished |
| `BUG-011` | Feature 2: Booking & Location Services | `TC-F2-015` | System permits appointment cancellation within 24 hours of scheduled time | **Low** | Finished |
| `BUG-012` | Feature 2: Booking & Location Services | `TC-F2-008` | Appointment booking validates against total campaign target rather than individual timeslot capacity | **Low** | Finished |
| `BUG-013` | Feature 3: Campaign Management | `TC-F3-006` | Donor registration record disappears from campaign roster after quick approval in Pending tab | **High** | Finished |
| `BUG-014` | Notification System | `Notification` | Clicking thank-you notifications incorrectly routes user to `/content` route | **Medium** | Finished |
| `BUG-015` | Feature 2: Booking & Location Services | `TC-F2-008` | Timeslot capacity is not restored when appointments are cancelled or rejected | **High** | Finished |
| `BUG-016` | Feature 3: Campaign & Feature 5: AI Chatbot | `Campaign Timeslot` | Discrepancy between configured timeslot hours and default campaign start/end times | **Low** | Finished |
| `BUG-017` | Feature 2: Booking & Location Services | `TC-F2-014` | Appointment details view automatically jumps back to the latest record every 5 seconds | **High** | Finished |
| `BUG-018` | Feature 3: Campaign Management | `TC-F3-019` | Stocked-in blood unit is not linked to donor record and displays incorrect collection date | **High** | Finished |

---

### 4.2. Bug Details

#### `BUG-001`: Duplicate Key Error during campaignCode generation and missing bloodCenterID

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-001` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-001` |
| **Severity** | **Critical** |
| **Status** | **Finished** |
| **Description** | Failure to attach `bloodCenterID` to new campaigns alongside loose API authorization. Additionally, MongoDB raises an `E11000 Duplicate Key Error` on `campaignCode` auto-generation because the code generation algorithm relies on the total existing document count rather than an atomic sequence counter. |
| **Steps to Reproduce** | 1. Create 176 campaigns.<br>2. Delete several campaigns (total document count decreases to 175).<br>3. Attempt to create a new campaign. |
| **Expected Result** | Generates a unique, non-colliding campaign code (e.g., `CMP-2026-0177`). |
| **Actual Result** | The system counts 175 + 1 = 176, attempting to generate `CMP-2026-176`. Because this code already exists in the database, MongoDB throws a Duplicate Key error and rejects creation. |

---

#### `BUG-002`: Timezone offset error when querying early morning campaigns

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-002` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-001` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | Timezone offset error when querying early morning campaigns. Campaigns with opening hours before 07:00 AM (Vietnam Time, UTC+7) are shifted back by one calendar day when rendered on the Donor booking page. |
| **Steps to Reproduce** | 1. Log in as BloodCenterStaff and create a campaign scheduled for 16/08/2026.<br>2. Configure a timeslot of 01:30–02:30. Creation succeeds.<br>3. Log in as a Donor and navigate to the Booking page.<br>4. Search for donation locations on 16/08/2026, then search on 15/08/2026. |
| **Expected Result** | When filtering by 16/08/2026, the campaign appears correctly on 16/08/2026. |
| **Actual Result** | The campaign does not appear under 16/08/2026. When selecting 15/08/2026, the campaign appears because the backend algorithm evaluates timestamps in UTC rather than local time. |

---

#### `BUG-003`: Chatbot fails to retrieve and display campaign list data

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-003` |
| **Feature** | Feature 5: AI Chatbot |
| **Related Test Case** | `TC-F5-003` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | The AI Chatbot fails to query real-time campaign data and provides no information regarding active donation campaigns. |
| **Steps to Reproduce** | 1. Log in as a Donor.<br>2. Open the Chatbot widget.<br>3. Send query: "Where can I donate blood?"<br>4. Observe the AI response. |
| **Expected Result** | Chatbot displays information for the 3 nearest active donation campaigns. |
| **Actual Result** | Chatbot sends generic information for 3 campaigns accompanied by "Book Now" cards that allow users to navigate to the Booking page. |

---

#### `BUG-004`: Chatbot loses conversational context across multi-turn dialogs

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-004` |
| **Feature** | Feature 5: AI Chatbot |
| **Related Test Case** | `TC-F5-005` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | Chatbot fails to retain conversational context from previous messages across multi-turn dialogs. |
| **Steps to Reproduce** | Execute dialog script:<br>• Turn 1 (User): "I weigh 65kg." -> Turn 1 (Bot): "Weight is eligible for donation..."<br>• Turn 2 (User): "I got a tattoo 2 months ago." -> Turn 2 (Bot): "Ineligible..."<br>• Turn 3 (User): "Can I donate blood now?" |
| **Expected Result** | Chatbot synthesizes multi-turn context and accurately advises that donation is currently deferred due to the recent tattoo. |
| **Actual Result** | Chatbot responds correctly: "Currently, you cannot donate blood yet. Because you recently got a tattoo, according to medical regulations, you need to defer donation for 6 months from the tattooing date to ensure recipient safety." |

---

#### `BUG-005`: QR scanner lacks campaign validation and allows cross-campaign check-in

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-005` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-010` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | QR check-in lacks campaign ID and registration state verification, allowing Staff at Campaign A to scan and check-in a donor registered for Campaign B. |
| **Steps to Reproduce** | 1. Log in as Blood Center Staff.<br>2. Navigate to Campaign Management page.<br>3. Select a completed campaign.<br>4. Click 'Registration List'.<br>5. Click 'Scan QR'.<br>6. Upload QR code image from a different campaign. |
| **Expected Result** | System rejects check-in with an error: "QR code does not belong to this campaign or has been rejected." |
| **Actual Result** | System accepts the QR code and permits check-in for a donor registered under a different campaign. |

---

#### `BUG-006`: Registration list count decrements by 1 when updating test status to Fail

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-006` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-020` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | When staff updates a donor's post-campaign blood test result to Fail during the examination stage, the total registered donor count is erroneously decremented by 1 (-1 slot). |
| **Steps to Reproduce** | 1. Log in as Blood Center Staff.<br>2. Navigate to Campaign Management page.<br>3. Select an active or upcoming campaign.<br>4. Update an eligible donor's status to Failure following lab examination.<br>5. Observe total registration count. |
| **Expected Result** | Total registration count remains unchanged; only the individual donor's status changes to Fail. |
| **Actual Result** | Total registration count decrements by 1. |

---

#### `BUG-007`: Completed campaigns still allow modifying priority blood types

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-007` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-013` |
| **Severity** | **Low** |
| **Status** | **Finished** |
| **Description** | When editing an ended campaign (`endDateTime` in the past or status Completed/Cancelled), the system locks timeslots but still permits modifying priority blood types and submitting updates. Backend lacks validation to reject updates on ended campaigns. |
| **Steps to Reproduce** | 1. Log in as Blood Center Staff.<br>2. Navigate to Campaign Management page.<br>3. Select a Completed campaign.<br>4. Click 'Edit Information'.<br>5. Modify priority blood types and save. |
| **Expected Result** | The Edit button is disabled, or backend returns a business validation error preventing updates to completed campaigns. |
| **Actual Result** | Timeslot editing is disabled, but modifying and saving priority blood types is permitted. |

---

#### `BUG-008`: Chatbot displays incorrect campaign start and end times

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-008` |
| **Feature** | Feature 5: AI Chatbot |
| **Related Test Case** | `TC-F5-003` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | Chatbot successfully retrieves campaign data but outputs start and end timestamps that differ from the actual campaign schedules. |
| **Steps to Reproduce** | 1. Log in as a Donor.<br>2. Open Chatbot Widget.<br>3. Send query: "Where can I donate blood?"<br>4. Compare returned campaign hours with database records. |
| **Expected Result** | Returns exact start and end operating hours for all suggested campaigns. |
| **Actual Result** | Information for 3 campaigns is returned, but the rendered start and end times are inaccurate. |

---

#### `BUG-009`: White screen crash when editing phone number or address on Profile page

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-009` |
| **Feature** | Feature 1: User Account Management |
| **Related Test Case** | `TC-F1-015` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | Application crashes into an unhandled blank white screen when clicking the Edit button on the User Profile page to update contact details. |
| **Steps to Reproduce** | 1. Log in as a Donor.<br>2. Navigate to 'User Profile' page.<br>3. Click 'Edit Profile'. |
| **Expected Result** | Profile form enters edit mode, allowing modification of current address and phone number without UI crashes. |
| **Actual Result** | A blank white screen crash occurs. |

---

#### `BUG-010`: Fulfilled SOS request displays 0 ml received instead of actual fulfilled quantity

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-010` |
| **Feature** | Feature 4: SOS Request Management |
| **Related Test Case** | `TC-F4-005` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | When an SOS request is fulfilled, the received volume is not properly persisted in the database, causing historical fulfilled requests to display 0 ml received despite status being Fulfilled. |
| **Steps to Reproduce** | 1. Log in as Hospital Administrator.<br>2. Navigate to SOS Request history.<br>3. Inspect a fulfilled SOS request. |
| **Expected Result** | Fulfilled SOS request displays status as Fulfilled along with the full required blood volume received. |
| **Actual Result** | Status displays Fulfilled, but collected volume shows 0 ml received. |

---

#### `BUG-011`: System allows appointment cancellation within 24 hours of scheduled time

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-011` |
| **Feature** | Feature 2: Booking & Location Services |
| **Related Test Case** | `TC-F2-015` |
| **Severity** | **Low** |
| **Status** | **Finished** |
| **Description** | System permits donors to cancel scheduled appointments less than 24 hours prior to the timeslot, violating the cancellation deadline business rule. |
| **Steps to Reproduce** | 1. Log in as a Donor with an appointment scheduled within 24 hours.<br>2. Navigate to 'My Appointments' page.<br>3. Click 'Cancel Appointment' and confirm. |
| **Expected Result** | Cancellation is rejected with message: "Cannot cancel appointment. The cancellation deadline has passed. Cancellations within 24 hours of scheduled time are prohibited." |
| **Actual Result** | Appointment cancellation succeeds and status changes to Cancelled. |

---

#### `BUG-012`: Appointment booking checks overall campaign target instead of timeslot capacity

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-012` |
| **Feature** | Feature 2: Booking & Location Services |
| **Related Test Case** | `TC-F2-008` |
| **Severity** | **Low** |
| **Status** | **Finished** |
| **Description** | When a donor books an appointment, the system evaluates capacity against the total campaign target rather than the specific timeslot capacity, allowing overbooking in full timeslots. |
| **Steps to Reproduce** | 1. Log in as a Donor.<br>2. Select a timeslot that has already reached its maximum capacity while overall campaign capacity remains.<br>3. Submit the booking. |
| **Expected Result** | System rejects booking with error: "Timeslot is full. The selected timeslot has reached maximum capacity. Please choose another timeslot." |
| **Actual Result** | Booking succeeds despite timeslot being full; rejection only triggers when overall campaign target is reached. |

---

#### `BUG-013`: Donor registration record disappears after quick approval in Pending tab

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-013` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-006` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | When staff approves a donor from the global 'Pending Approvals' tab, the approved registration record disappears from the specific campaign's registration list view upon returning. |
| **Steps to Reproduce** | 1. Donor registers for a campaign on 23/08/2026.<br>2. Blood Center verifies the campaign roster and confirms record is in Pending status.<br>3. Staff navigates to global 'Pending Approvals' tab and approves the registration.<br>4. Staff returns to the campaign's detail page to check-in the donor.<br>5. (Observation: Donor has valid QR and can be checked in via QR scan, but record is absent from campaign management table). |
| **Expected Result** | The approved registration record remains visible in the campaign's registration table with status updated to Verified. |
| **Actual Result** | The record disappears from the campaign's registration list view. |

---

#### `BUG-014`: Clicking thank-you notifications redirects incorrectly to /content route

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-014` |
| **Feature** | Notification System |
| **Related Test Case** | `Notification` |
| **Severity** | **Medium** |
| **Status** | **Finished** |
| **Description** | Clicking post-donation thank-you notifications in the notification drawer erroneously redirects the user to the `/content` route. |
| **Steps to Reproduce** | 1. Log in as a Donor with completed donations.<br>2. Open Notification drawer.<br>3. Click on a thank-you notification. |
| **Expected Result** | Displays notification detail modal or redirects to Donation History page. |
| **Actual Result** | Browser navigates to `/content` route. |

---

#### `BUG-015`: Timeslot capacity is not restored upon donor cancellation or staff rejection

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-015` |
| **Feature** | Feature 2: Booking & Location Services |
| **Related Test Case** | `TC-F2-008` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | When an appointment is cancelled by a donor or rejected by staff during online screening/on-site exam, the booked capacity slot is not restored (+1 available slot), causing capacity to continually decrease. |
| **Steps to Reproduce** | 1. Note available slots before booking (e.g., 241/250).<br>2. Book an appointment (slots decrease to 240/250).<br>3. Staff rejects the screening form before the event.<br>4. Alternatively, donor cancels the appointment, or vitals exam marks donor as ineligible.<br>5. Check available slots on the booking interface. |
| **Expected Result** | Slot capacity is restored (+1 available slot) upon cancellation, screening rejection, or ineligibility determination. |
| **Actual Result** | Slot is not restored; capacity count remains decremented at 240/250. |

---

#### `BUG-016`: Discrepancy between configured timeslot hours and default campaign start/end time

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-016` |
| **Feature** | Feature 3: Campaign & Feature 5: AI Chatbot |
| **Related Test Case** | `Campaign Timeslot` |
| **Severity** | **Low** |
| **Status** | **Finished** |
| **Description** | When creating a campaign, the form automatically pre-fills default start/end hours (e.g., 08:30–18:30) for campaign date bounds, causing a discrepancy with actual customized timeslots (e.g., 01:30–11:30). |
| **Steps to Reproduce** | 1. Log in as Blood Center Staff.<br>2. Create a new campaign with custom timeslots per day.<br>3. Open campaign details view after creation. |
| **Expected Result** | Campaign operating hours match the earliest start timeslot and latest end timeslot configured. |
| **Actual Result** | Operating hours display default hours (08:30–18:30), conflicting with actual configured timeslots. |

---

#### `BUG-017`: Appointment details view automatically jumps to the latest record every 5 seconds

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-017` |
| **Feature** | Feature 2: Booking & Location Services |
| **Related Test Case** | `TC-F2-014` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | When viewing details of a completed appointment on the 'My Appointments' page, the detail panel automatically resets and jumps back to the top/latest appointment every 5 seconds due to a background polling interval. |
| **Steps to Reproduce** | 1. Log in as a Donor with multiple historical appointments.<br>2. Navigate to 'My Appointments' page.<br>3. Click on an older completed appointment to view details.<br>4. Wait 5 seconds. |
| **Expected Result** | Selected appointment details remain active until the user explicitly selects a different appointment. |
| **Actual Result** | View automatically jumps back to the top/first appointment every 5 seconds. |

---

#### `BUG-018`: Stocked-in blood unit is not linked to donor record and displays incorrect collection date

| Field | Details |
| :--- | :--- |
| **Bug ID** | `BUG-018` |
| **Feature** | Feature 3: Campaign Management |
| **Related Test Case** | `TC-F3-019` |
| **Severity** | **High** |
| **Status** | **Finished** |
| **Description** | After marking a donor's blood test as Pass, the collected blood bag is stocked into inventory but lacks association with the donor record, displays an incorrect collection date, and mismatches the campaign name. |
| **Steps to Reproduce** | 1. Log in as Blood Center Staff.<br>2. Review and approve donor registration.<br>3. Perform on-site examination, enter required vitals, and select 'Pass' before reaching Completed.<br>4. Navigate to Blood Inventory Management page.<br>5. Click to view details of the newly auto-stocked blood bag. |
| **Expected Result** | Complete details of the blood donor, accurate collection date, and originating campaign are fully displayed. |
| **Actual Result** | Blood bag details are missing associated donor information and campaign details. |
