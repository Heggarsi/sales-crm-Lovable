import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for the password reset link.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">Sales CRM</span>
        </div>

        {!isSubmitted ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold">Forgot password?</h2>
              <p className="text-muted-foreground mt-2">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Reset password"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success/10 mx-auto flex items-center justify-center">
              <Mail className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Check your email</h2>
              <p className="text-muted-foreground mt-2">
                We sent a password reset link to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setIsSubmitted(false)}
            >
              Didn't receive the email? Click to resend
            </Button>
          </div>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
