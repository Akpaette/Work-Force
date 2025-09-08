export const DEPARTMENTS = [
  { id: "general-overseers", name: "General Overseers", icon: "crown", color: "purple" },
  { id: "church-executives", name: "Church Executives", icon: "user-tie", color: "blue" },
  { id: "pastors", name: "Pastors", icon: "cross", color: "green" },
  { id: "evangelists", name: "Evangelists", icon: "bible", color: "orange" },
  { id: "administrative-staff", name: "Administrative Staff", icon: "briefcase", color: "indigo" },
  { id: "other-workers", name: "Other Workers", icon: "users", color: "gray" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "volunteer", label: "Volunteer" },
  { value: "contract", label: "Contract" },
] as const;

export const ORDINATION_STATUS = [
  { value: "ordained", label: "Ordained" },
  { value: "licensed", label: "Licensed" },
  { value: "not-ordained", label: "Not Ordained" },
] as const;

export const EDUCATION_LEVELS = [
  { value: "high-school", label: "High School" },
  { value: "ond", label: "OND (Ordinary National Diploma)" },
  { value: "nce", label: "NCE (National Certificate in Education)" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export const RELATIONSHIP_STATUS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "engaged", label: "Engaged" },
  { value: "separated", label: "Separated" },
] as const;

export const STAFF_STATUS = [
  { value: "active", label: "Active", color: "green", badge: "default" },
  { value: "inactive", label: "Not Active", color: "red", badge: "destructive" },
  { value: "released", label: "Released", color: "orange", badge: "secondary" },
  { value: "retired", label: "Retired", color: "blue", badge: "outline" },
] as const;
