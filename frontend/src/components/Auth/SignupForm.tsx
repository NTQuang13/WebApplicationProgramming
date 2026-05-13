import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BriefcaseBusiness, Mail, LockKeyhole, UserRound } from "lucide-react";
import LoadingSpinner from "../Common/LoadingSpinner";
import { authService } from "../../services/authService";
import type { UserRole } from "../../types";

function SignupForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.signup({ name, email, password, role });
      toast.success("Account created. Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Full name
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <UserRound className="h-4 w-4 text-slate-400" />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <LockKeyhole className="h-4 w-4 text-slate-400" />
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="role" className="text-sm font-medium text-slate-700">
          Role
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full border-0 bg-transparent px-3 py-3 text-sm text-ink outline-none"
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <LoadingSpinner size="sm" /> : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default SignupForm;
