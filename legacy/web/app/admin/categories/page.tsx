"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Search,
  RefreshCw,
  BookOpen,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  books_count?: number;
  created_at?: string;
}

const SEED_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Trí Tuệ Nhân Tạo & Học Máy (AI & ML)",
    slug: "tri-tue-nhan-tao-va-hoc-may",
    description: "Sách chuyên sâu về Generative AI, RAG Systems, LLM Engineering và Computer Vision.",
    is_active: true,
    books_count: 6,
    created_at: "2026-09-01",
  },
  {
    id: "cat-2",
    name: "Kiến Trúc Phần Mềm & Hệ Thống Lớn",
    slug: "kien-truc-phan-mem-va-he-thong-lon",
    description: "Clean Architecture, Microservices, Domain-Driven Design và High-Concurrency Systems.",
    is_active: true,
    books_count: 4,
    created_at: "2026-09-02",
  },
  {
    id: "cat-3",
    name: "Lập Trình Web Hiện Đại & Frontend",
    slug: "lap-trinh-web-hien-dai-va-frontend",
    description: "Next.js 15, React 19, TypeScript, WebAssembly và Tailwind CSS cao cấp.",
    is_active: true,
    books_count: 5,
    created_at: "2026-09-03",
  },
  {
    id: "cat-4",
    name: "Cơ Sở Dữ Liệu & Điện Toán Đám Mây",
    slug: "co-so-du-lieu-va-cloud-computing",
    description: "PostgreSQL, pgvector, Vector Databases, Redis Caching và Docker / Kubernetes.",
    is_active: true,
    books_count: 3,
    created_at: "2026-09-05",
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(SEED_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "mock_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCategories(data);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleCategory = (id: string, currentStatus: boolean, name: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !currentStatus } : c))
    );
    setActionNotice(`Đã ${currentStatus ? "ẩn" : "kích hoạt"} thể loại "${name}".`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const token = localStorage.getItem("aurabook_access_token") || "mock_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [created, ...prev]);
      } else {
        // Local simulation fallback
        const simulated: CategoryItem = {
          id: `cat-${Date.now()}`,
          name: newName.trim(),
          slug: newName.toLowerCase().replace(/ /g, "-"),
          description: newDesc.trim(),
          is_active: true,
          books_count: 0,
          created_at: new Date().toLocaleDateString("vi-VN"),
        };
        setCategories((prev) => [simulated, ...prev]);
      }

      setActionNotice(`Đã thêm mới thể loại "${newName.trim()}".`);
      setShowAddModal(false);
      setNewName("");
      setNewDesc("");
      setTimeout(() => setActionNotice(null), 3500);
    } catch {
      // simulated
      setShowAddModal(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Quản Lý Thể Loại & Nhóm Danh Mục Sách
                </h1>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                  Phân Loại Ấn Phẩm
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổ chức danh mục chuyên đề công nghệ, quản lý slug tìm kiếm thân thiện SEO và điều phối bộ lọc sàn sách
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchCategories}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            Thêm Thể Loại Mới
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          ✓ {actionNotice}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên thể loại, slug..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>
        <div className="text-xs font-bold text-slate-400">
          Tổng số: <strong className="text-slate-800">{categories.length}</strong> thể loại
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">/{c.slug}</p>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] font-bold ${
                    c.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {c.is_active ? "Đang hiển thị" : "Đã ẩn"}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                {c.description || "Chưa có mô tả chi tiết cho nhóm thể loại này."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>{c.books_count ?? 4} đầu sách trực thuộc</span>
              </div>

              <button
                onClick={() => handleToggleCategory(c.id, c.is_active, c.name)}
                className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] font-bold"
                title={c.is_active ? "Ẩn danh mục" : "Hiện danh mục"}
              >
                {c.is_active ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-700">Kích hoạt</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-400">Tắt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900">Thêm Thể Loại Sách Mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Thể Loại / Chuyên Đề
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: An Toàn Thông Tin & Mạng Máy Tính"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô Tả Chuyên Đề
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung các đầu sách thuộc nhóm này..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs border-slate-200"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20"
                >
                  Tạo Thể Loại
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
