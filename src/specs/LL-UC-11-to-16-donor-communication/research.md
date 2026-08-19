# Research & Technical Decisions: Notification & News Feed

## Real-time Notifications
- **Decision**: Evaluate between Polling (30s) vs WebSockets. 
- **Notes**: WebSockets provide instant updates but require more infrastructure (Socket.io/WS server). Polling is simpler to implement initially. Recommend starting with SWR/React Query polling, and upgrading to WebSockets if server load becomes an issue.

## Background Jobs
- **Technology**: BullMQ with Redis.
- **Reason**: Excellent support for delayed jobs, exponential backoff, and retries which is critical for email/push notification delivery.

## Rich Text Editor
- **Technology**: TipTap or Slate.js.
- **Notes**: TipTap offers a great headless API for React, making it easier to integrate with our custom UI components.

## Search
- **Technology**: MongoDB Atlas Search or Meilisearch.
- **Notes**: For the News Feed and Article search, MongoDB Atlas Search is the easiest to integrate if we are already using MongoDB, avoiding the need for an external search service.
