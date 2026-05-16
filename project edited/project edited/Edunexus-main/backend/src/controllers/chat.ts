import { type Request, type Response } from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// @desc    Chat with AI Assistant
// @route   POST /api/chat
// @access  Private (All authenticated users)
export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const user = (req as any).user;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY") {
      // Fallback: Return a helpful static response when no API key
      return res.json({
        reply: getFallbackResponse(message),
        source: "fallback",
      });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    // Build conversation context
    const systemPrompt = `You are Edunexus Assistant, a friendly and helpful AI chatbot for the Edunexus Learning Management System (LMS).

ABOUT EDUNEXUS:
- Edunexus is a school management platform for students, teachers, parents, and administrators.
- Features: Dashboard, Timetable, Exams/Quizzes (AI-generated), Assignments, Attendance, Materials, and User Management.

CURRENT USER:
- Name: ${user.name}
- Role: ${user.role}

YOUR BEHAVIOR:
1. Answer questions about how to use the Edunexus platform.
2. Help with academic questions if asked (math, science, history, etc.).
3. Be concise but friendly. Use bullet points for multi-step instructions.
4. If you don't know something specific about the platform, suggest the user check the relevant section or contact an admin.
5. Always respond in the same language the user writes in.
6. Keep responses under 300 words.`;

    // Build history for context (last 6 messages max)
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const conversationContext = recentHistory
      .map((h: any) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`;

    const { text } = await generateText({
      prompt: fullPrompt,
      model: google("gemini-1.5-flash"),
    });

    res.json({ reply: text.trim(), source: "ai" });
  } catch (error: any) {
    console.error("Chat AI Error:", error.message);
    res.json({
      reply: "Sorry, I'm having trouble right now. Please try again in a moment.",
      source: "error",
    });
  }
};

// Fallback responses when no API key is available
function getFallbackResponse(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("timetable") || msg.includes("schedule") || msg.includes("جدول")) {
    return "📅 **Timetable**: Go to the **Timetable** section from the sidebar. Select your class and academic year, then click **Generate with AI** to create a schedule automatically!";
  }
  if (msg.includes("exam") || msg.includes("quiz") || msg.includes("امتحان") || msg.includes("اختبار")) {
    return "📝 **Exams & Quizzes**: Navigate to **LMS → Exams**. Teachers can click **New AI Quiz** to generate questions automatically. Students can view and take active quizzes from the same page.";
  }
  if (msg.includes("assignment") || msg.includes("واجب")) {
    return "📋 **Assignments**: Go to **LMS → Assignments**. Teachers can create new assignments, and students can submit their work by clicking on an assignment and adding their submission link.";
  }
  if (msg.includes("attendance") || msg.includes("حضور")) {
    return "✅ **Attendance**: Teachers can mark attendance from the **Attendance** section. Select your class to see the student list and mark Present, Late, or Absent for each student.";
  }
  if (msg.includes("material") || msg.includes("مادة") || msg.includes("مواد")) {
    return "📚 **Materials**: Go to **LMS → Materials** to upload or view learning resources. Teachers can add videos, PDFs, and links for their classes.";
  }
  if (msg.includes("register") || msg.includes("account") || msg.includes("تسجيل") || msg.includes("حساب")) {
    return "👤 **Account**: To create an account, go to the **Register** page. Choose your role (Student, Teacher, or Parent) and fill in your details.";
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("مرحبا") || msg.includes("السلام")) {
    return "👋 Hello! I'm the Edunexus Assistant. I can help you with:\n\n• Navigating the platform\n• Understanding features (Timetable, Exams, Assignments, etc.)\n• Answering academic questions\n\nWhat would you like to know?";
  }

  return "👋 I'm the Edunexus Assistant! I can help you with:\n\n• **Timetable** — View or generate schedules\n• **Exams** — Take quizzes or generate AI questions\n• **Assignments** — Submit or manage homework\n• **Attendance** — Check or mark attendance\n• **Materials** — Access learning resources\n\nJust ask me about any of these topics!";
}
