"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Plus, ShieldCheck, Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Badge from "@/components/ui/Badge";
import { toast } from "@/store/toastStore";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { Role } from "@/lib/types";
import { useGetRolesQuery, useDeleteRoleMutation } from "@/api/roles/rolesApi";

export default function RolesAdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const isBn = locale === "bn";
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: roles = [], isLoading } = useGetRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e.data?.message ?? (isBn ? "মুছতে ব্যর্থ হয়েছে" : "Failed to delete"));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<Role>[] = [
    {
      header: isBn ? "নাম" : "Name",
      accessor: role => (
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800 text-sm">{isBn ? role.name_bn : role.name_en}</p>
          {role.is_system && (
            <Badge variant="blue">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              {isBn ? "সিস্টেম" : "System"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: isBn ? "পারমিশন" : "Permissions",
      accessor: role => {
        if (role.is_system && role.code === "ADMIN") {
          return <span className="text-xs text-gray-500">{isBn ? "সবকিছু" : "Everything"}</span>;
        }
        const modules = Array.from(new Set(
          role.permissions.map(p => (isBn ? p.label_bn : p.label_en).split(" — ")[0] ?? p.module),
        ));
        if (modules.length === 0) {
          return <span className="text-xs text-gray-400">{isBn ? "কোনো পারমিশন নেই" : "No permissions"}</span>;
        }
        const shown = modules.slice(0, 3);
        const extra = modules.length - shown.length;
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map(m => (
              <span key={m} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{m}</span>
            ))}
            {extra > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">+{extra}</span>}
          </div>
        );
      },
    },
    {
      header: isBn ? "ব্যবহারকারী" : "Users",
      accessor: role => <span className="text-xs text-gray-500">{role.user_count ?? 0}</span>,
      className: "px-4 py-3 w-24",
    },
  ];

  const quickActions: QuickAction<Role>[] = [
    {
      label: "Edit",
      render: role => (
        <button
          onClick={() => router.push(`/${locale}/admin/roles/${role.id}/edit`)}
          title={role.is_system ? (isBn ? "দেখুন" : "View") : (isBn ? "সম্পাদনা" : "Edit")}
          className={
            role.is_system
              ? "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              : "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
          }
        >
          {role.is_system ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      ),
    },
    {
      label: "Delete",
      render: role =>
        role.is_system ? null : (
          <button
            onClick={() => setDeleteTarget(role)}
            title={isBn ? "মুছুন" : "Delete"}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "রোল ও পারমিশন" : "Roles & Permissions"}
        description={isBn ? "স্টাফ রোল তৈরি করুন এবং মেনু/অ্যাকশন পারমিশন নির্ধারণ করুন" : "Create staff roles and control which menus and actions they can access"}
        actions={
          <Link
            href={`/${locale}/admin/roles/new`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {isBn ? "নতুন রোল" : "New Role"}
          </Link>
        }
      />

      {deleteTarget && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          title={isBn ? "রোল মুছবেন?" : "Delete role?"}
          description={isBn ? "এই রোলটি স্থায়ীভাবে মুছে যাবে।" : "This role will be permanently deleted."}
          confirmLabel={isBn ? "হ্যাঁ, মুছুন" : "Yes, Delete"}
          confirmClassName="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ReusableTable
        data={roles}
        columns={columns}
        keyExtractor={role => role.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো রোল নেই।" : "No roles yet."}
        exportFilename="roles"
      />
    </div>
  );
}
