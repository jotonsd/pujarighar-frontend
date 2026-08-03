"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import { toast } from "@/store/toastStore";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { BlogPost } from "@/lib/types";
import {
  useGetAllBlogPostsQuery,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
} from "@/api/blog/blogApi";

export default function BlogAdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const isBn = locale === "bn";
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: posts = [], isLoading } = useGetAllBlogPostsQuery();
  const [updateBlogPost] = useUpdateBlogPostMutation();
  const [deleteBlogPost] = useDeleteBlogPostMutation();

  const handleToggleActive = async (post: BlogPost) => {
    const fd = new FormData();
    fd.append("is_active", String(!post.is_active));
    try {
      await updateBlogPost({ id: post.id, data: fd }).unwrap();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBlogPost(deleteTarget).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch {
      toast.error(isBn ? "মুছতে ব্যর্থ হয়েছে" : "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<BlogPost>[] = [
    {
      header: isBn ? "কভার" : "Cover",
      accessor: post =>
        post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-100" />
        ) : (
          <div className="w-16 h-10 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50">
            <span className="text-xs text-gray-300">—</span>
          </div>
        ),
      className: "px-4 py-2 w-24",
    },
    {
      header: isBn ? "শিরোনাম" : "Title",
      accessor: post => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{isBn ? post.title_bn : post.title_en}</p>
          <p className="text-xs text-gray-400">/{post.slug}</p>
        </div>
      ),
    },
    {
      header: isBn ? "প্রকাশের তারিখ" : "Published",
      accessor: post => (
        <span className="text-xs text-gray-500">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}
        </span>
      ),
      className: "px-4 py-3 w-32",
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: post => (
        <ToggleSwitch
          checked={post.is_active}
          onChange={() => handleToggleActive(post)}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
      className: "px-4 py-3 w-36",
    },
  ];

  const quickActions: QuickAction<BlogPost>[] = [
    {
      label: "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: post => router.push(`/${locale}/admin/blog/${post.id}/edit`),
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: post => setDeleteTarget(post.id),
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "ব্লগ পোস্ট" : "Blog Posts"}
        description={isBn ? "এসইও ব্লগ পোস্ট পরিচালনা করুন" : "Manage SEO blog posts"}
        actions={
          <Link
            href={`/${locale}/admin/blog/new`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-600 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {isBn ? "নতুন পোস্ট" : "New Post"}
          </Link>
        }
      />

      {deleteTarget && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          title={isBn ? "পোস্ট মুছবেন?" : "Delete post?"}
          description={isBn ? "এই ব্লগ পোস্টটি স্থায়ীভাবে মুছে যাবে।" : "This blog post will be permanently deleted."}
          confirmLabel={isBn ? "হ্যাঁ, মুছুন" : "Yes, Delete"}
          confirmClassName="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ReusableTable
        data={posts}
        columns={columns}
        keyExtractor={post => post.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো ব্লগ পোস্ট নেই। নতুন তৈরি করুন।" : "No blog posts yet. Create your first one."}
        exportFilename="blog-posts"
      />
    </div>
  );
}
