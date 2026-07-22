import { createGenericStore } from "../../../../../core/store/resource.store";

export interface ICarousel {
    carouselId: string;           // Guid  → string (UUID)
    title: string;                // Required, max 200
    description: string | null;   // Optional
    buttonText: string | null;    // Optional, max 100
    buttonLink: string | null;    // Optional, max 500
    imageUrl: string;             // Required
    displayOrder: number;         // Min 1, default 1
    isActive: boolean;            // Required
}

export const carouselStore = createGenericStore<ICarousel>();