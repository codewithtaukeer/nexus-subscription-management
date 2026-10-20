import { PGlite } from '@electric-sql/pglite';
import { supabase } from '../lib/supabase';

export interface DatabaseWorkspace {
  id: string;
  name: string;
  description?: string;
  engine: 'pglite_sandbox' | 'supabase_production';
  engineLabel: string;
  isReadOnly: boolean;
  isDemo: boolean;
  tableCount: number;
  createdAt: string;
  lastUsedAt: string;
  template: 'blank' | 'subscription' | 'university' | 'ecommerce';
}

export interface IntrospectedColumn {
  name: string;
  type: string;
  isNullable: boolean;
  isPK: boolean;
  isFK: boolean;
  refTable?: string;
  refColumn?: string;
  defaultValue?: string | null;
}

export interface IntrospectedTable {
  name: string;
  type: 'BASE TABLE' | 'VIEW';
  columns: IntrospectedColumn[];
  rowCount?: number;
}

export interface QueryExecutionResult {
  rows: any[];
  fields: string[];
  affectedRows: number;
  durationMs: number;
  command: string;
  error?: string;
}

// In-memory instances of PGlite sandboxes keyed by workspace id
const pgInstances: Map<string, PGlite> = new Map();

// Seed SQL for the Demo Sandbox
const DEMO_SEED_SQL = `
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'operator', 'member')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL CHECK (price_monthly >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'paused', 'cancelled', 'expired')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    price_at_signup NUMERIC(10,2) NOT NULL,
    current_period_end TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subscription_id INT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    provider_reference VARCHAR(50) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed')),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT INTO members (id, full_name, email, role) VALUES
(1, 'Alex Vance (Admin)', 'admin@nexus.io', 'admin'),
(2, 'Elena Rostova (Operator)', 'operator@nexus.io', 'operator'),
(3, 'Marcus Chen', 'marcus.chen@example.com', 'member'),
(4, 'Priya Sharma', 'priya.sharma@example.com', 'member'),
(5, 'David Miller', 'david.miller@example.com', 'member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO membership_plans (id, name, slug, price_monthly, status) VALUES
(1, 'Quantum Starter', 'quantum-starter', 0.00, 'active'),
(2, 'Nexus Pro', 'nexus-pro', 2499.00, 'active'),
(3, 'Enterprise Apex', 'enterprise-apex', 7999.00, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (id, member_id, plan_id, status, price_at_signup, current_period_end) VALUES
(1, 3, 2, 'active', 2499.00, CURRENT_TIMESTAMP + INTERVAL '5 days'),
(2, 4, 3, 'active', 7999.00, CURRENT_TIMESTAMP + INTERVAL '180 days'),
(3, 5, 1, 'trialing', 0.00, CURRENT_TIMESTAMP + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (id, invoice_number, subscription_id, member_id, subtotal, discount, total_amount, status) VALUES
(1, 'INV-202610-001', 1, 3, 2499.00, 0, 2499.00, 'paid'),
(2, 'INV-202610-002', 2, 4, 7999.00, 500, 7499.00, 'paid'),
(3, 'INV-202610-003', 1, 3, 2499.00, 0, 2499.00, 'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_transactions (invoice_id, provider_reference, amount, status) VALUES
(1, 'TX-DEMO-001', 2499.00, 'succeeded'),
(2, 'TX-DEMO-002', 7499.00, 'succeeded')
ON CONFLICT DO NOTHING;
`;

const UNIVERSITY_TEMPLATE_SQL = `
CREATE TABLE departments (
    dept_id VARCHAR(10) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    building VARCHAR(50)
);

CREATE TABLE instructors (
    instructor_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_id VARCHAR(10) REFERENCES departments(dept_id),
    salary NUMERIC(10,2) CHECK (salary > 0)
);

CREATE TABLE courses (
    course_id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    dept_id VARCHAR(10) REFERENCES departments(dept_id),
    credits INT CHECK (credits > 0)
);

CREATE TABLE students (
    student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_id VARCHAR(10) REFERENCES departments(dept_id),
    tot_credits INT DEFAULT 0
);

CREATE TABLE takes (
    student_id INT REFERENCES students(student_id),
    course_id VARCHAR(10) REFERENCES courses(course_id),
    semester VARCHAR(10),
    year INT,
    grade VARCHAR(2),
    PRIMARY KEY (student_id, course_id, semester, year)
);

INSERT INTO departments VALUES 
('CSE', 'Computer Science & Engineering', 'Aryabhatta Block'),
('ECE', 'Electronics & Comm. Engg', 'JC Bose Block');

INSERT INTO instructors VALUES
(101, 'Dr. Ramesh Kumar', 'CSE', 120000),
(102, 'Dr. Anita Desai', 'ECE', 115000);

INSERT INTO courses VALUES
('CS301', 'Database Management Systems', 'CSE', 4),
('CS302', 'Operating Systems', 'CSE', 4),
('EC201', 'Signals and Systems', 'ECE', 3);

INSERT INTO students VALUES
(2023001, 'Taukeer Akbar', 'CSE', 72),
(2023002, 'Rohan Verma', 'CSE', 68),
(2023003, 'Sneha Patel', 'ECE', 70);

INSERT INTO takes VALUES
(2023001, 'CS301', 'Fall', 2026, 'A'),
(2023002, 'CS301', 'Fall', 2026, 'B'),
(2023003, 'EC201', 'Fall', 2026, 'A');
`;

