import { useState } from "react";
import UniversalUserForm from "@/components/auth/UniversalUserForm";
import { useAuth } from "@/hooks/AuthProvider";
import { School, GraduationCap, Users, User, ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { UserRole } from "@/types";

const Register = () => {
  const { user, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

  const roleOptions = [
    {
      id: "student",
      title: "Student",
      description: "Join classes, take exams, and track your progress.",
      icon: <GraduationCap className="h-8 w-8 text-[#3ecf8e]" />,
    },
    {
      id: "teacher",
      title: "Teacher",
      description: "Manage classes, create quizzes, and grade assignments.",
      icon: <Users className="h-8 w-8 text-blue-500" />,
    },
    {
      id: "parent",
      title: "Parent",
      description: "Monitor your child's academic performance and attendance.",
      icon: <User className="h-8 w-8 text-purple-500" />,
    },
  ];

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center md:justify-start gap-4 w-full">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <School className="size-4" />
            </div>
            Edunexus.
          </Link>
          <Link to="/" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors ml-auto bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {!selectedRole ? (
              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl font-bold tracking-tight">Join Edunexus</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose your role to get started with your account creation.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {roleOptions.map((role) => (
                    <Card 
                      key={role.id}
                      className="cursor-pointer hover:border-[#3ecf8e] transition-all hover:shadow-md group"
                      onClick={() => setSelectedRole(role.id as UserRole)}
                    >
                      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="p-3 bg-muted rounded-xl group-hover:bg-[#3ecf8e]/10 transition-colors">
                          {role.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{role.title}</CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="underline underline-offset-4">
                    Log in
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to selection
                </button>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enter your details below to set up your {selectedRole} profile.
                  </p>
                </div>
                
                <UniversalUserForm 
                  type="create" 
                  role={selectedRole} 
                  onSuccess={() => navigate("/login")} 
                />
                
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="underline underline-offset-4">
                    Log in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80&auto=format&fit=crop"
          alt="School Campus"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold mb-2">Empowering the next generation.</h2>
          <p className="text-gray-200">Connect with your school community and unlock your full potential with Edunexus.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
