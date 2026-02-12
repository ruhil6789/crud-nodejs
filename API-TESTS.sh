#!/bin/bash
# API Test Script - Run with: bash API-TESTS.sh
# Make sure the server is running: npm run dev

BASE_URL="http://localhost:3002"

echo "=== 1. Health Check ==="
curl -s $BASE_URL/health | jq .

echo -e "\n=== 2. Create User (Alice) ==="
ALICE=$(curl -s -X POST $BASE_URL/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","age":25}')
echo $ALICE | jq .
ALICE_ID=$(echo $ALICE | jq -r '.data._id')
echo "Alice ID: $ALICE_ID"

echo -e "\n=== 3. Create User (Bob) ==="
BOB=$(curl -s -X POST $BASE_URL/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com","age":30}')
echo $BOB | jq .
BOB_ID=$(echo $BOB | jq -r '.data._id')
echo "Bob ID: $BOB_ID"

echo -e "\n=== 4. Get All Users ==="
curl -s $BASE_URL/api/users | jq .

echo -e "\n=== 5. Get User by ID ==="
curl -s $BASE_URL/api/users/$ALICE_ID | jq .

echo -e "\n=== 6. Create Chat ==="
CHAT=$(curl -s -X POST "$BASE_URL/api/chats?userId=$ALICE_ID" \
  -H "Content-Type: application/json" \
  -d "{\"participants\":[\"$ALICE_ID\",\"$BOB_ID\"],\"name\":\"Alice & Bob\"}")
echo $CHAT | jq .
CHAT_ID=$(echo $CHAT | jq -r '.data.chatId')
echo "Chat ID: $CHAT_ID"

echo -e "\n=== 7. Get User's Chats ==="
curl -s "$BASE_URL/api/chats?userId=$ALICE_ID" | jq .

echo -e "\n=== 8. Get Chat by ID ==="
curl -s $BASE_URL/api/chats/$CHAT_ID | jq .

echo -e "\n=== 9. Get Chat Messages ==="
curl -s "$BASE_URL/api/chats/$CHAT_ID/messages?limit=20" | jq .

echo -e "\n=== 10. Update User ==="
curl -s -X PUT $BASE_URL/api/users/$ALICE_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","email":"alice@test.com","age":26}' | jq .

echo -e "\n=== 11. Upload Attachment ==="
echo "test content" > /tmp/test-upload.txt
curl -s -X POST $BASE_URL/api/attachments \
  -F "file=@/tmp/test-upload.txt" \
  -F "userId=$ALICE_ID" \
  -F "deviceId=curl-test" | jq .

echo -e "\n=== 12. Delete User (optional - uncomment to test) ==="
# curl -s -X DELETE $BASE_URL/api/users/$BOB_ID | jq .

echo -e "\n=== Done! ==="
echo "Use these IDs for WebSocket testing:"
echo "  Alice: $ALICE_ID"
echo "  Bob:   $BOB_ID"
echo "  Chat:  $CHAT_ID"
echo "  Test WebSocket at: $BASE_URL/chat"
