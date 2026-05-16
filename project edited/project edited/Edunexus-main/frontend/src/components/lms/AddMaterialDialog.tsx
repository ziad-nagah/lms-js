import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { CustomInput } from "@/components/global/CustomInput";
import { CustomSelect } from "@/components/global/CustomSelect";
import { useEffect } from "react";
import type { Class, subject } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["PDF", "Video", "Link", "Document"]),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
});

const AddMaterialDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<subject[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      type: "Link",
      classId: "",
      subjectId: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
      form.reset();
    }
  }, [open]);

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await api.post("/materials/create", values);
      toast.success("Material added successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add material");
    }
  };

  const classOptions = classes.map((c) => ({ label: c.name, value: c._id }));
  const subjectOptions = subjects.map((s) => ({ label: s.name, value: s._id }));
  const typeOptions = [
    { label: "Link", value: "Link" },
    { label: "PDF", value: "PDF" },
    { label: "Video", value: "Video" },
    { label: "Document", value: "Document" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Study Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <FieldGroup>
            <CustomInput
              control={form.control}
              name="title"
              label="Title"
              placeholder="e.g. Physics Chapter 1"
            />
            <CustomInput
              control={form.control}
              name="description"
              label="Description (Optional)"
              placeholder="Brief description"
            />
            <CustomInput
              control={form.control}
              name="url"
              label="Resource URL"
              placeholder="https://..."
            />
            <CustomSelect
              control={form.control}
              name="type"
              label="Type"
              placeholder="Select Type"
              options={typeOptions}
            />
            <CustomSelect
              control={form.control}
              name="classId"
              label="Class"
              placeholder="Select Class"
              options={classOptions}
              loading={loading}
            />
            <CustomSelect
              control={form.control}
              name="subjectId"
              label="Subject"
              placeholder="Select Subject"
              options={subjectOptions}
              loading={loading}
            />
          </FieldGroup>
          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || loading}
            >
              {form.formState.isSubmitting ? "Adding..." : "Add Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialDialog;
