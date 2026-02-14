import { User } from "../models/User";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";

const SEED_USERS = [
  { name: "Alice Johnson", email: "alice@example.com", age: 28 },
  { name: "Bob Smith", email: "bob@example.com", age: 32 },
  { name: "Charlie Brown", email: "charlie@example.com", age: 25 },
  { name: "Diana Prince", email: "diana@example.com", age: 30 },
  { name: "Eve Wilson", email: "eve@example.com", age: 27 },
];

const SEED_CHAT_NAMES = ["General Chat", "Project Team", "Random"];

const SEED_MESSAGES = [
  "Hello everyone! Welcome to the chat.",
  "Hey! Good to be here.",
  "Let's get started with the project.",
  "I've added the initial setup. Please review.",
  "Looks good to me!",
  "We have a meeting at 3 PM today.",
  "Thanks for the update.",
  "No problem. Let me know if you need anything.",
  "Has anyone checked the latest build?",
  "I'll run the tests now.",
];

export const seedDatabase = async (): Promise<void> => {
  const seedEnabled = process.env.SEED_ON_STARTUP !== "false";

  if (!seedEnabled) {
    console.log("⏭️  Seed disabled (SEED_ON_STARTUP=false)");
    return;
  }

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`⏭️  Seed skipped - database already has ${userCount} users`);
      return;
    }

    console.log("🌱 Seeding database...");

    const users = await User.insertMany(SEED_USERS);
    console.log(`   ✅ Created ${users.length} users`);

    const chat1 = await Chat.create({
      name: SEED_CHAT_NAMES[0],
      participants: [users[0]._id, users[1]._id, users[2]._id],
      createdBy: users[0]._id,
    });

    const chat2 = await Chat.create({
      name: SEED_CHAT_NAMES[1],
      participants: [users[1]._id, users[2]._id, users[3]._id],
      createdBy: users[1]._id,
    });

    const chat3 = await Chat.create({
      name: SEED_CHAT_NAMES[2],
      participants: [users[0]._id, users[4]._id],
      createdBy: users[0]._id,
    });

    console.log(`   ✅ Created 3 chats`);

    const chats = [chat1, chat2, chat3];
    let messageCount = 0;

    for (let i = 0; i < 10; i++) {
      const chat = chats[i % chats.length];
      const sender = users[i % users.length];
      await Message.create({
        chatId: chat._id,
        senderId: sender._id,
        content: SEED_MESSAGES[i],
        attachments: [],
      });
      messageCount++;
    }

    console.log(`   ✅ Created ${messageCount} messages`);

    console.log("✅ Seed completed successfully!");
    console.log("   Users:   GET /api/users");
    console.log("   Chats:   GET /api/chats?userId=<user_id>");
    console.log("   Messages: GET /api/chats/<chat_id>/messages");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
};
