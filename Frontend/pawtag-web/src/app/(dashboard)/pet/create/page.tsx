"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, ArrowRight, Trash2, Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { petService, type EmergencyContactInput } from "@/services/pet.service";
import { useAuth } from "@/hooks/useAuth";

const inputClass =
  "w-full h-[52px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

const PHOTO_TIPS = [
  "Clear front-facing photo",
  "Good lighting, no flash",
  "Recent photo (last 6 months)",
  "Shows pet's natural color",
];

const TAG_INCLUDES = [
  "QR Code for instant scan",
  "NFC chip programming",
  "Emergency contact info",
  "Live pet profile page",
  "Scan alerts to your phone",
];

/** "2 years, 6 months" → ISO birthDate (xấp xỉ). */
function ageToBirthDate(text: string): string | undefined {
  const y = /(\d+)\s*year/i.exec(text);
  const m = /(\d+)\s*month/i.exec(text);
  if (!y && !m) return undefined;
  const d = new Date();
  if (y) d.setFullYear(d.getFullYear() - parseInt(y[1], 10));
  if (m) d.setMonth(d.getMonth() - parseInt(m[1], 10));
  return d.toISOString().slice(0, 10);
}

interface Contact { name: string; phone: string }

export default function CreatePetPage() {
  const router = useRouter();
  const { user, refreshPets } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2
  const [name, setName]       = useState("");
  const [breed, setBreed]     = useState("");
  const [age, setAge]         = useState("");
  const [gender, setGender]   = useState("");
  const [features, setFeatures] = useState("");

  // Step 3
  const [contacts, setContacts] = useState<Contact[]>([
    { name: user?.name ?? "", phone: user?.phone ?? "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  function setContact(i: number, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }
  function addContact() { setContacts((prev) => [...prev, { name: "", phone: "" }]); }
  function removeContact(i: number) { setContacts((prev) => prev.filter((_, idx) => idx !== i)); }

  function next() {
    if (step === 2 && !name.trim()) { setError("Pet name is required."); return; }
    if (step === 3) { submit(); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!name.trim()) { setError("Pet name is required."); setStep(2); return; }
    const primary = contacts[0];
    if (!primary?.phone.trim()) { setError("Primary contact phone is required."); return; }
    setError("");
    setSaving(true);
    try {
      const emergencyContacts: EmergencyContactInput[] = contacts
        .filter((c) => c.phone.trim())
        .map((c, i) => ({ name: c.name || undefined, phone: c.phone.trim(), priority: i + 1 }));

      const pet = await petService.create({
        name: name.trim(),
        species: "dog",
        breed: breed || undefined,
        gender: gender || undefined,
        birthDate: ageToBirthDate(age),
        identificationNotes: features || undefined,
        contactPhone: primary.phone.trim(),
        emergencyContacts,
      });

      if (photoFile) { try { await petService.uploadPhoto(pet.id, photoFile); } catch { /* giữ pet */ } }
      await refreshPets();
      router.push(ROUTES.petTags(pet.id));
    } catch {
      setError("Could not create pet. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F7F9FC]">

      {/* Header */}
      <header className="bg-white px-5 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={() => (step === 1 ? router.back() : setStep((s) => s - 1))}
            className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center active:scale-90"
          >
            <ArrowLeft size={18} className="text-[#1A2332]" />
          </button>
          <div>
            <h1 className="text-[22px] font-black text-[#1A2332] font-display leading-none">Create Pet Profile</h1>
            <p className="text-[13px] text-[#9BAABB] font-body mt-1">Step {step} of 3</p>
          </div>
        </div>
      </header>
      {/* Progress bar */}
      <div className="h-1.5 bg-[#E1E7F0]">
        <div className={`h-full gradient-brand transition-all duration-300 ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`} />
      </div>

      <div className="flex-1 px-5 pt-6 pb-6 flex flex-col">

        {/* ── Step 1: Photo ── */}
        {step === 1 && (
          <>
            <h2 className="text-[26px] font-black text-[#1A2332] font-display">Pet&apos;s Photo 📸</h2>
            <p className="text-[15px] text-[#6B7A8D] font-body mt-1 mb-6">Add a clear photo of your pet&apos;s face</p>

            <label className="border-2 border-dashed border-[#4A8FE8]/40 rounded-3xl h-64 flex flex-col items-center justify-center gap-3 bg-[#EEF5FF]/30 cursor-pointer active:scale-[0.99] transition-all overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-[#E1EAFB] flex items-center justify-center"><Camera size={36} className="text-[#4A8FE8]" /></div>
                  <p className="text-[18px] font-bold text-[#4A8FE8] font-display">Tap to upload photo</p>
                  <p className="text-[14px] text-[#9BAABB] font-body">JPG, PNG up to 10MB</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            </label>

            <div className="mt-6 rounded-2xl bg-[#EEF2FB] p-5">
              <p className="text-[16px] font-bold text-[#4A8FE8] font-display mb-3">📸 Photo Tips</p>
              <div className="flex flex-col gap-2.5">
                {PHOTO_TIPS.map((t) => (
                  <div key={t} className="flex items-center gap-2.5">
                    <Check size={16} className="text-[#22C55E] shrink-0" strokeWidth={3} />
                    <span className="text-[15px] text-[#1A2332] font-body">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Basic Info ── */}
        {step === 2 && (
          <>
            <h2 className="text-[26px] font-black text-[#1A2332] font-display">Basic Info 🐾</h2>
            <p className="text-[15px] text-[#6B7A8D] font-body mt-1 mb-6">Tell us about your pet</p>

            <div className="flex flex-col gap-5">
              <Field label="Pet Name *"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bobby, Luna, Mochi..." className={inputClass} aria-label="Pet name" /></Field>
              <Field label="Breed"><input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Pembroke Welsh Corgi" className={inputClass} aria-label="Breed" /></Field>
              <Field label="Age"><input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2 years, 6 months" className={inputClass} aria-label="Age" /></Field>
              <Field label="Gender">
                <div className="grid grid-cols-2 gap-3">
                  {[{ k: "male", l: "♂ Male" }, { k: "female", l: "♀ Female" }].map(({ k, l }) => (
                    <button key={k} type="button" onClick={() => setGender(k)} className={`h-[52px] rounded-2xl font-bold text-[15px] font-display transition-all active:scale-95 ${gender === k ? "gradient-brand text-white shadow-cta" : "bg-[#F0F4FA] text-[#6B7A8D] border border-[rgba(74,143,232,0.12)]"}`}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="Identifying Features">
                <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} placeholder="Color, markings, collar, special features..." aria-label="Identifying features" className="w-full px-[18px] py-3 rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB] resize-none" />
              </Field>
            </div>
          </>
        )}

        {/* ── Step 3: Emergency Contacts ── */}
        {step === 3 && (
          <>
            <h2 className="text-[26px] font-black text-[#1A2332] font-display">Emergency Contacts 📞</h2>
            <p className="text-[15px] text-[#6B7A8D] font-body mt-1 mb-6">Who to contact if your pet is found</p>

            <div className="flex flex-col gap-4">
              {contacts.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[16px] font-extrabold text-[#1A2332] font-display">
                      {i === 0 ? "Primary Contact " : "Secondary Contact"}
                      {i === 0 && <span className="text-[#EF4444]">*</span>}
                    </p>
                    {i > 0 && (
                      <button type="button" aria-label="Remove contact" onClick={() => removeContact(i)}><Trash2 size={18} className="text-[#9BAABB]" /></button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <input type="text" value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} placeholder="Full name" aria-label="Contact name" className={inputClass} />
                    <input type="tel" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} placeholder="Phone number" aria-label="Contact phone" className={inputClass} />
                  </div>
                </div>
              ))}

              <button type="button" onClick={addContact} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#4A8FE8]/40 text-[#4A8FE8] font-bold font-display active:scale-95">
                <Plus size={18} /> Add Another Contact
              </button>

              <div className="rounded-2xl bg-gradient-to-br from-[#EEF5FF] to-[#EDF7F2] p-5">
                <p className="text-[16px] font-extrabold text-[#4A8FE8] font-display mb-3">🎉 Almost done! Your tag will include:</p>
                <div className="flex flex-col gap-2.5">
                  {TAG_INCLUDES.map((t) => (
                    <div key={t} className="flex items-center gap-2.5">
                      <Check size={16} className="text-[#22C55E] shrink-0" strokeWidth={3} />
                      <span className="text-[15px] text-[#1A2332] font-body">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-[13px] text-[#EF4444] font-body text-center mt-4">{error}</p>}

        {/* Footer buttons */}
        <div className="mt-7 flex gap-3">
          {step === 3 && (
            <button type="button" onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-1 py-4 rounded-2xl border-2 border-[#4A8FE8] text-[#4A8FE8] font-bold text-[16px] font-display active:scale-95">
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className={`${step === 3 ? "flex-1" : "w-full"} flex items-center justify-center gap-2 py-4 rounded-2xl gradient-brand text-white font-extrabold text-[17px] font-display shadow-cta transition-all active:scale-95 disabled:opacity-70`}
          >
            {saving ? (
              <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /><span>Creating...</span></>
            ) : step === 3 ? (
              <>🎉 Create My Tag!</>
            ) : (
              <>Continue <ArrowRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[15px] font-bold text-[#1A2332] font-display mb-2">{label}</label>
      {children}
    </div>
  );
}
