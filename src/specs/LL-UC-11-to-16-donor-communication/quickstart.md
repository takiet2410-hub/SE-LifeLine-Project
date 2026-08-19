# Quickstart: Notification & News Feed

## Prerequisites
- Redis server running (for BullMQ).
- MongoDB instance.

## Testing Notifications Locally
1. Start the backend server and ensure the BullMQ worker is active.
2. Hit the `POST /api/v1/notifications/send` endpoint directly using Postman to simulate a domain event.
3. Open the Donor Portal frontend and observe the notification badge update.

## Testing Article Pipeline
1. Log in to the Blood Center portal.
2. Create a new article with a thumbnail.
3. Click Publish and monitor the `PipelineStatusIndicator` for state transitions.
4. Open the Public News Feed page to verify the article appears.
