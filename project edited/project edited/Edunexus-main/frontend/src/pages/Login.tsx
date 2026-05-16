import UniversalUserForm from "@/components/auth/UniversalUserForm";
import { useAuth } from "@/hooks/AuthProvider";
import { School, ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router";

const Login = () => {
  const { user, loading } = useAuth();
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }
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
          <div className="w-full max-w-xs">
            <UniversalUserForm type="login" />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80&auto=format&fit=crop"
          alt="School Campus"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default Login;
