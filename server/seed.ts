import { db } from "./db";
import { conversations, messages, users } from "@shared/schema";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  let userId: string;
  
  if (existingUsers.length === 0) {
    const [user] = await db.insert(users).values({
      email: "demo@example.com",
      password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
      firstName: "Demo",
      lastName: "User"
    }).returning();
    userId = user.id;
  } else {
    userId = existingUsers[0].id;
  }

  const existingConversations = await db.select().from(conversations);
  if (existingConversations.length === 0) {
    const [convo1] = await db.insert(conversations).values({ userId, title: "Introduction to Biology" }).returning();
    await db.insert(messages).values([
      { conversationId: convo1.id, role: "user", content: "What is photosynthesis?" },
      { conversationId: convo1.id, role: "assistant", content: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. \n\nThe general equation is:\n\n`6CO2 + 6H2O + light energy -> C6H12O6 + 6O2`" }
    ]);

    const [convo2] = await db.insert(conversations).values({ userId, title: "History: The Renaissance" }).returning();
    await db.insert(messages).values([
      { conversationId: convo2.id, role: "user", content: "Who were the key figures of the Renaissance?" },
      { conversationId: convo2.id, role: "assistant", content: "Key figures of the Renaissance include:\n\n*   **Leonardo da Vinci:** Artist, scientist, inventor (Mona Lisa, The Last Supper).\n*   **Michelangelo:** Sculptor, painter, architect (David, Sistine Chapel ceiling).\n*   **Raphael:** Painter and architect (The School of Athens)." }
    ]);
  }
}
