import Groq from "groq-sdk";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { isAuthenticated } from "../../auth";
import type { Express, Request, Response } from "express";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type IncomingAttachment = {
  id: string;
  name: string;
  mimeType: string;
  type: "image" | "pdf" | "text";
  dataUrl?: string;
  extractedText?: string;
};

const SYSTEM_PROMPT = `You are an expert educational AI tutor.
Use clear markdown with short sections and practical examples.
For comparisons, include a table.
If attached content is present, prioritize it and quote key points before concluding.`;

function buildAttachmentInstruction(attachments: IncomingAttachment[]): string | null {
  if (attachments.length === 0) return null;

  const names = attachments.map((a) => a.name).join(", ");
  return `Attachments are included in this turn: ${names}.
You must answer primarily from the attached content.
If attachment text is missing or unclear, say that explicitly and ask the user for clearer text/pages.`;
}

function normalizeAttachments(value: unknown): IncomingAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is IncomingAttachment => {
      return Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as any).id === "string" &&
          typeof (item as any).name === "string" &&
          typeof (item as any).mimeType === "string" &&
          typeof (item as any).type === "string",
      );
    })
    .slice(0, 5);
}

function parseIdParam(idParam: string | string[] | undefined): number {
  const raw = Array.isArray(idParam) ? idParam[0] : idParam;
  return Number(raw);
}

function cleanTitleSeed(input: string): string {
  return input
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, " ")
    .replace(/[#>*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAutoTitle(content: string, attachments: IncomingAttachment[]): string {
  const textAttachment = attachments.find((a) => a.extractedText?.trim());
  const seed = cleanTitleSeed(textAttachment?.extractedText || content);
  if (!seed) return "New Chat";
  const words = seed.split(" ").slice(0, 8).join(" ");
  return words.length > 60 ? `${words.slice(0, 57)}...` : words;
}

function buildPersistedUserMessage(content: string, attachments: IncomingAttachment[]): string {
  const sections: string[] = [content.trim()];

  const textAttachments = attachments.filter(
    (a) => (a.type === "pdf" || a.type === "text") && a.extractedText?.trim(),
  );

  if (textAttachments.length > 0) {
    sections.push("\nAttached file excerpts:");
    for (const att of textAttachments) {
      const excerpt = att.extractedText!.slice(0, 12000);
      sections.push(`\n[${att.name}]\n${excerpt}`);
    }
  }

  const imageNames = attachments.filter((a) => a.type === "image").map((a) => a.name);
  if (imageNames.length > 0) {
    sections.push(`\nAttached images: ${imageNames.join(", ")}`);
  }

  return sections.join("\n").trim();
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const userId = (req.user as any).id;
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const userId = (req.user as any).id;
      const conversation = await chatStorage.createConversation(userId, title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const userId = (req.user as any).id;
      await chatStorage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      const userId = (req.user as any).id;
      const content = String(req.body?.content || "").trim();
      const attachments = normalizeAttachments(req.body?.attachments);

      if (!conversationId || Number.isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation id" });
      }
      if (!content && attachments.length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.title === "New Chat") {
        const autoTitle = buildAutoTitle(content, attachments);
        if (autoTitle && autoTitle !== "New Chat") {
          await chatStorage.updateConversationTitle(conversationId, userId, autoTitle);
        }
      }

      const persistedUserMessage = buildPersistedUserMessage(content, attachments);
      await chatStorage.createMessage(conversationId, "user", persistedUserMessage);

      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const imageAttachments = attachments.filter((a) => a.type === "image" && a.dataUrl);
      const canUseVision = imageAttachments.length > 0 && Boolean(process.env.OPENAI_API_KEY);
      const attachmentInstruction = buildAttachmentInstruction(attachments);

      let fullResponse = "";

      if (canUseVision) {
        const historyWithoutCurrent = chatMessages.slice(0, -1);
        const userParts: any[] = [];

        userParts.push({ type: "text", text: persistedUserMessage });
        for (const image of imageAttachments) {
          userParts.push({
            type: "image_url",
            image_url: { url: image.dataUrl },
          });
        }

        const openAiMessages: any[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...(attachmentInstruction ? [{ role: "system", content: attachmentInstruction }] : []),
          ...historyWithoutCurrent,
          { role: "user", content: userParts },
        ];

        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: openAiMessages,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (!delta) continue;
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      } else {
        const stream = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...(attachmentInstruction ? [{ role: "system", content: attachmentInstruction }] : []),
            ...chatMessages,
          ],
          model: "llama-3.3-70b-versatile",
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (!delta) continue;
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
