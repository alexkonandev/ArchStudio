import type { EnumDefinition, Field, FieldType, Relation, SchemaAst, Table } from "@/types";
import type { ParsedSchema } from "@/lib/engine/parser";

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  schema: ParsedSchema;
}

const uid = (p: string, n: string): string => `${p}-${n}`;

const f = (
  table: string,
  name: string,
  type: FieldType,
  opts: Partial<Pick<Field, "isNullable" | "nullable" | "isUnique" | "unique" | "isPrimaryKey" | "defaultValue" | "enumName" | "isList">> = {},
): Field => {
  const isNullable = opts.isNullable ?? opts.nullable ?? true;
  const isUnique = opts.isUnique ?? opts.unique ?? false;
  return {
    id: uid("field", `${table}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    name,
    type,
    enumName: opts.enumName,
    defaultValue: opts.defaultValue ?? "",
    isUpdatedAt: false,
    isUnique,
    isNullable,
    nullable: isNullable,
    unique: isUnique,
    isPrimaryKey: opts.isPrimaryKey ?? false,
    isList: opts.isList ?? false,
  };
};

const pk = (table: string): Field =>
  f(table, "id", "Int", { isNullable: false, isPrimaryKey: true, defaultValue: "autoincrement()" });

const pos = (index: number): { x: number; y: number } => ({
  x: (index % 3) * 380,
  y: Math.floor(index / 3) * 340,
});

const mkTable = (name: string, index: number, fields: Field[]): Table => ({
  id: uid("table", name.toLowerCase()),
  name,
  position: pos(index),
  fields,
});

const mkEnum = (name: string, values: string[]): EnumDefinition => ({
  id: uid("enum", name.toLowerCase()),
  name,
  values,
});

const rel = (from: string, to: string, fk: string, name: string): Relation => ({
  id: uid("rel", `${from}-${to}-${fk}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  name,
  type: "one-to-many",
  fromTableId: uid("table", from.toLowerCase()),
  toTableId: uid("table", to.toLowerCase()),
  fromFieldId: uid("field", `${from}-${fk}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  onDelete: "CASCADE",
});

const saasTables = (): ParsedSchema["tables"] => [
  mkTable("User", 0, [pk("User"), f("User", "email", "String", { isNullable: false, isUnique: true }), f("User", "name", "String", { isNullable: true }), f("User", "role", "Enum", { isNullable: false, enumName: "Role", defaultValue: "MEMBER" }), f("User", "createdAt", "DateTime", { isNullable: false, defaultValue: "now()" })]),
  mkTable("Account", 1, [pk("Account"), f("Account", "userId", "Int", { isNullable: false }), f("Account", "provider", "String", { isNullable: false }), f("Account", "providerId", "String", { isNullable: false })]),
  mkTable("Session", 2, [pk("Session"), f("Session", "userId", "Int", { isNullable: false }), f("Session", "token", "String", { isNullable: false, isUnique: true }), f("Session", "expiresAt", "DateTime", { isNullable: false })]),
  mkTable("Team", 3, [pk("Team"), f("Team", "name", "String", { isNullable: false }), f("Team", "slug", "String", { isNullable: false, isUnique: true })]),
  mkTable("TeamMember", 4, [pk("TeamMember"), f("TeamMember", "teamId", "Int", { isNullable: false }), f("TeamMember", "userId", "Int", { isNullable: false }), f("TeamMember", "role", "Enum", { isNullable: false, enumName: "Role" })]),
  mkTable("Plan", 5, [pk("Plan"), f("Plan", "name", "String", { isNullable: false }), f("Plan", "price", "Decimal", { isNullable: false }), f("Plan", "interval", "String", { isNullable: false })]),
  mkTable("Subscription", 6, [pk("Subscription"), f("Subscription", "teamId", "Int", { isNullable: false }), f("Subscription", "planId", "Int", { isNullable: false }), f("Subscription", "status", "Enum", { isNullable: false, enumName: "SubscriptionStatus" }), f("Subscription", "currentPeriodEnd", "DateTime", { isNullable: true })]),
];

const shopTables = (): ParsedSchema["tables"] => [
  mkTable("Customer", 0, [pk("Customer"), f("Customer", "email", "String", { isNullable: false, isUnique: true }), f("Customer", "name", "String", { isNullable: true }), f("Customer", "createdAt", "DateTime", { isNullable: false, defaultValue: "now()" })]),
  mkTable("Category", 1, [pk("Category"), f("Category", "name", "String", { isNullable: false, isUnique: true }), f("Category", "slug", "String", { isNullable: false, isUnique: true })]),
  mkTable("Product", 2, [pk("Product"), f("Product", "name", "String", { isNullable: false }), f("Product", "price", "Decimal", { isNullable: false }), f("Product", "categoryId", "Int", { isNullable: true })]),
  mkTable("Order", 3, [pk("Order"), f("Order", "customerId", "Int", { isNullable: false }), f("Order", "status", "Enum", { isNullable: false, enumName: "OrderStatus", defaultValue: "PENDING" }), f("Order", "createdAt", "DateTime", { isNullable: false, defaultValue: "now()" })]),
  mkTable("OrderItem", 4, [pk("OrderItem"), f("OrderItem", "orderId", "Int", { isNullable: false }), f("OrderItem", "productId", "Int", { isNullable: false }), f("OrderItem", "quantity", "Int", { isNullable: false, defaultValue: "1" })]),
  mkTable("Payment", 5, [pk("Payment"), f("Payment", "orderId", "Int", { isNullable: false }), f("Payment", "amount", "Decimal", { isNullable: false }), f("Payment", "status", "Enum", { isNullable: false, enumName: "PaymentStatus" })]),
  mkTable("Review", 6, [pk("Review"), f("Review", "productId", "Int", { isNullable: false }), f("Review", "customerId", "Int", { isNullable: false }), f("Review", "rating", "Int", { isNullable: false }), f("Review", "body", "String", { isNullable: true })]),
];

const cmsTables = (): ParsedSchema["tables"] => [
  mkTable("User", 0, [pk("User"), f("User", "email", "String", { isNullable: false, isUnique: true }), f("User", "name", "String", { isNullable: true })]),
  mkTable("Post", 1, [pk("Post"), f("Post", "authorId", "Int", { isNullable: false }), f("Post", "title", "String", { isNullable: false }), f("Post", "slug", "String", { isNullable: false, isUnique: true }), f("Post", "status", "Enum", { isNullable: false, enumName: "PostStatus", defaultValue: "DRAFT" }), f("Post", "publishedAt", "DateTime", { isNullable: true })]),
  mkTable("Comment", 2, [pk("Comment"), f("Comment", "postId", "Int", { isNullable: false }), f("Comment", "authorId", "Int", { isNullable: false }), f("Comment", "body", "String", { isNullable: false })]),
  mkTable("Tag", 3, [pk("Tag"), f("Tag", "name", "String", { isNullable: false, isUnique: true })]),
  mkTable("PostTag", 4, [pk("PostTag"), f("PostTag", "postId", "Int", { isNullable: false }), f("PostTag", "tagId", "Int", { isNullable: false })]),
  mkTable("Media", 5, [pk("Media"), f("Media", "postId", "Int", { isNullable: true }), f("Media", "url", "String", { isNullable: false }), f("Media", "mimeType", "String", { isNullable: true })]),
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  { id: "saas-auth-billing", name: "SaaS B2B Auth & Billing", description: "User, Account, Session, Team, TeamMember, Plan, Subscription + Role, SubscriptionStatus.", schema: { tables: saasTables(), relations: [rel("Account", "User", "userId", "AccountUser"), rel("Session", "User", "userId", "SessionUser"), rel("TeamMember", "Team", "teamId", "TeamMemberTeam"), rel("TeamMember", "User", "userId", "TeamMemberUser"), rel("Subscription", "Team", "teamId", "SubscriptionTeam"), rel("Subscription", "Plan", "planId", "SubscriptionPlan")], enums: [mkEnum("Role", ["ADMIN", "MEMBER", "VIEWER"]), mkEnum("SubscriptionStatus", ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"])] } },
  { id: "ecommerce", name: "E-Commerce Complexe", description: "Customer, Product, Category, Order, OrderItem, Payment, Review + OrderStatus, PaymentStatus.", schema: { tables: shopTables(), relations: [rel("Product", "Category", "categoryId", "ProductCategory"), rel("Order", "Customer", "customerId", "OrderCustomer"), rel("OrderItem", "Order", "orderId", "OrderItemOrder"), rel("OrderItem", "Product", "productId", "OrderItemProduct"), rel("Payment", "Order", "orderId", "PaymentOrder"), rel("Review", "Product", "productId", "ReviewProduct"), rel("Review", "Customer", "customerId", "ReviewCustomer")], enums: [mkEnum("OrderStatus", ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED"]), mkEnum("PaymentStatus", ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"])] } },
  { id: "cms", name: "Plateforme Medias / CMS", description: "User, Post, Comment, Tag, PostTag, Media + PostStatus.", schema: { tables: cmsTables(), relations: [rel("Post", "User", "authorId", "PostAuthor"), rel("Comment", "Post", "postId", "CommentPost"), rel("Comment", "User", "authorId", "CommentAuthor"), rel("PostTag", "Post", "postId", "PostTagPost"), rel("PostTag", "Tag", "tagId", "PostTagTag"), rel("Media", "Post", "postId", "MediaPost")], enums: [mkEnum("PostStatus", ["DRAFT", "PUBLISHED", "ARCHIVED"])] } },
];

export const toSchemaAst = (schema: ParsedSchema): SchemaAst => ({
  version: 1,
  datasource: { provider: "postgresql", urlEnv: "DATABASE_URL" },
  tables: schema.tables,
  relations: schema.relations,
  enums: schema.enums,
});
