import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, X, Clock, Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/global/CustomSelect";
import { useForm } from "react-hook-form";
import type { Class, subject } from "@/types";

interface AttendanceRecord {
  student: string;
  status: "present" | "absent" | "late";
}

interface Student {
  _id: string;
  name: string;
  email: string;
}

const Attendance = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, "present" | "absent" | "late">>({});
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const form = useForm({
    defaultValues: {
      classId: "",
      subjectId: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const { watch } = form;
  const selectedClass = watch("classId");
  const selectedSubject = watch("subjectId");
  const selectedDate = watch("date");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, subjectRes] = await Promise.all([
          api.get("/classes"),
          api.get("/subjects"),
        ]);
        setClasses(classRes.data.classes || []);
        setSubjects(subjectRes.data.subjects || []);
      } catch (error) {
        toast.error("Failed to load metadata");
      }
    };
    fetchData();
  }, []);

  const handleFetchStudents = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate) {
      toast.error("Please select class, subject and date");
      return;
    }

    try {
      setFetchingStudents(true);
      // 1. Fetch students for this class
      const studentRes = await api.get(`/attendance/students/${selectedClass}`);
      setStudents(studentRes.data || []);

      // 2. Fetch existing attendance for this day
      const attendanceRes = await api.get("/attendance", {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          date: selectedDate,
        },
      });

      const initialRecords: Record<string, "present" | "absent" | "late"> = {};
      
      // If attendance exists, load it
      if (attendanceRes.data && attendanceRes.data.records) {
        attendanceRes.data.records.forEach((rec: any) => {
          initialRecords[rec.student._id] = rec.status;
        });
      } else {
        // Otherwise default to present for all
        studentRes.data.forEach((s: Student) => {
          initialRecords[s._id] = "present";
        });
      }
      setRecords(initialRecords);
    } catch (error) {
      toast.error("Failed to fetch students or attendance");
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate,
        class: selectedClass,
        subject: selectedSubject,
        records: Object.entries(records).map(([studentId, status]) => ({
          student: studentId,
          status,
        })),
      };

      await api.post("/attendance/mark", payload);
      toast.success("Attendance saved successfully");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const classOptions = classes.map((c) => ({ label: c.name, value: c._id }));
  const subjectOptions = subjects.map((s) => ({ label: s.name, value: s._id }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage student daily attendance.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class & Date</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-48">
            <CustomSelect
              control={form.control}
              name="classId"
              label="Class"
              options={classOptions}
              placeholder="Select Class"
            />
          </div>
          <div className="w-full md:w-48">
            <CustomSelect
              control={form.control}
              name="subjectId"
              label="Subject"
              options={subjectOptions}
              placeholder="Select Subject"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input type="date" {...form.register("date")} />
          </div>
          <Button onClick={handleFetchStudents} disabled={fetchingStudents}>
            {fetchingStudents ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
            Fetch Students
          </Button>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant={records[student._id] === "present" ? "default" : "outline"}
                          className={records[student._id] === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => handleStatusChange(student._id, "present")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Present
                        </Button>
                        <Button
                          size="sm"
                          variant={records[student._id] === "late" ? "default" : "outline"}
                          className={records[student._id] === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                          onClick={() => handleStatusChange(student._id, "late")}
                        >
                          <Clock className="h-4 w-4 mr-1" /> Late
                        </Button>
                        <Button
                          size="sm"
                          variant={records[student._id] === "absent" ? "default" : "outline"}
                          className={records[student._id] === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                          onClick={() => handleStatusChange(student._id, "absent")}
                        >
                          <X className="h-4 w-4 mr-1" /> Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