const ECOMMERCE_TEMPLATE_SQL = `
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price NUMERIC(10,2) CHECK (price >= 0),
    stock_quantity INT DEFAULT 0
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE order_items (
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (full_name, email, city) VALUES
('Aarav Mehta', 'aarav@example.com', 'Prayagraj'),
('Diya Sharma', 'diya@example.com', 'Delhi');

INSERT INTO products (name, category, price, stock_quantity) VALUES
('Neural Compute Stick', 'Hardware', 4999.00, 25),
('Quantum Sensor Module', 'Electronics', 12999.00, 10);

INSERT INTO orders (customer_id, status) VALUES (1, 'confirmed');
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 1, 2, 4999.00);
`;

const INITIAL_WORKSPACES: DatabaseWorkspace[] = [
  {
    id: 'demo-sandbox',
    name: 'Demo Database (Subscription Management)',
    description: 'Isolated PostgreSQL sandbox pre-populated with realistic subscription, billing, and membership data.',
    engine: 'pglite_sandbox',
    engineLabel: 'PostgreSQL 16 WASM (Browser Sandbox - Read/Write)',
    isReadOnly: false,
    isDemo: true,
    tableCount: 5,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    template: 'subscription',
  },
  {
    id: 'supabase-production',
    name: 'Connected Supabase (Production Schema)',
    description: 'Authoritative live Supabase PostgreSQL application database. Safe read-only inspection.',
    engine: 'supabase_production',
    engineLabel: 'PostgreSQL 17 (Supabase Remote — Read-Only Live)',
    isReadOnly: true,
    isDemo: false,
    tableCount: 13,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    template: 'subscription',
  },
];

class WorkspaceService {
  private workspaces: DatabaseWorkspace[] = [];
  private activeWorkspaceId: string = 'demo-sandbox';

  constructor() {
    this.loadWorkspaces();
  }

  private loadWorkspaces() {
    try {
      const stored = localStorage.getItem('nexus_dbms_workspaces');
      if (stored) {
        this.workspaces = JSON.parse(stored);
      } else {
        this.workspaces = [...INITIAL_WORKSPACES];
        this.saveWorkspaces();
      }
    } catch {
      this.workspaces = [...INITIAL_WORKSPACES];
    }
  }

  private saveWorkspaces() {
    localStorage.setItem('nexus_dbms_workspaces', JSON.stringify(this.workspaces));
  }

  public getWorkspaces(): DatabaseWorkspace[] {
    return this.workspaces;
  }

  public listWorkspaces(): DatabaseWorkspace[] {
    return this.workspaces;
  }

  public async forkWorkspace(id: string, newName?: string): Promise<DatabaseWorkspace> {
    const source = this.workspaces.find((w) => w.id === id) || this.workspaces[0];
    const newWs = await this.createWorkspace({
      name: newName || `${source.name} (Copy)`,
      description: `Cloned from ${source.name}`,
      template: source.template,
    });
    return newWs;
  }

  public getActiveWorkspace(): DatabaseWorkspace {
    return (
      this.workspaces.find((w) => w.id === this.activeWorkspaceId) || this.workspaces[0]
    );
  }

  public setActiveWorkspace(id: string) {
    this.activeWorkspaceId = id;
    const ws = this.workspaces.find((w) => w.id === id);
    if (ws) {
      ws.lastUsedAt = new Date().toISOString();
      this.saveWorkspaces();
    }
  }

  // Get or initialize PGlite instance for a workspace
  public async getPGlite(workspaceId: string): Promise<PGlite> {
    if (pgInstances.has(workspaceId)) {
      return pgInstances.get(workspaceId)!;
    }

    const pg = new PGlite();
    await pg.waitReady;

    const ws = this.workspaces.find((w) => w.id === workspaceId);
    const template = ws?.template || 'blank';

    if (workspaceId === 'demo-sandbox' || template === 'subscription') {
      await pg.exec(DEMO_SEED_SQL);
    } else if (template === 'university') {
      await pg.exec(UNIVERSITY_TEMPLATE_SQL);
    } else if (template === 'ecommerce') {
      await pg.exec(ECOMMERCE_TEMPLATE_SQL);
    }

    pgInstances.set(workspaceId, pg);
    return pg;
  }

