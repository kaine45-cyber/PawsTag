export type TagType = "qr" | "nfc" | "both";
export interface Tag { id: string; petId: string; publicCode: string; type: TagType; nfcEnabled: boolean; createdAt: string; }
