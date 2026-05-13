import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Bookmark,
  Building2,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  PlusCircle,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useBookmarkStore } from "../../store/bookmarkStore";
import { authService } from "../../services/authService";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-ink"
  }`;

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { reset: resetBookmarks } = useBookmarkStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isRecruiter = user?.role === "recruiter";

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMobileOpen(false);
    await authService.signout(); // Xoá refreshToken trên backend
    logout(); // Xoá accessToken và user trong local state
    resetBookmarks(); // Reset bookmark store
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/jobs"
          className="flex items-center gap-2 text-lg font-bold text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Briefcase className="h-5 w-5" />
          </span>
          JobPortal
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/jobs" className={navLinkClass} end>
            Jobs
          </NavLink>
          <NavLink to="/companies" className={navLinkClass}>
            Companies
          </NavLink>
          {!isRecruiter && (
            <>
              <NavLink to="/applications" className={navLinkClass}>
                My Applications
              </NavLink>
              <NavLink to="/bookmarks" className={navLinkClass}>
                Bookmarks
              </NavLink>
            </>
          )}
          {isRecruiter ? (
            <>
              <NavLink to="/cv-search" className={navLinkClass}>
                CV Search
              </NavLink>
              <NavLink to="/jobs/new" className={navLinkClass}>
                Post Job
              </NavLink>
              <NavLink to="/recruiter/applications" className={navLinkClass}>
                Applicants
              </NavLink>
              <NavLink to="/manage-jobs" className={navLinkClass}>
                Manage Jobs
              </NavLink>
            </>
          ) : null}
        </div>

        <div className="hidden items-center md:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserCircle className="h-5 w-5 text-brand-600" />
                <span className="max-w-32 truncate">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {isDropdownOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-ink"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to={isRecruiter ? "/company" : "/cvs"}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-ink"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {isRecruiter ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {isRecruiter ? "Manage Company" : "My CVs"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((value) => !value)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {isMobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink
              to="/jobs"
              className={navLinkClass}
              end
              onClick={() => setIsMobileOpen(false)}
            >
              Jobs
            </NavLink>
            <NavLink
              to="/companies"
              className={navLinkClass}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies
              </span>
            </NavLink>
            {!isRecruiter && (
              <>
                <NavLink
                  to="/applications"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    My Applications
                  </span>
                </NavLink>
                <NavLink
                  to="/bookmarks"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarks
                  </span>
                </NavLink>
              </>
            )}
            {isRecruiter ? (
              <>
                <NavLink
                  to="/cv-search"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    CV Search
                  </span>
                </NavLink>
                <NavLink
                  to="/jobs/new"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Post Job
                  </span>
                </NavLink>
                <NavLink
                  to="/recruiter/applications"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Applicants
                  </span>
                </NavLink>
                <NavLink
                  to="/manage-jobs"
                  className={navLinkClass}
                  onClick={() => setIsMobileOpen(false)}
                >
                  Manage Jobs
                </NavLink>
              </>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