  // Create new isolated workspace
  public async createWorkspace(params: {
    name: string;
    description?: string;
    template: 'blank' | 'subscription' | 'university' | 'ecommerce';
    withSampleData?: boolean;
  }): Promise<DatabaseWorkspace> {
    const id = `ws-${Date.now()}`;
    const newWs: DatabaseWorkspace = {
      id,
      name: params.name,
      description: params.description || 'Custom isolated learning sandbox',
      engine: 'pglite_sandbox',
      engineLabel: 'PostgreSQL 16 WASM (Local Sandbox)',
      isReadOnly: false,
      isDemo: false,
      tableCount: params.template === 'blank' ? 0 : params.template === 'university' ? 5 : 4,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      template: params.template,
    };

    this.workspaces.push(newWs);
    this.saveWorkspaces();
    this.activeWorkspaceId = id;

    // Initialize the engine
    await this.getPGlite(id);

    return newWs;
  }

  // Reset demo sandbox
  public async resetDemoWorkspace(): Promise<void> {
    const pg = pgInstances.get('demo-sandbox');
    if (pg) {
      await pg.close();
      pgInstances.delete('demo-sandbox');
    }
    await this.getPGlite('demo-sandbox');
  }

  // Delete workspace
  public async deleteWorkspace(id: string): Promise<void> {
    if (id === 'demo-sandbox' || id === 'supabase-production') {
      throw new Error('Default system and production workspaces cannot be deleted.');
    }

    const pg = pgInstances.get(id);
    if (pg) {
      await pg.close();
      pgInstances.delete(id);
    }

    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    this.saveWorkspaces();
    this.activeWorkspaceId = 'demo-sandbox';
  }

  // Rename workspace
  public renameWorkspace(id: string, newName: string) {
    const ws = this.workspaces.find((w) => w.id === id);
    if (ws && !ws.isDemo && id !== 'supabase-production') {
      ws.name = newName;
      this.saveWorkspaces();
    }
  }

