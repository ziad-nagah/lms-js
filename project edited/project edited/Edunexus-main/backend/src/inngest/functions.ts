import type _class from "../models/class.ts";
import { inngest } from "./index.ts";
import Class from "../models/class.ts";
import User from "../models/user.ts";
import Timetable from "../models/timetable.ts";
import Exam from "../models/exam.ts";
import Submission from "../models/submission.ts";

import { NonRetriableError } from "inngest";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

interface GenSettings {
  startTime: string;
  endTime: string;
  periods: number;
}

// Your new function:
export const generateTimeTable = inngest.createFunction(
  { id: "Generate-Timetable", retries: 2 },
  { event: "generate/timetable" }, //name
  async ({ event, step }) => {
    const { classId, academicYearId, settings } = event.data as {
      classId: string;
      academicYearId: string;
      settings: GenSettings;
    };

    const contextData = await step.run("fetch-class-context", async () => {
      // fetch class
      const classData = await Class.findById(classId).populate("subjects");
      if (!classData) throw new NonRetriableError("Class not found");

      // fetch teachers
      const allTeacher = await User.find({ role: "teacher" });

      // filter qualified teachers for class subjects
      const classSubjectsIds = classData.subjects.map((sub) =>
        sub._id.toString()
      );

      const qualifiedTeachers = allTeacher
        .filter((teacher) => {
          if (!teacher.teacherSubject) return false;
          return teacher.teacherSubject.some((subId) =>
            classSubjectsIds.includes(subId.toString())
          );
        })
        .map((tea) => ({
          id: tea._id,
          name: tea.name,
          subjects: tea.teacherSubject,
        }));

      const subjectsPayload = classData.subjects.map((sub: any) => ({
        id: sub._id,
        name: sub.name,
        code: sub.code,
      }));

      // here we should check if we have teachers and subjects
      if (subjectsPayload.length === 0 || qualifiedTeachers.length === 0)
        throw new NonRetriableError(
          "No Subjects or Teachers assigned to these class"
        );

      return {
        className: classData.name,
        subjects: subjectsPayload,
        teachers: qualifiedTeachers,
      };
    });

    // generate timetable logic would go here
    const aiSchedule = await step.run("generate-timetable-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      // Fallback for missing/placeholder API key
      if (!apiKey || apiKey === "YOUR_API_KEY") {
        console.log("No valid API key found. Using fallback mock timetable generator.");
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const mockSchedule = days.map((day) => {
          const periods = [];
          for (let i = 1; i <= settings.periods; i++) {
            // Assign a random subject/teacher from context
            const subject = contextData.subjects[i % contextData.subjects.length];
            const teacher = contextData.teachers[i % contextData.teachers.length];
            
            // Very simplified time calculation
            const startHour = parseInt(settings.startTime.split(":")[0]) + (i - 1);
            const endHour = startHour + 1;
            
            periods.push({
              subject: subject.id,
              teacher: teacher?.id || null, // Might be null if no qualified teacher
              startTime: `${startHour.toString().padStart(2, "0")}:00`,
              endTime: `${endHour.toString().padStart(2, "0")}:00`
            });
          }
          return { day, periods };
        });
        
        return mockSchedule;
      }

      const allTimetables = await Timetable.find({
        academicYear: academicYearId,
      }).limit(10); // Limit context size

      const prompt = `
        You are an expert school scheduler. Generate a balanced weekly timetable (Monday to Friday) for the class "${contextData.className}".
        
        AVAILABLE RESOURCES:
        - Subjects: ${JSON.stringify(contextData.subjects)}
        - Qualified Teachers: ${JSON.stringify(contextData.teachers)}
        - Constraints (Existing schedules to avoid clashes): ${JSON.stringify(allTimetables)}

        DAILY SETTINGS:
        - Start: ${settings.startTime}
        - End: ${settings.endTime}
        - Periods: ${settings.periods}

        STRICT RULES:
        1. Every period MUST have a subject and a qualified teacher (Teacher must teach that subject).
        2. Distribute subjects evenly across the week.
        3. Break: 15 min after period 2.
        4. Lunch: 45 min after period 4.
        5. Ensure no teacher is assigned to two different classes at the same time.
        6. Output ONLY a valid JSON object. No conversational text or markdown blocks.
        
        JSON SCHEMA:
        {
          "schedule": [
            {
              "day": "Monday",
              "periods": [
                { 
                  "subject": "ID", 
                  "teacher": "ID", 
                  "startTime": "HH:MM", 
                  "endTime": "HH:MM"
                }
              ]
            }
          ]
        }
      `;

      const google = createGoogleGenerativeAI({ apiKey });
      const { text } = await generateText({
        prompt,
        model: google("gemini-1.5-flash"),
      });

      console.log("AI Response for Timetable:", text);

      // Robust JSON extraction
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI failed to return valid JSON for timetable");
      }
      
      return JSON.parse(jsonMatch[0]);
    });

    // now let save
    await step.run("save-timetable", async () => {
      console.log("Saving generated timetable for class:", classId);
      await Timetable.findOneAndDelete({
        class: classId,
        academicYear: academicYearId,
      });
      
      const newTimetable = await Timetable.create({
        class: classId,
        academicYear: academicYearId,
        schedule: aiSchedule.schedule,
      });

      return { success: true, id: newTimetable._id };
    });
    return { message: "Timetable generated successfully" };
  }
);

