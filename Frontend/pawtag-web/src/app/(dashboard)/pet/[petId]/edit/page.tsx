"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Trash2, Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { petService, type EmergencyContactInput } from "@/services/pet.service";
import { useAuth } from "@/hooks/useAuth";
import type { Pet } from "@/types";

const inputClass =
  "w-full h-[50px] px-[16px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

interface Contact { name: string; phone: string }

export default function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const { refreshPets } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [f, setF] = useState({
    name: "", species: "dog", breed: "", birthDate: "", gender: "", weight: "", color: "",
    contactPhone: "", emergencyMessage: "", identificationNotes: "",
    allergies: "", conditions: "", medications: "", bloodType: "", microchipId: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    let on = true;
    petService.getById(petId).then((p: Pet) => {
      if (!on) return;
      setF({
        name: p.name ?? "", species: p.species ?? "dog", breed: p.breed ?? "",
        birthDate: p.birthDate ?? "", gender: p.gender ?? "", weight: p.weight ?? "", color: p.color ?? "",
        contactPhone: p.phone ?? "", emergencyMessage: p.emergencyMessage ?? "", identificationNotes: p.identificationNotes ?? "",
        allergies: p.medical?.allergies ?? "", conditions: p.medical?.conditions ?? "",
        medications: p.medical?.medications ?? "", bloodType: p.medical?.bloodType ?? "", microchipId: p.medical?.microchipId ?? "",
      });
      if (p.photo) setPhotoPreview(p.photo);
      setContacts((p.emergencyContacts ?? []).map((c) => ({ name: c.name ?? "", phone: c.phone ?? "" })));
    }).catch(() => setError("Could not load pet.")).finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [petId]);

  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }
  const setContact = (i: number, k: keyof Contact, v: string) => setContacts((p) => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const addContact = () => setContacts((p) => [...p, { name: "", phone: "" }]);
  const removeContact = (i: number) => setContacts((p) => p.filter((_, idx) => idx !== i));

  async function save() {
    if (!f.name.trim()) { setError("Pet name is required."); return; }
    setError(""); setSaving(true);
    try {
      const emergencyContacts: EmergencyContactInput[] = contacts
        .filter((c) => c.phone.trim())
        .map((c, i) => ({ name: c.name || undefined, phone: c.phone.trim(), priority: i + 1 }));
      await petService.update(petId, {
        name: f.name.trim(),
        species: f.species,
        breed: f.breed,
        birthDate: f.birthDate || undefined,
        gender: f.gender || undefined,
        weight: f.weight ? Number(f.weight) : undefined,
        color: f.color,
        contactPhone: f.contactPhone,
        emergencyMessage: f.emergencyMessage,
        identificationNotes: f.identificationNotes,
        allergies: f.allergies,
        conditions: f.conditions,
        medications: f.medications,
        bloodType: f.bloodType,
        microchipId: f.microchipId,
        emergencyContacts,
      });
      if (photoFile) { try { await petService.uploadPhoto(petId, photoFile); } catch { /* giữ */ } }
      await refreshPets();
      router.push(ROUTES.petDetail(petId));
    } catch {
      setError("Could not save changes. Please try again.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-full"><Loader2 size={28} className="text-[#4A8FE8] animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-full bg-[#F7F9FC]">
      <header className="bg-white px-5 pt-4 pb-4 flex items-center gap-3">
        <Link href={ROUTES.petDetail(petId)} className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center active:scale-90"><ArrowLeft size={18} className="text-[#1A2332]" /></Link>
        <h1 className="text-[20px] font-black text-[#1A2332] font-display">Edit Pet Profile</h1>
      </header>

      <div className="px-5 py-5 flex flex-col gap-5">
        {/* Photo */}
        <label className="relative h-44 rounded-3xl overflow-hidden border-2 border-dashed border-[#4A8FE8]/30 bg-[#EEF5FF]/30 flex items-center justify-center cursor-pointer">
          {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : (
            <div className="flex flex-col items-center gap-2 text-[#4A8FE8]"><Camera size={32} /><span className="text-[14px] font-bold font-display">Change photo</span></div>
          )}
          <span className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-white/90 text-[12px] font-bold text-[#4A8FE8] font-display flex items-center gap-1"><Camera size={13} /> Change</span>
          <input type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
        </label>

        <Section title="Basic Info">
          <Lbl t="Pet Name *"><input className={inputClass} value={f.name} onChange={(e) => set("name", e.target.value)} aria-label="Name" /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Species">
              <select className={inputClass} value={f.species} onChange={(e) => set("species", e.target.value)} aria-label="Species">
                {["dog", "cat", "rabbit", "bird", "other"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Lbl>
            <Lbl t="Gender">
              <select className={inputClass} value={f.gender} onChange={(e) => set("gender", e.target.value)} aria-label="Gender">
                <option value="">—</option><option value="male">Male</option><option value="female">Female</option>
              </select>
            </Lbl>
          </div>
          <Lbl t="Breed"><input className={inputClass} value={f.breed} onChange={(e) => set("breed", e.target.value)} aria-label="Breed" /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Birth Date"><input type="date" className={inputClass} value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} aria-label="Birth date" /></Lbl>
            <Lbl t="Weight (kg)"><input type="number" className={inputClass} value={f.weight} onChange={(e) => set("weight", e.target.value)} aria-label="Weight" /></Lbl>
          </div>
          <Lbl t="Color"><input className={inputClass} value={f.color} onChange={(e) => set("color", e.target.value)} aria-label="Color" /></Lbl>
          <Lbl t="Identifying Features"><textarea rows={2} className={`${inputClass} h-auto py-3`} value={f.identificationNotes} onChange={(e) => set("identificationNotes", e.target.value)} aria-label="Identifying features" /></Lbl>
        </Section>

        <Section title="Contact & Message">
          <Lbl t="Contact Phone"><input type="tel" className={inputClass} value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} aria-label="Contact phone" /></Lbl>
          <Lbl t="Emergency Message"><textarea rows={3} className={`${inputClass} h-auto py-3`} value={f.emergencyMessage} onChange={(e) => set("emergencyMessage", e.target.value)} aria-label="Emergency message" /></Lbl>
        </Section>

        <Section title="Medical">
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Blood Type"><input className={inputClass} value={f.bloodType} onChange={(e) => set("bloodType", e.target.value)} aria-label="Blood type" /></Lbl>
            <Lbl t="Microchip ID"><input className={inputClass} value={f.microchipId} onChange={(e) => set("microchipId", e.target.value)} aria-label="Microchip" /></Lbl>
          </div>
          <Lbl t="Allergies"><input className={inputClass} value={f.allergies} onChange={(e) => set("allergies", e.target.value)} aria-label="Allergies" /></Lbl>
          <Lbl t="Conditions / Notes"><input className={inputClass} value={f.conditions} onChange={(e) => set("conditions", e.target.value)} aria-label="Conditions" /></Lbl>
          <Lbl t="Medications"><input className={inputClass} value={f.medications} onChange={(e) => set("medications", e.target.value)} aria-label="Medications" /></Lbl>
        </Section>

        <Section title="Emergency Contacts">
          {contacts.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 bg-[#F7F9FC] rounded-2xl p-3">
              <div className="flex items-center justify-between"><span className="text-[12px] font-bold text-[#9BAABB] font-display">Contact {i + 1}</span><button type="button" aria-label="Remove" onClick={() => removeContact(i)}><Trash2 size={16} className="text-[#9BAABB]" /></button></div>
              <input className={inputClass} placeholder="Full name" value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} aria-label="Contact name" />
              <input className={inputClass} placeholder="Phone" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} aria-label="Contact phone" />
            </div>
          ))}
          <button type="button" onClick={addContact} className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#4A8FE8]/40 text-[#4A8FE8] font-bold font-display"><Plus size={16} /> Add Contact</button>
        </Section>

        {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}

        <button type="button" onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] font-display shadow-cta active:scale-95 disabled:opacity-70">
          {saving ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-card p-4 flex flex-col gap-3">
      <p className="text-[16px] font-extrabold text-[#1A2332] font-display">{title}</p>
      {children}
    </div>
  );
}
function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <div><label className="block text-[13px] font-semibold text-[#6B7A8D] font-body mb-1.5">{t}</label>{children}</div>;
}
