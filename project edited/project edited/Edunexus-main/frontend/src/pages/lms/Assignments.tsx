import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, ClipboardList, Calendar, Users, Loader2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  class: { _id: string; name: string };
  subject: { _id: string; name: string };
  teacher: { _id: string; name: string };
  attachmentUrl?: string;
}

const Assignments = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/assignments");
      setAssignments(data || []);
    } catch (error) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Manage and submit your coursework.
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => navigate("/lms/assignments/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Assignment
          </Button>
        )}
      </div>

      {assignments.length === 0 && !loading && (
        <div className="flex items-center justify-center h-64 border rounded-lg border-dashed">
          <p className="text-muted-foreground">No assignments found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card className="hover:shadow-md transition-shadow" key={assignment._id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium">
                  {assignment.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {assignment.subject?.name || "No Subject"}
                  </Badge>
                  <span>{assignment.class?.name || "No Class"}</span>
                </div>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {assignment.description}
              </p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Teacher: {assignment.teacher?.name}
                </div>
                {assignment.attachmentUrl && (
                  <div className="flex items-center gap-2 text-blue-500 cursor-pointer" onClick={() => window.open(assignment.attachmentUrl, "_blank")}>
                    <LinkIcon className="h-3 w-3" />
                    View Attachment
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/lms/assignments/${assignment._id}`)}
              >
                {isTeacher ? "View Submissions" : "View Details & Submit"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Assignments;
