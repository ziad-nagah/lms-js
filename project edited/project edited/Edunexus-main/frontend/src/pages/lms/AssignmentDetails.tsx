import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/AuthProvider";
import { toast } from "sonner";
import { Loader2, Calendar, User, Link as LinkIcon, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  class: { name: string };
  subject: { name: string };
  teacher: { name: string };
  attachmentUrl?: string;
}

interface Submission {
  _id: string;
  student: { name: string; email: string };
  content?: string;
  submissionUrl?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submittedAt: string;
}

const AssignmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Student form state
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [content, setContent] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch assignment details
        const { data: assignments } = await api.get("/assignments");
        const found = assignments.find((a: any) => a._id === id);
        setAssignment(found);

        if (isTeacher) {
          const { data: subs } = await api.get(`/assignments/${id}/submissions`);
          setSubmissions(subs);
        } else {
          // Check if student already submitted
          // This would ideally be a separate endpoint, but let's check current subs if possible
          // For now, we'll just try to submit and handle the error
        }
      } catch (error) {
        toast.error("Failed to load assignment data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isTeacher]);

  const handleStudentSubmit = async () => {
    if (!submissionUrl && !content) {
      toast.error("Please provide a link or content for your submission");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/assignments/${id}/submit`, { submissionUrl, content });
      toast.success("Assignment submitted successfully!");
      setAlreadySubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (subId: string) => {
    const grade = prompt("Enter grade (0-100):");
    const feedback = prompt("Enter feedback:");
    if (grade === null) return;
    
    try {
      await api.patch(`/assignments/submissions/${subId}/grade`, { 
        grade: Number(grade), 
        feedback 
      });
      toast.success("Submission graded");
      // Refresh submissions
      const { data: subs } = await api.get(`/assignments/${id}/submissions`);
      setSubmissions(subs);
    } catch (error) {
      toast.error("Failed to grade submission");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!assignment) return <div className="p-8 text-center">Assignment not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{assignment.title}</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{assignment.subject.name}</Badge>
            <Badge variant="outline">{assignment.class.name}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/lms/assignments")}>Back to List</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {assignment.description}
              </p>
            </CardContent>
          </Card>

          {isTeacher ? (
            <Card>
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>{submissions.length} students have submitted so far.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub._id}>
                        <TableCell className="font-medium">{sub.student.name}</TableCell>
                        <TableCell>{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {sub.submissionUrl ? (
                            <a href={sub.submissionUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" /> View
                            </a>
                          ) : "None"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "graded" ? "default" : "secondary"}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{sub.grade ?? "N/A"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleGrade(sub._id)}>Grade</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alreadySubmitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-green-600 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <CheckCircle className="h-12 w-12 mb-2" />
                    <p className="font-bold text-lg">Assignment Submitted!</p>
                    <p className="text-sm">Your teacher will review it soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Submission URL (e.g. Google Drive link)</label>
                      <Input 
                        placeholder="https://..." 
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Additional Comments</label>
                      <textarea 
                        className="w-full min-h-[100px] p-2 border rounded-md" 
                        placeholder="Any notes for your teacher..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleStudentSubmit} disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Due Date</p>
                  <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Teacher</p>
                  <p className="font-medium">{assignment.teacher.name}</p>
                </div>
              </div>
              {assignment.attachmentUrl && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => window.open(assignment.attachmentUrl, "_blank")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download Material
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetails;
