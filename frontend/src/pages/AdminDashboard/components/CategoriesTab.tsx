import { useState } from 'react';
import { adminApi } from '../../../api/adminApi';

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface CategoriesTabProps {
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
}

const CategoriesTab = ({ categories, onCategoriesUpdate }: CategoriesTabProps) => {
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catMsg, setCatMsg] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    try {
      setCatMsg('');
      const category = await adminApi.createCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        isActive: true,
      });
      onCategoriesUpdate([category, ...categories]);
      setCatName('');
      setCatDesc('');
      setCatMsg('Category created successfully.');
    } catch (err: any) {
      setCatMsg(err?.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat._id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveEditCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      const updated = await adminApi.updateCategory(id, {
        name: editCatName.trim(),
        description: editCatDesc.trim() || undefined,
      });
      onCategoriesUpdate(categories.map((c) => (c._id === id ? updated : c)));
      setEditingCategory(null);
      setCatMsg('Category updated successfully.');
    } catch (err: any) {
      setCatMsg(err?.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleToggleCategory = async (id: string, isActive: boolean) => {
    try {
      const updated = await adminApi.updateCategory(id, { isActive: !isActive });
      onCategoriesUpdate(categories.map((c) => (c._id === id ? updated : c)));
    } catch {}
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      onCategoriesUpdate(categories.filter((c) => c._id !== id));
      setCatMsg('Category deleted successfully.');
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <h3 className="text-lg font-semibold">Create Category</h3>
        {catMsg && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            {catMsg}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Category Name"
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
            placeholder="Description (optional)"
            className="border rounded px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        <button
          onClick={handleCreateCategory}
          className="mt-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
        >
          Create Category
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-3">All Categories</h3>
        <div className="divide-y">
          {categories.map((c) => (
            <div key={c._id} className="py-3 flex items-center justify-between">
              {editingCategory === c._id ? (
                <div className="flex-1 grid gap-2 md:grid-cols-3">
                  <input
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <input
                    value={editCatDesc}
                    onChange={(e) => setEditCatDesc(e.target.value)}
                    placeholder="Description"
                    className="border rounded px-3 py-2 text-sm md:col-span-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEditCategory(c._id)}
                      className="bg-primary-600 text-white px-3 py-1 text-xs rounded hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="border px-3 py-1 text-xs rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleStartEditCategory(c)}
                      className="border rounded px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleCategory(c._id, c.isActive)}
                      className="border rounded px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="border rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesTab;

