"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createMember, updateMember } from "@/features/members/actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-xs text-muted-foreground">
                No photo
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="text-sm text-muted-foreground"
              />
              {photoError && <p className="mt-1 text-xs text-destructive">{photoError}</p>}
            </div>
          </div>

          <FormField label="Branch">
            {() => (
              <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="First name">
              {(id) => (
                <Input
                  id={id}
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Last name">
              {(id) => (
                <Input
                  id={id}
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              {(id) => (
                <Input
                  id={id}
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Email (optional)">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date of birth (optional)">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Gender (optional)">
              {() => (
                <Select
                  value={form.gender || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, gender: v as MemberFormValues["gender"] }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <FormField label="Address (optional)">
            {(id) => (
              <Input
                id={id}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            )}
          </FormField>

          {memberId && (
            <FormField label="Status">
              {() => (
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as MemberFormValues["status"] }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="FROZEN">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : memberId ? "Save changes" : "Add member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
