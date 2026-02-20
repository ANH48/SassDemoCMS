export type TenantStatus =
  | "QUEUED"
  | "PROVISIONING"
  | "ACTIVE"
  | "SUSPENDED"
  | "FAILED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type ProductType =
  | "GOODS"
  | "SERVICE_PACKAGE"
  | "MATERIAL_TRACKED"
  | "RAW_MATERIAL"
  | "SERVICE";

export type ServiceRecordStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
