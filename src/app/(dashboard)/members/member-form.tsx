"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createMember, updateMember } from "@/features/members/actions";

type Branch = { id: string; name: string };

type MemberFormValues = {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  address: string;
  photoUrl: string;
  status?: "ACTIVE" | "INACTIVE" | "FROZEN";
};

const emptyValues: MemberFormValues = {
  branchId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  photoUrl: "",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MemberForm({
  branches,
  memberId,
  initialValues,
}: {
  branches: Branch[];
  memberId?: string;
  initialValues?: Partial<MemberFormValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<MemberFormValues>({
    ...emptyValues,
    branchId: branches[0]?.id ?? "",
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 1_500_000) {
      setPhotoError("Photo must be under 1.5MB");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm((f) => ({ ...f, photoUrl: dataUrl }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = memberId ? await updateMember(memberId, form) : await createMember(form);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(memberId ? `/members/${memberId}` : "/members");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        {form.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
            No photo
          </div>
        )}
        <div>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
          {photoError && <p className="text-xs text-red-600">{photoError}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Branch</label>
        <select
          required
          value={form.branchId}
          onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        >
          <option value="" disabled>
            Select a branch
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="First name"
          value={form.firstName}
          onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
        />
        <TextField
          label="Last name"
          value={form.lastName}
          onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <TextField
          label="Email (optional)"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Date of birth (optional)"
          type="date"
          value={form.dateOfBirth}
          onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender (optional)</label>
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as MemberFormValues["gender"] }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <TextField
        label="Address (optional)"
        value={form.address}
        onChange={(v) => setForm((f) => ({ ...f, address: v }))}
      />

      {memberId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MemberFormValues["status"] }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="FROZEN">Frozen</option>
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : memberId ? "Save changes" : "Add member"}
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const required = !label.includes("optional");
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
    </div>
  );
}
