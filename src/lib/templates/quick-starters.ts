import type {
  EnumDefinition,
  Field,
  FieldType,
  Relation,
  Table,
  TableColor,
} from "@/types";
import type { ParsedSchema } from "@/lib/engine/parser";

export interface QuickStarter {
  id: string;
  name: string;
  description: string;
  schema: ParsedSchema;
}

const uid = (p: string, n: string): string => `${p}-${n}`;

const f = (
  template: string,
  table: string,
  name: string,
  type: FieldType,
  opts: Partial<
    Pick<
      Field,
      | "isNullable"
      | "isUnique"
      | "isPrimaryKey"
      | "defaultValue"
      | "enumName"
      | "isList"
    >
  > = {},
): Field => {
  const isNullable = opts.isNullable ?? true;
  const isUnique = opts.isUnique ?? false;
  return {
    id: uid("qs-field", `${template}-${table}-${name}`.toLowerCase()),
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

const pk = (template: string, table: string): Field =>
  f(template, table, "id", "Int", {
    isNullable: false,
    isPrimaryKey: true,
    defaultValue: "autoincrement()",
  });

const createdAt = (template: string, table: string): Field =>
  f(template, table, "createdAt", "DateTime", {
    isNullable: false,
    defaultValue: "now()",
  });

const fk = (template: string, table: string, name: string): Field =>
  f(template, table, name, "Int", { isNullable: false });

const pos = (index: number): { x: number; y: number } => ({
  x: (index % 2) * 400,
  y: Math.floor(index / 2) * 360,
});

const mkTable = (
  template: string,
  name: string,
  index: number,
  color: TableColor,
  fields: Field[],
): Table => ({
  id: uid("qs-table", `${template}-${name}`.toLowerCase()),
  name,
  position: pos(index),
  color,
  fields,
});

const rel = (
  template: string,
  from: string,
  to: string,
  fkName: string,
  name: string,
): Relation => ({
  id: uid("qs-rel", `${template}-${from}-${to}-${fkName}`.toLowerCase()),
  name,
  type: "one-to-many",
  fromTableId: uid("qs-table", `${template}-${from}`.toLowerCase()),
  toTableId: uid("qs-table", `${template}-${to}`.toLowerCase()),
  fromFieldId: uid("qs-field", `${template}-${from}-${fkName}`.toLowerCase()),
  onDelete: "CASCADE",
});

const emailField = (template: string, table: string): Field =>
  f(template, table, "email", "String", {
    isNullable: false,
    isUnique: true,
  });

const nameField = (template: string, table: string, unique = false): Field =>
  f(template, table, "name", "String", { isNullable: false, isUnique: unique });

// --- SaaS Multi-tenant: User / Organization / Membership / Subscription -----

const saasTables = (): Table[] => [
  mkTable("saas", "User", 0, "indigo", [
    pk("saas", "User"),
    emailField("saas", "User"),
    nameField("saas", "User"),
    createdAt("saas", "User"),
  ]),
  mkTable("saas", "Organization", 1, "emerald", [
    pk("saas", "Organization"),
    nameField("saas", "Organization"),
    f("saas", "Organization", "slug", "String", {
      isNullable: false,
      isUnique: true,
    }),
    createdAt("saas", "Organization"),
  ]),
  mkTable("saas", "Membership", 2, "amber", [
    pk("saas", "Membership"),
    fk("saas", "Membership", "userId"),
    fk("saas", "Membership", "organizationId"),
    f("saas", "Membership", "role", "String", {
      isNullable: false,
      defaultValue: "MEMBER",
    }),
  ]),
  mkTable("saas", "Subscription", 3, "rose", [
    pk("saas", "Subscription"),
    fk("saas", "Subscription", "organizationId"),
    f("saas", "Subscription", "plan", "String", { isNullable: false }),
    f("saas", "Subscription", "status", "String", {
      isNullable: false,
      defaultValue: "ACTIVE",
    }),
    createdAt("saas", "Subscription"),
  ]),
];

const saasRelations = (): Relation[] => [
  rel("saas", "Membership", "User", "userId", "MembershipUser"),
  rel("saas", "Membership", "Organization", "organizationId", "MembershipOrganization"),
  rel("saas", "Subscription", "Organization", "organizationId", "SubscriptionOrganization"),
];

// --- E-commerce: Customer / Product / Order / OrderItem ---------------------

const shopTables = (): Table[] => [
  mkTable("shop", "Customer", 0, "indigo", [
    pk("shop", "Customer"),
    emailField("shop", "Customer"),
    nameField("shop", "Customer"),
    createdAt("shop", "Customer"),
  ]),
  mkTable("shop", "Product", 1, "amber", [
    pk("shop", "Product"),
    nameField("shop", "Product"),
    f("shop", "Product", "price", "Decimal", { isNullable: false }),
    createdAt("shop", "Product"),
  ]),
  mkTable("shop", "Order", 2, "emerald", [
    pk("shop", "Order"),
    fk("shop", "Order", "customerId"),
    f("shop", "Order", "status", "String", {
      isNullable: false,
      defaultValue: "PENDING",
    }),
    createdAt("shop", "Order"),
  ]),
  mkTable("shop", "OrderItem", 3, "rose", [
    pk("shop", "OrderItem"),
    fk("shop", "OrderItem", "orderId"),
    fk("shop", "OrderItem", "productId"),
    f("shop", "OrderItem", "quantity", "Int", {
      isNullable: false,
      defaultValue: "1",
    }),
  ]),
];

const shopRelations = (): Relation[] => [
  rel("shop", "Order", "Customer", "customerId", "OrderCustomer"),
  rel("shop", "OrderItem", "Order", "orderId", "OrderItemOrder"),
  rel("shop", "OrderItem", "Product", "productId", "OrderItemProduct"),
];

// --- Blog: User / Post / Comment / Tag ---------------------------------------

const blogTables = (): Table[] => [
  mkTable("blog", "User", 0, "indigo", [
    pk("blog", "User"),
    emailField("blog", "User"),
    nameField("blog", "User"),
  ]),
  mkTable("blog", "Post", 1, "emerald", [
    pk("blog", "Post"),
    fk("blog", "Post", "authorId"),
    f("blog", "Post", "title", "String", { isNullable: false }),
    f("blog", "Post", "slug", "String", {
      isNullable: false,
      isUnique: true,
    }),
    createdAt("blog", "Post"),
  ]),
  mkTable("blog", "Comment", 2, "amber", [
    pk("blog", "Comment"),
    fk("blog", "Comment", "postId"),
    fk("blog", "Comment", "authorId"),
    f("blog", "Comment", "body", "String", { isNullable: false }),
  ]),
  mkTable("blog", "Tag", 3, "rose", [
    pk("blog", "Tag"),
    nameField("blog", "Tag", true),
  ]),
];

const blogRelations = (): Relation[] => [
  rel("blog", "Post", "User", "authorId", "PostAuthor"),
  rel("blog", "Comment", "Post", "postId", "CommentPost"),
  rel("blog", "Comment", "User", "authorId", "CommentAuthor"),
];

const noEnums = (): EnumDefinition[] => [];

export const QUICK_STARTERS: QuickStarter[] = [
  {
    id: "saas",
    name: "SaaS Multi-tenant",
    description: "User · Organization · Membership · Subscription",
    schema: { tables: saasTables(), relations: saasRelations(), enums: noEnums() },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Customer · Product · Order · OrderItem",
    schema: { tables: shopTables(), relations: shopRelations(), enums: noEnums() },
  },
  {
    id: "blog",
    name: "Blog",
    description: "User · Post · Comment · Tag",
    schema: { tables: blogTables(), relations: blogRelations(), enums: noEnums() },
  },
];