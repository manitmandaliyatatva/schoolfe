import { createGenericStore } from "../../core/store/resource.store";

export interface Base64Document {
    fileName: string;
    contentType: string;
    base64: string;
}

export const base64DocumentStore = createGenericStore<Base64Document>();