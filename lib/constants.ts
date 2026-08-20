import {
  ShieldCheck,
  Moon,
  Volume2,
  Sparkles as SparklesIcon,
  Footprints,
  Users,
  PartyPopper,
  Car,
  School,
  Stethoscope,
  Pill,
  ShoppingCart,
  Church,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { EssentialCategory, RatingDimension } from "./types";

export const RATING_DIMENSIONS: RatingDimension[] = [
  "safety_day",
  "safety_night",
  "noise",
  "cleanliness",
  "walkability",
  "family_friendly",
  "nightlife",
  "traffic",
];

export const RATING_LABELS: Record<RatingDimension, string> = {
  safety_day: "Sécurité (jour)",
  safety_night: "Sécurité (soir)",
  noise: "Bruit",
  cleanliness: "Propreté",
  walkability: "Marchabilité",
  family_friendly: "Familial",
  nightlife: "Vie nocturne",
  traffic: "Circulation",
};

export const RATING_ICONS: Record<RatingDimension, LucideIcon> = {
  safety_day: ShieldCheck,
  safety_night: Moon,
  noise: Volume2,
  cleanliness: SparklesIcon,
  walkability: Footprints,
  family_friendly: Users,
  nightlife: PartyPopper,
  traffic: Car,
};

// The three dimensions shown as compact bars on the map list + preview.
export const HEADLINE_DIMENSIONS: RatingDimension[] = [
  "safety_day",
  "walkability",
  "family_friendly",
];

export const ESSENTIAL_CATEGORIES: EssentialCategory[] = [
  "schools",
  "clinics",
  "pharmacies",
  "supermarkets",
  "mosques",
  "parks",
];

export const ESSENTIAL_LABELS: Record<EssentialCategory, string> = {
  schools: "Écoles",
  clinics: "Cliniques",
  pharmacies: "Pharmacies",
  supermarkets: "Supermarchés",
  mosques: "Mosquées",
  parks: "Parcs",
};

export const ESSENTIAL_ICONS: Record<EssentialCategory, LucideIcon> = {
  schools: School,
  clinics: Stethoscope,
  pharmacies: Pill,
  supermarkets: ShoppingCart,
  mosques: Church,
  parks: Trees,
};

export const AI_MATCHES_STORAGE_KEY = "quartier-os:ai-matches";
