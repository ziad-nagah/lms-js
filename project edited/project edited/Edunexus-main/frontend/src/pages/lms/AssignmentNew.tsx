import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { CustomInput } from "@/components/global/CustomInput";
import { CustomSelect } from "@/components/global/CustomSelect";
import type { Class, subject } from "@/types";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  class: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  attachmentUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const AssignmentNew = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<subject[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      class: "",
      subject: "",
      attachmentUrl: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classRes, subjectRes] = await Promise.all([
          api.get("/classes"),
          api.get("/subjects"),
        ]);
        setClasses(classRes.data.classes || []);
        setSubjects(subjectRes.data.subjects || []);
      } catch (error) {
        toast.error("Failed to load classes or subjects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await api.post("/assignments/create", values);
      toast.success("Assignment created successfully");
      navigate("/lms/assignments");
    } catch (error) {
      toast.error("Failed to create assignment");
    }
  };

  const classOptions = classes.map((c) => ({ label: c.name, value: c._id }));
  const subjectOptions = subjects.map((s) => ({ label: s.name, value: s._id }));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Assignment</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <CustomInput
            control={form.control}
            name="title"
            label="Assignment Title"
            placeholder="e.g. History Essay"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...form.register("description")}
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder="Provide assignment details..."
            />
          </div>
          <CustomInput
            control={form.control}
            name="dueDate"
            label="Due Date"
            type="date"
          />
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              control={form.control}
              name="class"
              label="Class"
              placeholder="Select Class"
              options={classOptions}
              loading={loading}
            />
            <CustomSelect
              control={form.control}
              name="subject"
              label="Subject"
              placeholder="Select Subject"
              options={subjectOptions}
              loading={loading}
            />
          </div>
          <CustomInput
            control={form.control}
            name="attachmentUrl"
            label="Attachment URL (Optional)"
            placeholder="Link to resource"
          />
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/lms/assignments")}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentNew;
