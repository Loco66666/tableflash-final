"use client";

import { useState, useTransition } from "react";
import { createCategory, createItem, deleteItem, toggleItemAvailability } from "./actions";

type Category = { id: string; name: string; description: string | null; is_active: boolean };
type Item = { id: string; name: string; description: string | null; price_cents: number; is_available: boolean; category_id: string | null };

export function MenuManagerSupabase({ categories, items }: { categories: Category[]; items: Item[] }) {
  const [pending, startTransition] = useTransition();
  const [catName, setCatName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  const uncategorized = items.filter((item) => !item.category_id);

  return (
    <div className="grid gap-4">
      {categories.length === 0 && items.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-2xl font-black text-slate-900">Aucun produit pour le moment</h2>
          <p className="mt-2 text-base font-semibold text-slate-600">Ajoutez vos premières catégories et plats pour préparer votre menu QR.</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-black">Ajouter une catégorie</h3>
        <div className="mt-3 flex gap-2">
          <input className="min-h-11 flex-1 rounded-xl border px-3" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nom de catégorie" />
          <button className="rounded-xl bg-emerald-700 px-4 text-white" disabled={pending} onClick={() => startTransition(async () => { await createCategory({ name: catName }); setCatName(""); })}>Créer</button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-black">Ajouter un produit</h3>
        <div className="mt-3 grid gap-2">
          <input className="min-h-11 rounded-xl border px-3" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Nom du produit" />
          <input className="min-h-11 rounded-xl border px-3" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="Prix (€)" inputMode="decimal" />
          <select className="min-h-11 rounded-xl border px-3" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
            <option value="">Sans catégorie</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <button className="min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white" disabled={pending} onClick={() => startTransition(async () => { await createItem({ name: itemName, price_eur: Number(itemPrice.replace(",", ".")), category_id: itemCategory || null }); setItemName(""); setItemPrice(""); setItemCategory(""); })}>Créer le produit</button>
        </div>
      </section>

      {categories.map((category) => (
        <section key={category.id} className="rounded-3xl border border-slate-200 bg-white p-4">
          <h3 className="text-xl font-black">{category.name}</h3>
          <ul className="mt-3 grid gap-2">
            {items.filter((item) => item.category_id === category.id).map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-slate-600">{(item.price_cents / 100).toFixed(2)} €</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border px-3" onClick={() => startTransition(async () => toggleItemAvailability({ id: item.id, is_available: !item.is_available }))}>{item.is_available ? "Disponible" : "Indisponible"}</button>
                  <button className="rounded-lg border px-3 text-red-600" onClick={() => startTransition(async () => deleteItem({ id: item.id }))}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {uncategorized.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4">
          <h3 className="text-xl font-black">Sans catégorie</h3>
          <ul className="mt-3 grid gap-2">{uncategorized.map((item) => <li key={item.id} className="rounded-xl border p-3 font-bold">{item.name}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}
