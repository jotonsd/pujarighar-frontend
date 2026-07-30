"use client";

import Spinner from "@/components/ui/Spinner";
import RoleForm from "@/components/admin/roles/RoleForm";
import { useGetRolesQuery } from "@/api/roles/rolesApi";

export default function EditRolePage({ params }: { params: { id: string } }) {
  const { data: roles = [], isLoading } = useGetRolesQuery();
  const role = roles.find(r => r.id === params.id);

  if (isLoading) return <Spinner />;
  if (!role) return <p className="text-gray-400">Role not found</p>;

  return <RoleForm mode="edit" role={role} />;
}
