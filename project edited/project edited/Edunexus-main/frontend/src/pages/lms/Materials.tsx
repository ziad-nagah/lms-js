import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, FileText, Link as LinkIcon, Loader2, PlayCircle, File } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { subject } from "@/types";
import AddMaterialDialog from "@/components/lms/AddMaterialDialog";

interface Material {
  _id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  uploadedBy: { _id: string; name: string };
  createdAt: string;
}

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Materials = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const url = selectedSubject !== "all" 
        ? `/materials?subjectId=${selectedSubject}` 
        : "/materials";
      const { data } = await api.get(url);
      setMaterials(data.materials || []);
    } catch (error) {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedSubject]);

  useEffect(() => {
    // Fetch subjects for the filter dropdown
    const fetchSubjects = async () => {
      try {
        const { data } = await api.get("/subjects");
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error("Failed to load subjects", error);
      }
    };
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await api.delete(`/materials/delete/${id}`);
      toast.success("Material deleted");
      fetchMaterials();
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "Video":
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case "Document":
        return <File className="h-5 w-5 text-blue-400" />;
      default:
        return <LinkIcon className="h-5 w-5 text-gray-500" />;
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
          <p className="text-muted-foreground">
            Access and manage course resources and study guides.
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <span className="text-sm font-medium">Filter by Subject:</span>
        <Select
          value={selectedSubject}
          onValueChange={setSelectedSubject}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((sub) => (
              <SelectItem key={sub._id} value={sub._id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {materials.length === 0 && !loading && (
        <div className="flex items-center justify-center h-64 border rounded-lg border-dashed">
          <p className="text-muted-foreground">No materials found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => {
          const ytId = material.type === "Video" ? getYouTubeId(material.url) : null;
          return (
          <Card className="hover:shadow-md transition-shadow flex flex-col overflow-hidden" key={material._id}>
            {ytId && (
              <div className="w-full h-40 bg-muted shrink-0 relative group">
                <img 
                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                  alt={material.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium">
                  {material.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {material.subjectId?.name || "No Subject"}
                  </Badge>
                  <span>{material.classId?.name || "No Class"}</span>
                </div>
              </div>
              <div className="p-2 bg-muted rounded-md">
                {getIcon(material.type)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {material.description || "No description provided."}
              </p>
              <div className="text-xs text-muted-foreground mt-4">
                Added by {material.uploadedBy?.name} •{" "}
                {new Date(material.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                className="flex-1"
                onClick={() => window.open(material.url, "_blank")}
              >
                Open {material.type}
              </Button>
              {isTeacher && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(material._id)}
                >
                  <span className="sr-only">Delete</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              )}
            </CardFooter>
          </Card>
          );
        })}
      </div>

      <AddMaterialDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={fetchMaterials}
      />
    </div>
  );
};

export default Materials;
