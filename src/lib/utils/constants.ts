/**
 * Shared constants for property types, categories, states, and other enumerations
 * used throughout the LOCATION platform.
 */

/** Australian states and territories */
export const AUSTRALIAN_STATES = [
    { value: "nsw", label: "New South Wales" },
    { value: "vic", label: "Victoria" },
    { value: "qld", label: "Queensland" },
    { value: "wa", label: "Western Australia" },
    { value: "sa", label: "South Australia" },
    { value: "tas", label: "Tasmania" },
    { value: "act", label: "Australian Capital Territory" },
    { value: "nt", label: "Northern Territory" },
] as const;

/** Top-level property types (maps to REAXML listing types) */
export const PROPERTY_TYPES = [
    { value: "residential", label: "Residential" },
    { value: "rental", label: "Rental" },
    { value: "commercial", label: "Commercial" },
    { value: "land", label: "Land" },
    { value: "rural", label: "Rural" },
    { value: "holidayRental", label: "Holiday Rental" },
] as const;

/** Listing type — sale or rent */
export const LISTING_TYPES = [
    { value: "sale", label: "For Sale" },
    { value: "rent", label: "For Rent" },
    { value: "lease", label: "For Lease" },
    { value: "both", label: "Sale or Lease" },
] as const;

/** Residential/rental categories (maps to REAXML <category @name>) */
export const RESIDENTIAL_CATEGORIES = [
    "House",
    "Unit",
    "Townhouse",
    "Villa",
    "Apartment",
    "Flat",
    "Studio",
    "Warehouse",
    "DuplexSemi-detached",
    "Alpine",
    "AcreageSemi-rural",
    "Retirement",
    "BlockOfUnits",
    "Terrace",
    "ServicedApartment",
    "Other",
] as const;

/** Rural categories */
export const RURAL_CATEGORIES = [
    "Cropping",
    "Dairy",
    "Farmlet",
    "Horticulture",
    "Livestock",
    "Viticulture",
    "MixedFarming",
    "Lifestyle",
    "Other",
] as const;

/** Listing statuses */
export const LISTING_STATUSES = [
    "current",
    "withdrawn",
    "offmarket",
    "sold",
    "leased",
    "deleted",
] as const;

/** Authority types */
export const AUTHORITY_TYPES = [
    "auction",
    "exclusive",
    "multilist",
    "conjunctional",
    "open",
    "sale",
    "setsale",
] as const;

/** Default pagination values */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
