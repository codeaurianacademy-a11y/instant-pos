"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "CASHIER";
  isActive: boolean;
  createdAt: string;
}

interface StaffFormState {
  name: string;
  username: string;
  password: string;
  role: "ADMIN" | "CASHIER";
}

const emptyForm: StaffFormState = {
  name: "",
  username: "",
  password: "",
  role: "CASHIER",
};

// ── Staff Form Modal ──────────────────────────────────────────────────────────
function StaffFormModal({
  open,
  onClose,
  onSaved,
  member,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  member: StaffMember | null;
}) {
  const { showToast } = useToast();
  const isEditing = member !== null;
  const [form, setForm] = useState<StaffFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(
        member
          ? { name: member.name, username: member.username, password: "", role: member.role }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, member]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.username.trim()) e.username = "Username is required";
    else if (!/^[a-z0-9_]+$/.test(form.username))
      e.username = "Only lowercase letters, numbers, underscores";
    else if (form.username.length < 3) e.username = "At least 3 characters";
    if (!isEditing && !form.password) e.password = "Password is required";
    if (form.password && form.password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        username: form.username.trim(),
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = isEditing
        ? await fetch(`/api/users/${member!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to save staff member", "danger");
        return;
      }
      showToast(isEditing ? "Staff member updated" : "Staff member created", "success");
      onSaved();
      onClose();
    } catch {
      showToast("Something went wrong", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Staff Member" : "Add Staff Member"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          error={errors.name}
          required
          autoFocus
          placeholder="e.g. Rahul Sharma"
        />
        <Input
          label="Username"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))}
          error={errors.username}
          required
          placeholder="e.g. rahul123"
        />
        <Input
          label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          error={errors.password}
          placeholder={isEditing ? "Leave blank to keep unchanged" : "Min 6 characters"}
          rightElement={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye-off icon
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                // Eye icon
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          }
        />
        {/* Role select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Role</label>
          <Select
            value={form.role}
            onChange={(val) => setForm((p) => ({ ...p, role: val as "ADMIN" | "CASHIER" }))}
            options={[
              { label: "Cashier (Salesman)", value: "CASHIER" },
              { label: "Admin", value: "ADMIN" },
            ]}
          />
          <p className="text-xs text-muted">
            {form.role === "ADMIN"
              ? "Admin has full access: inventory, reports, staff management."
              : "Cashier can only access POS, transactions, and drafts."}
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            {isEditing ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Staff Page ───────────────────────────────────────────────────────────
export default function StaffPage() {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setStaff(data.users ?? []);
    } catch {
      showToast("Failed to load staff", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff();
  }, [fetchStaff]);

  function handleEdit(member: StaffMember) {
    setEditingMember(member);
    setIsFormOpen(true);
  }

  async function executeDelete() {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${memberToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to deactivate staff member", "danger");
        return;
      }
      showToast(`${memberToDelete.name} has been deactivated`, "success");
      setMemberToDelete(null);
      fetchStaff();
    } catch {
      showToast("Something went wrong", "danger");
    } finally {
      setIsDeleting(false);
    }
  }

  const activeStaff = staff.filter((s) => s.isActive);
  const inactiveStaff = staff.filter((s) => !s.isActive);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Management</h1>
          <p className="text-sm text-muted mt-0.5">
            Create and manage cashier and admin accounts.
          </p>
        </div>
        <Button
          size="md"
          onClick={() => {
            setEditingMember(null);
            setIsFormOpen(true);
          }}
          className="font-semibold shadow-xs"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Staff", value: staff.length, color: "text-slate-700" },
          { label: "Active", value: activeStaff.length, color: "text-emerald-600" },
          { label: "Inactive", value: inactiveStaff.length, color: "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <p className="text-xs text-muted font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-border bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sm font-medium text-slate-500">No staff members yet</p>
            <p className="text-xs text-muted mt-1">Add your first employee to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{member.username}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      member.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {member.role === "ADMIN" ? "Admin" : "Cashier"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs hidden md:table-cell">
                    {formatDateTime(member.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      member.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Edit staff member"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      {member.isActive && (
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deactivate staff member"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <StaffFormModal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMember(null);
        }}
        onSaved={fetchStaff}
        member={editingMember}
      />

      <ConfirmDeleteModal
        isOpen={!!memberToDelete}
        title="Deactivate Staff Member?"
        description="This staff member will be deactivated and will no longer be able to log in. All their past transactions and records will be preserved."
        itemLabel={memberToDelete ? `${memberToDelete.name} (@${memberToDelete.username})` : undefined}
        confirmLabel="Yes, Deactivate"
        onConfirm={executeDelete}
        onCancel={() => setMemberToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
