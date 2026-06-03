export type Role = 'ADMIN' | 'WAREHOUSE' | 'DELIVERY' | 'CUSTOMER'
export type Locale = 'bn' | 'en'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'ASSIGNED' | 'ON_THE_WAY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED'

// ─── Shipping ────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  id: string
  label: string
  full_name_bn: string
  full_name_en: string
  phone: string
  address_bn: string
  address_en: string
  district: string
  thana: string
  post_code: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse extends AuthTokens {
  user: User
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface Profile {
  full_name_bn: string
  full_name_en: string
  avatar: string | null
  address_bn: string
  address_en: string
  district: string
  thana: string
  post_code: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  phone: string
  role: Role
  preferred_language: Locale
  is_active: boolean
  date_joined: string
  profile: Profile
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name_bn: string
  name_en: string
  name: string
  slug: string
  parent: string | null
  icon: string
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  image: string
  alt_bn: string
  alt_en: string
  order: number
}

export interface PackageItem {
  id: string
  component_id: string
  component_name_bn: string
  component_name_en: string
  component_sku: string
  quantity: string
  unit_price: string
}

export interface Product {
  id: string
  name_bn: string
  name_en: string
  name: string
  description_bn: string
  description_en: string
  description: string
  sku: string
  category: string
  category_name: string
  unit_price: string
  cost_price: string
  unit_bn: string
  unit_en: string
  unit: string
  is_package: boolean
  discount_type: 'NONE' | 'PERCENTAGE' | 'FLAT'
  discount_value: string
  is_active: boolean
  stock_on_hand: string
  images: ProductImage[]
  package_items: PackageItem[]
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  product: string
  movement_type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT'
  quantity: string
  reference_id: string | null
  note_bn: string
  note_en: string
  created_by: string
  created_by_email: string
  created_at: string
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartPackageItem {
  component_name_bn: string
  component_name_en: string
  quantity: string
}

export interface CartItem {
  id: string
  product: string
  product_name_bn: string
  product_name_en: string
  unit_price: string
  quantity: string
  line_total: string
  stock_on_hand: string
  is_package: boolean
  package_items: CartPackageItem[]
  product_image: string | null
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: string
  item_count: number
}

// ─── Order Tracking (public) ─────────────────────────────────────────────────

export interface DeliveryInfo {
  name_bn: string
  name_en: string
  phone: string
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
}

export interface OrderTracking {
  order_number: string
  status: OrderStatus
  status_label_bn: string
  status_label_en: string
  payment_method: 'COD' | 'ONLINE'
  payment_status: 'UNPAID' | 'PAID'
  payment_method_label_bn: string
  payment_method_label_en: string
  shipping_name_bn: string
  shipping_name_en: string
  shipping_phone: string
  shipping_address_bn: string
  shipping_district: string
  shipping_thana: string
  grand_total: string
  created_at: string
  delivery_info: DeliveryInfo | null
  timeline: StatusLogEntry[]
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface OrderPackageItem {
  component_name_bn: string
  component_name_en: string
  component_sku: string
  quantity: string
}

export interface SalesOrderItem {
  id: string
  product: string
  product_name_bn: string
  product_name_en: string
  unit_price: string
  quantity: string
  line_total: string
  is_package: boolean
  package_items: OrderPackageItem[]
}

export interface StatusLogEntry {
  id: string
  from_status: string
  to_status: string
  to_status_label: string
  changed_by: string
  changed_by_email: string
  changed_at: string
  note_bn: string
  note_en: string
}

export interface DeliveryAssignment {
  id: string
  delivery_person: string
  delivery_person_email: string
  delivery_person_phone: string
  delivery_person_name: string
  delivery_person_name_bn: string
  delivery_person_name_en: string
  assigned_at: string
  picked_up_at: string | null
  delivered_at: string | null
  tracking_note: string
}

export interface SalesOrder {
  id: string
  order_number: string
  customer: string
  customer_email: string
  status: OrderStatus
  status_label: string
  payment_method: 'COD' | 'ONLINE'
  payment_status: 'UNPAID' | 'PAID'
  shipping_name_bn: string
  shipping_name_en: string
  shipping_phone: string
  shipping_address_bn: string
  shipping_address_en: string
  shipping_district: string
  shipping_thana: string
  shipping_post_code: string
  subtotal: string
  discount_amount: string
  tax_amount: string
  grand_total: string
  notes_bn: string
  notes_en: string
  items: SalesOrderItem[]
  delivery: DeliveryAssignment | null
  created_at: string
  updated_at: string
}

// ─── Accounting ───────────────────────────────────────────────────────────────

export interface Account {
  id: string
  code: string
  name_bn: string
  name_en: string
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parent: string | null
  is_active: boolean
}

export interface JournalLine {
  id: string
  account: string
  account_code: string
  account_name_bn: string
  account_name_en: string
  debit: string
  credit: string
  memo_bn: string
  memo_en: string
}

export interface JournalEntry {
  id: string
  entry_number: string
  reference_type: string
  reference_id: string | null
  description_bn: string
  description_en: string
  created_by: string
  created_by_email: string
  created_at: string
  is_posted: boolean
  lines: JournalLine[]
  total_debit: string
  total_credit: string
}

// ─── API envelope ────────────────────────────────────────────────────────────

export interface ApiMeta {
  page?: number
  total?: number
  total_pages?: number
  page_size?: number
  locale?: string
}

export interface ApiResponse<T> {
  data: T
  meta: ApiMeta
}

export interface ApiError {
  error: {
    code: string
    message_bn: string
    message_en: string
    details?: unknown
  }
}