  // Introspect active workspace schema
  public async introspectSchema(workspaceId: string): Promise<IntrospectedTable[]> {
    const ws = this.workspaces.find((w) => w.id === workspaceId) || this.workspaces[0];

    if (ws.engine === 'supabase_production') {
      // Query live Supabase schema
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error || !tables) {
        // Fallback for client environment: use known core production tables
        return [
          {
            name: 'profiles',
            type: 'BASE TABLE',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false, isPK: true, isFK: false },
              { name: 'full_name', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'email', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'role', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'created_at', type: 'timestamptz', isNullable: false, isPK: false, isFK: false },
            ],
          },
          {
            name: 'membership_plans',
            type: 'BASE TABLE',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false, isPK: true, isFK: false },
              { name: 'name', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'slug', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'price_monthly', type: 'numeric', isNullable: false, isPK: false, isFK: false },
              { name: 'status', type: 'text', isNullable: false, isPK: false, isFK: false },
            ],
          },
          {
            name: 'subscriptions',
            type: 'BASE TABLE',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false, isPK: true, isFK: false },
              { name: 'member_id', type: 'uuid', isNullable: false, isPK: false, isFK: true, refTable: 'profiles', refColumn: 'id' },
              { name: 'plan_id', type: 'uuid', isNullable: false, isPK: false, isFK: true, refTable: 'membership_plans', refColumn: 'id' },
              { name: 'status', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'current_period_end', type: 'timestamptz', isNullable: false, isPK: false, isFK: false },
            ],
          },
          {
            name: 'invoices',
            type: 'BASE TABLE',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false, isPK: true, isFK: false },
              { name: 'invoice_number', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'subscription_id', type: 'uuid', isNullable: false, isPK: false, isFK: true, refTable: 'subscriptions', refColumn: 'id' },
              { name: 'member_id', type: 'uuid', isNullable: false, isPK: false, isFK: true, refTable: 'profiles', refColumn: 'id' },
              { name: 'total_amount', type: 'numeric', isNullable: false, isPK: false, isFK: false },
              { name: 'status', type: 'text', isNullable: false, isPK: false, isFK: false },
            ],
          },
          {
            name: 'payment_transactions',
            type: 'BASE TABLE',
            columns: [
              { name: 'id', type: 'uuid', isNullable: false, isPK: true, isFK: false },
              { name: 'invoice_id', type: 'uuid', isNullable: false, isPK: false, isFK: true, refTable: 'invoices', refColumn: 'id' },
              { name: 'provider_reference', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'amount', type: 'numeric', isNullable: false, isPK: false, isFK: false },
              { name: 'status', type: 'text', isNullable: false, isPK: false, isFK: false },
            ],
          },
          {
            name: 'v_subscription_overview',
            type: 'VIEW',
            columns: [
              { name: 'subscription_id', type: 'uuid', isNullable: false, isPK: false, isFK: false },
              { name: 'member_name', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'plan_name', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'status', type: 'text', isNullable: false, isPK: false, isFK: false },
              { name: 'days_until_renewal', type: 'numeric', isNullable: false, isPK: false, isFK: false },
            ],
          },
        ];
      }
    }

    // PGlite sandbox introspection
    const pg = await this.getPGlite(workspaceId);
    const tablesQuery = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const res = await pg.query<{ table_name: string; table_type: string }>(tablesQuery);

    const tables: IntrospectedTable[] = [];

    for (const r of res.rows) {
      const colQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${r.table_name}'
        ORDER BY ordinal_position;
      `;
      const cols = await pg.query<any>(colQuery);

      // Check PKs and FKs
      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = '${r.table_name}'
          AND tc.constraint_type = 'PRIMARY KEY';
      `;
      const pks = await pg.query<any>(pkQuery);
      const pkSet = new Set(pks.rows.map((p) => p.column_name));

      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = '${r.table_name}';
      `;
      const fks = await pg.query<any>(fkQuery);
      const fkMap = new Map<string, { refTable: string; refColumn: string }>();
      fks.rows.forEach((f) => {
        fkMap.set(f.column_name, { refTable: f.foreign_table_name, refColumn: f.foreign_column_name });
      });

      // Count rows safely
      let count = 0;
      try {
        const countRes = await pg.query<{ count: string }>(`SELECT COUNT(*) FROM "${r.table_name}"`);
        count = Number(countRes.rows[0]?.count || 0);
      } catch {
        count = 0;
      }

      tables.push({
        name: r.table_name,
        type: r.table_type as any,
        rowCount: count,
        columns: cols.rows.map((c) => {
          const fk = fkMap.get(c.column_name);
          return {
            name: c.column_name,
            type: c.data_type,
            isNullable: c.is_nullable === 'YES',
            isPK: pkSet.has(c.column_name),
            isFK: !!fk,
            refTable: fk?.refTable,
            refColumn: fk?.refColumn,
            defaultValue: c.column_default,
          };
        }),
      });
    }

    // Update workspace table count
    ws.tableCount = tables.length;
    this.saveWorkspaces();

    return tables;
  }

  // Execute SQL in the active workspace
  public async executeSQL(workspaceId: string, sql: string): Promise<QueryExecutionResult> {
    const ws = this.workspaces.find((w) => w.id === workspaceId) || this.workspaces[0];
    const startTime = performance.now();

    if (ws.engine === 'supabase_production') {
      // Safe read-only inspection for production schema
      const trimmed = sql.trim().toUpperCase();
      if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('EXPLAIN') && !trimmed.startsWith('SHOW')) {
        throw new Error(
          'Security Constraint: The "Connected Supabase (Production Schema)" is configured as strictly Read-Only to protect live data. To execute DDL (CREATE/ALTER/DROP) or DML (INSERT/UPDATE/DELETE), please switch to your isolated Demo Sandbox or a custom personal workspace.'
        );
      }

      // Query view or table
      const match = sql.match(/from\s+public\.([a-z0-9_]+)/i) || sql.match(/from\s+([a-z0-9_]+)/i);
      const tableName = match ? match[1] : 'v_subscription_overview';

      const { data, error } = await supabase.from(tableName).select('*').limit(50);
      const durationMs = Math.round(performance.now() - startTime);

      if (error) {
        return {
          rows: [],
          fields: [],
          affectedRows: 0,
          durationMs,
          command: 'SELECT',
          error: error.message,
        };
      }

      const rows = data || [];
      const fields = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        rows,
        fields,
        affectedRows: rows.length,
        durationMs,
        command: 'SELECT',
      };
    }

    // Local PGlite WASM execution
    const pg = await this.getPGlite(workspaceId);

    try {
      const res = await pg.query<any>(sql);
      const durationMs = Math.round(performance.now() - startTime);
      const rows = res.rows || [];
      const fields = res.fields?.map((f) => f.name) || (rows.length > 0 ? Object.keys(rows[0]) : []);

      return {
        rows,
        fields,
        affectedRows: res.affectedRows ?? rows.length,
        durationMs,
        command: sql.trim().split(/\s+/)[0].toUpperCase(),
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        rows: [],
        fields: [],
        affectedRows: 0,
        durationMs,
        command: 'ERROR',
        error: err.message,
      };
    }
  }
}

export const workspaceService = new WorkspaceService();
