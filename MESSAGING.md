# WhatsApp-like Messaging System

This document describes the messaging system implementation based on the system design for a WhatsApp-like chat application.

## Features Implemented

- ✅ **Group chats** with 2-100 participants
- ✅ **Send/receive messages** in real-time via WebSocket
- ✅ **Offline message delivery** (up to 30 days via Inbox)
- ✅ **Media attachments** via HTTP upload
- ✅ **Multiple clients** per user (devices)
- ✅ **Message acknowledgments** (ack) for delivery confirmation
- ✅ **Redis pub/sub** for scaling across multiple Chat Servers
- ✅ **TTL** on messages and inbox (30-day retention)

## Architecture

### Core Entities

- **User** - Account (from existing users API)
- **Chat** - Group with 2-100 participants
- **Message** - Text + attachments, stored in MongoDB
- **Client** - Device/session for a user (multiple per user)
- **Inbox** - Undelivered messages per client (TTL 30 days)

### WebSocket API

Connect with authentication:

```javascript
const socket = io("http://localhost:3002", {
  auth: {
    userId: "<mongodb-user-objectid>",
    deviceId: "web-client" // optional
  }
});
```

#### Commands (Client → Server)

| Command | Payload | Response |
|---------|---------|----------|
| `createChat` | `{ participants: string[], name?: string }` | `{ chatId: string }` |
| `sendMessage` | `{ chatId: string, message: string, attachments?: string[] }` | `"SUCCESS" \| "FAILURE"` |
| `ack` | `{ messageId: string }` | `"RECEIVED"` |
| `modifyChatParticipants` | `{ chatId: string, userId: string, operation: "ADD" \| "REMOVE" }` | `"SUCCESS" \| "FAILURE"` |
| `getUndeliveredMessages` | `{}` | `{ count: number }` |

#### Events (Server → Client)

| Event | Payload |
|-------|---------|
| `chatUpdate` | `{ chatId, participants }` |
| `newMessage` | `{ chatId, messageId, userId, message, attachments, createdAt }` |
| `messageSent` | Same as newMessage (echo to sender) |
| `ackReceived` | `{ messageId }` |
| `error` | `{ type, message }` |

### HTTP API

#### Chats

- `POST /api/chats` - Create chat
  - Body: `{ participants: string[], name?: string }`
  - Query: `userId` (required)
- `GET /api/chats?userId=<id>` - Get user's chats
- `GET /api/chats/:id` - Get chat by ID
- `GET /api/chats/:id/messages?limit=50&before=<date>` - Get messages
- `PUT /api/chats/:id/participants` - Add/remove participant
  - Body: `{ userId: string, operation: "ADD" \| "REMOVE" }`

#### Attachments

- `POST /api/attachments` - Upload file
  - Form: `file` (required), `userId` (required), `deviceId` (optional)
  - Response: `{ attachmentId, url, mimeType, size }`

### Flow

1. **Create user** (existing API): `POST /api/users` → get `userId`
2. **Connect WebSocket** with `userId` and optional `deviceId`
3. **Create chat**: `createChat({ participants: [userId1, userId2], name })`
4. **Send message**: `sendMessage({ chatId, message, attachments })`
5. **Offline delivery**: When client connects, call `getUndeliveredMessages` or server can push on connect (future enhancement)
6. **Ack**: Client sends `ack({ messageId })` after displaying message

### Scaling

- **Redis Adapter**: Socket.io uses Redis pub/sub to broadcast across multiple server instances
- **Inbox per client**: Supports multiple devices per user
- **TTL**: Messages and Inbox entries auto-expire after 30 days (MongoDB TTL index)

### Test Client

Open `http://localhost:3002/chat` for a simple WebSocket test UI.

1. Create a user: `curl -X POST http://localhost:3002/api/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com"}'`
2. Get the `_id` from the response
3. Connect in the test client with that ID
4. Create another user for testing 1:1 chat
5. Create chat with both user IDs
6. Send messages
