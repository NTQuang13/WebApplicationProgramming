import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Briefcase, Loader2 } from "lucide-react";
import { companyService } from "@/services/companyService";
import { jobService } from "@/services/jobService";
import { masterDataService, type Category, type ExperienceLevel } from "@/services/masterDataService";
import type { Company } from "@/types";
import type { Job, JobPayload, PaginatedResponse } from "@/types/job";

interface JobFormProps {
  initialJob?: Job | null;
  onSuccess?: () => void;
}

const emptyForm: JobPayload = {
  title: "",
  location: "",
  salaryMin: 0,
  salaryMax: 0,
  jobTypeId: "",
  experienceLevelId: "",
  companyId: "",
  description: "",
  requirements: "",
};

const locations = [
  // ... (keeping locations as they are for now)
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const normalizeCompanies = (
  response: PaginatedResponse<Company> | Company[],
) => (Array.isArray(response) ? response : (response.data ?? []));

function JobForm({ initialJob, onSuccess }: JobFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<JobPayload>(emptyForm);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialJob?.id);

  useEffect(() => {
    if (!initialJob) {
      setForm(emptyForm);
      return;
    }

    setForm({
      title: initialJob.title,
      location: initialJob.location,
      salaryMin: initialJob.salaryMin ?? 0,
      salaryMax: initialJob.salaryMax ?? 0,
      jobTypeId: initialJob.jobTypeId,
      experienceLevelId: initialJob.experienceLevelId,
      companyId: initialJob.companyId ?? "",
      description: initialJob.description,
      requirements: Array.isArray(initialJob.requirements)
        ? initialJob.requirements.join("\n")
        : initialJob.requirements,
    });
  }, [initialJob]);

  //chỉ hiện thị công ty do recruiter này tạo ra khi post job, nên chỉ cần fetch "My Companies"
  useEffect(() => {
    let isMounted = true;

    const fetchCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        
        const response = normalizeCompanies(
          await companyService.getMyCompanies(1, 100)
        );

        if (isMounted) {
          // Sau khi lấy về, response này chỉ chứa các công ty do chính user này tạo
          setCompanies(response);

          setForm((current) => {
            // Nếu đã có companyId (từ URL hoặc Edit mode) và nó nằm trong danh sách "của tôi"
            if (
              current.companyId &&
              response.some((company) => company.id === current.companyId)
            ) {
              return current;
            }

            // Mặc định chọn công ty đầu tiên trong danh sách của recruiter này
            return {
              ...current,
              companyId: response[0]?.id ?? "",
            };
          });
        }
      } catch {
        toast.error("Failed to load your companies.");
      } finally {
        if (isMounted) {
          setIsLoadingCompanies(false);
        }
      }
    };

    void fetchCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMasterData = async () => {
      try {
        setIsLoadingMasterData(true);
        const [cats, levels] = await Promise.all([
          masterDataService.getCategories(),
          masterDataService.getExperienceLevels(),
        ]);

        if (isMounted) {
          setCategories(cats);
          setExperienceLevels(levels);
        }
      } catch {
        toast.error("Failed to load categories or experience levels.");
      } finally {
        if (isMounted) {
          setIsLoadingMasterData(false);
        }
      }
    };

    void fetchMasterData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = <K extends keyof JobPayload>(
    key: K,
    value: JobPayload[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (
      !form.title.trim() ||
      !form.location.trim() ||
      !form.jobTypeId ||
      !form.experienceLevelId ||
      !form.companyId ||
      !form.description.trim() ||
      !form.requirements.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    if (form.salaryMin <= 0 || form.salaryMax <= 0) {
      toast.error("Salary values must be greater than zero.");
      return false;
    }

    if (form.salaryMax < form.salaryMin) {
      toast.error(
        "Maximum salary must be greater than or equal to minimum salary.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && initialJob) {
        await jobService.updateJob(initialJob.id, form);
        toast.success("Job updated successfully");
      } else {
        await jobService.createJob(form);
        toast.success("Job posted successfully");

      }
      onSuccess?.(); 
      navigate("/manage-jobs");
    } catch {
      toast.error(isEditMode ? "Failed to update job." : "Failed to post job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Briefcase className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">
            {isEditMode ? "Edit Job" : "Post Job"}
          </h2>
          <p className="text-sm text-slate-500">
            Complete the role information candidates will review.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label
            htmlFor="location"
            className="text-sm font-medium text-slate-700"
          >
            Location
          </label>
          <select
            id="location"
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="salaryMin"
            className="text-sm font-medium text-slate-700"
          >
            Salary Min
          </label>
          <input
            id="salaryMin"
            type="number"
            min="0"
            value={form.salaryMin || ""}
            onChange={(event) =>
              updateField("salaryMin", Number(event.target.value))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label
            htmlFor="salaryMax"
            className="text-sm font-medium text-slate-700"
          >
            Salary Max
          </label>
          <input
            id="salaryMax"
            type="number"
            min="0"
            value={form.salaryMax || ""}
            onChange={(event) =>
              updateField("salaryMax", Number(event.target.value))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label
            htmlFor="jobType"
            className="text-sm font-medium text-slate-700"
          >
            Job Type
          </label>
          <select
            id="jobTypeId"
            value={form.jobTypeId}
            onChange={(event) => updateField("jobTypeId", event.target.value)}
            disabled={isLoadingMasterData}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          >
            <option value="">Select type</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="experienceLevel"
            className="text-sm font-medium text-slate-700"
          >
            Experience Level
          </label>
          <select
            id="experienceLevelId"
            value={form.experienceLevelId}
            onChange={(event) =>
              updateField("experienceLevelId", event.target.value)
            }
            disabled={isLoadingMasterData}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          >
            <option value="">Select level</option>
            {experienceLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="companyId"
            className="text-sm font-medium text-slate-700"
          >
            Company
          </label>
          <select
            id="companyId"
            value={form.companyId}
            onChange={(event) => updateField("companyId", event.target.value)}
            disabled={isLoadingCompanies}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          >
            <option value="">
              {isLoadingCompanies ? "Loading companies..." : "Select company"}
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="requirements"
            className="text-sm font-medium text-slate-700"
          >
            Requirements
          </label>
          <textarea
            id="requirements"
            rows={5}
            value={form.requirements}
            onChange={(event) =>
              updateField("requirements", event.target.value)
            }
            placeholder="One requirement per line"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEditMode ? "Save Changes" : "Post Job"}
        </button>
      </div>
    </form>
  );
}

export default JobForm;