// Your new function:
export const generateExam = inngest.createFunction(
  { id: "Generate-Exam", retries: 2 },
  { event: "exam/generate" }, //name
  async ({ event, step }) => {
    const { examId, topic, subjectName, difficulty, count } = event.data;

    // generate timetable logic would go here
    const aiExam = await step.run("generate-exam-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      // Fallback for missing/placeholder API key
      if (!apiKey || apiKey === "YOUR_API_KEY") {
        console.log("No valid API key found. Using fallback mock exam generator.");
        const mockQuestions = [];
        for (let i = 1; i <= count; i++) {
          mockQuestions.push({
            questionText: `Mock Question ${i} about ${topic} (${difficulty} level)`,
            type: "MCQ",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            points: 1
          });
        }
        return mockQuestions;
      }

      const prompt = `
        You are an expert ${subjectName} teacher. Create a professional exam consisting of ${count} high-quality multiple-choice questions (MCQs).
        
        TOPIC: ${topic}
        DIFFICULTY LEVEL: ${difficulty}
        
        STRICT JSON FORMAT (Array of Objects):
        [
          {
            "questionText": "A clear, professionally phrased question about the topic",
            "type": "MCQ",
            "options": ["Accurate Option 1", "Accurate Option 2", "Accurate Option 3", "Accurate Option 4"],
            "correctAnswer": "The exact string of the correct option",
            "points": 1
          }
        ]

        INSTRUCTIONS:
        1. Ensure the questions are pedagogically sound and realistic for high school students.
        2. Options should be plausible but only one must be correct.
        3. Output ONLY the raw JSON array. No markdown, no triple backticks, no extra text.
      `;

      const google = createGoogleGenerativeAI({
        apiKey,
      });

      // I will show you how to get one if these does not work for you
      const activeModel = google("gemini-1.5-flash");

      const { text } = await generateText({
        prompt,
        model: activeModel,
      });

      console.log("AI Response for Exam:", text);

      // Robust JSON extraction
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("AI failed to return valid JSON array for exam questions");
      }
      
      return JSON.parse(jsonMatch[0]);
    });
    // now let save
    await step.run("save-exam", async () => {
      console.log("Saving generated exam:", examId);
      const exam = await Exam.findById(examId);

      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`);
      }

      // Update the exam with the new questions
      exam.questions = aiExam;
      exam.isActive = false; // Keep it inactive until teacher reviews it

      await exam.save();

      return { success: true, count: aiExam.length };
    });
    return { message: "Exam generated successfully" };
  }
);

// handle submission inside inngest
// Important because we don't want the student's submission to be have issues
// with server timeouts or other problems
export const handleExamSubmission = inngest.createFunction(
  { id: "Handle-Exam-Submission" },
  { event: "exam/submit" }, //name
  async ({ event, step }) => {
    const { examId, studentId, answers } = event.data;

    await step.run("process-exam-submission", async () => {
      // 1. Check if already submitted
      const existingSubmission = await Submission.findOne({
        exam: examId,
        student: studentId,
      });
      if (existingSubmission) {
        throw new NonRetriableError("Exam already submitted");
      }

      // 2. Fetch full exam (with answers)
      const exam = await Exam.findById(examId).select(
        "+questions.correctAnswer"
      );
      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`);
      }

      // 3. Calculate Score
      let score = 0;
      let totalPoints = 0;

      exam.questions.forEach((question) => {
        totalPoints += question.points;
        const studentAns = answers.find(
          (a: any) => a.questionId === question._id.toString()
        );
        if (studentAns && studentAns.answer === question.correctAnswer) {
          score += question.points;
        }
      });

      // 4. Save Submission
      await Submission.create({
        exam: examId,
        student: studentId,
        answers,
        score,
      });
    });
    return { message: "Exam submitted successfully" };
  }
);
