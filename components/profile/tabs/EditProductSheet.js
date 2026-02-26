"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/utility_collection";

export default function EditProductSheet({
    open,
    setOpen,
    user,
    setUser,
    ujbCode // ✅ from parent
}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    /* -------------------- Load Existing -------------------- */

    useEffect(() => {
        if (!user) return;

        const raw = Array.isArray(user?.products)
            ? user.products
            : [];

        // Normalize keywords safely
        const normalized = raw.map((p) => ({
            ...p,
            keywords: Array.isArray(p.keywords)
                ? p.keywords
                : typeof p.keywords === "string"
                    ? p.keywords.split(",").map((k) => k.trim())
                    : [],
        }));

        setProducts(normalized);
    }, [user]);

    /* -------------------- Add Product -------------------- */

    const addProduct = () => {
        setProducts([
            ...products,
            {
                name: "",
                description: "",
                imageURL: "",
                keywords: [],
                agreedValue: {
                    mode: "single",
                    single: {
                        type: "percentage",
                        value: "",
                    },
                },
            },
        ]);
    };

    /* -------------------- Update Product -------------------- */

    const updateProduct = (index, key, value) => {
        const updated = [...products];
        updated[index][key] = value;
        setProducts(updated);
    };

    const updateCommission = (index, key, value) => {
        const updated = [...products];
        updated[index].agreedValue.single[key] = value;
        setProducts(updated);
    };

    const removeProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    /* -------------------- Keywords -------------------- */

    const addKeyword = (index, keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;

        const updated = [...products];
        const existing = updated[index].keywords || [];

        if (!existing.includes(trimmed)) {
            updated[index].keywords = [...existing, trimmed];
            setProducts(updated);
        }
    };

    const removeKeyword = (index, keyword) => {
        const updated = [...products];
        updated[index].keywords =
            updated[index].keywords.filter((k) => k !== keyword);
        setProducts(updated);
    };

    /* -------------------- Image Upload -------------------- */

    const uploadImage = async (e, index) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            // const ujbCode = localStorage.getItem("mmUJBCode");

            const storageRef = ref(
                storage,
                `productImages/${ujbCode}/${Date.now()}-${file.name}`
            );

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            const updated = [...products];
            updated[index].imageURL = url + "?t=" + Date.now();
            setProducts(updated);
        } catch (err) {
            console.error("Product image upload failed:", err);
        }
    };

    /* -------------------- Save -------------------- */

    const handleSave = async () => {
        try {
            setLoading(true);
            // const ujbCode = localStorage.getItem("mmUJBCode");

            await updateDoc(
                doc(db, COLLECTIONS.userDetail, ujbCode),
                { products }
            );

            if (typeof setUser === "function") {
                setUser((prev) => ({ ...prev, products }));
            }

            setOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    //   if (!open) return null;

    return (
        <>
            <div
                onClick={() => setOpen(false)}
                className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300
      ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
    `}
            />

            {/* Bottom Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-99
    max-h-[90vh] flex flex-col
    transform transition-transform duration-300 ease-out pt-4 mt-10
    ${open ? "translate-y-0" : "translate-y-full"}
  `}
            >
                {/* <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" /> */}

                <div className="flex justify-between items-center px-6 mb-4">
                    <h3 className="font-semibold text-lg">
                        Edit Products
                    </h3>
                    <button onClick={() => setOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 pb-28 space-y-6">

                    {(products ?? []).map((product, index) => (
                        <div key={index} className="border border-slate-300 rounded-xl p-4 space-y-4">

                            <Input
                                label="Product Name"
                                value={product.name}
                                onChange={(v) =>
                                    updateProduct(index, "name", v)
                                }
                            />

                            <Textarea
                                label="Description"
                                value={product.description}
                                onChange={(v) =>
                                    updateProduct(index, "description", v)
                                }
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Commission Type"
                                    value={product.agreedValue?.single?.type}
                                    options={["percentage", "fixed"]}
                                    onChange={(v) =>
                                        updateCommission(index, "type", v)
                                    }
                                />

                                <Input
                                    label="Commission Value"
                                    value={product.agreedValue?.single?.value}
                                    onChange={(v) =>
                                        updateCommission(index, "value", v)
                                    }
                                />
                            </div>

                            {/* Image */}
                            <div>
                                <label className="text-sm text-gray-500">
                                    Product Image
                                </label>

                                {product.imageURL && (
                                    <img
                                        src={product.imageURL}
                                        className="w-full h-32 object-cover rounded-lg mt-2"
                                    />
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => uploadImage(e, index)}
                                    className="mt-2 text-sm"
                                />
                            </div>

                            <KeywordInput
                                keywords={product.keywords || []}
                                onAdd={(k) => addKeyword(index, k)}
                                onRemove={(k) =>
                                    removeKeyword(index, k)
                                }
                            />

                            <button
                                onClick={() => removeProduct(index)}
                                className="text-red-500 text-sm flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Remove Product
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addProduct}
                        className="w-full bg-orange-100 text-orange-600 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Product
                    </button>

                </div>

                <div className="p-6 border-t bg-white">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
}

/* -------------------- Reusable Inputs -------------------- */

function Input({ label, value, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">
                {label}
            </label>
            <input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );
}

function Textarea({ label, value, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">
                {label}
            </label>
            <textarea
                rows={3}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
        </div>
    );
}

function Select({ label, value, options, onChange }) {
    return (
        <div>
            <label className="text-sm text-gray-500">
                {label}
            </label>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

function KeywordInput({ keywords, onAdd, onRemove }) {
    const [value, setValue] = useState("");

    return (
        <div>
            <label className="text-sm text-gray-500">
                Keywords
            </label>

            <div className="flex gap-2 mt-2">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
                <button
                    onClick={() => {
                        onAdd(value);
                        setValue("");
                    }}
                    className="bg-orange-500 text-white px-4 rounded-xl text-sm"
                >
                    Add
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {(Array.isArray(keywords) ? keywords : []).map((k) => (
                    <span
                        key={k}
                        onClick={() => onRemove(k)}
                        className="px-3 py-1 text-xs bg-gray-200 rounded-full cursor-pointer"
                    >
                        {k} ✕
                    </span>
                ))}
            </div>
        </div>
    );
}