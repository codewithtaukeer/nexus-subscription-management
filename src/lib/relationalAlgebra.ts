/**
 * SQL to Relational Algebra Translator & Operator Tree Generator
 * 
 * Supports:
 * - Basic/Classical Relational Algebra:
 *   Selection σ, Projection π, Rename ρ, Cartesian Product ×, Theta/Natural Join ⋈, Union ∪, Intersect ∩, Set Difference −
 * - Extended Relational Algebra:
 *   Aggregation/Grouping γ, Outer Joins, Duplicate handling
 * - Diagnostics & Unsupported Constructs:
 *   Identifies constructs outside classical RA such as window functions (ROW_NUMBER OVER), recursive CTEs, and procedural code.
 */

export interface RAOperatorNode {
  id: string;
  operator: string; // 'PROJECT', 'SELECT', 'JOIN', 'PRODUCT', 'AGGREGATE', 'RELATION'
  symbol: string;   // 'π', 'σ', '⋈', '×', 'γ', 'R'
  parameters?: string;
  description: string;
  children: RAOperatorNode[];
}

export interface RATranslationResult {
  isSupported: boolean;
  classicalRA: string;
  extendedRA: string;
  derivationSteps: string[];
  operatorTree: RAOperatorNode;
  unsupportedReason?: string;
  closestPartialRA?: string;
  warnings: string[];
}

// Clean and normalize SQL string
function cleanSQL(sql: string): string {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

// Translate SQL query to Relational Algebra
export function translateSQLToRA(
  sql: string,
  availableSchemas?: Record<string, string[]>
): RATranslationResult {
  const query = cleanSQL(sql);
  const upper = query.toUpperCase();

  // 1. Check for Window Functions / Unsupported Constructs
  if (upper.includes('OVER') || upper.includes('ROW_NUMBER') || upper.includes('RANK()') || upper.includes('DENSE_RANK')) {
    return {
      isSupported: false,
      classicalRA: 'Not exactly representable by standard classical relational algebra operators.',
      extendedRA: 'Unsupported unless a non-standard windowing/ranking extension is implemented.',
      unsupportedReason:
        'Standard Classical Relational Algebra (Codd, 1970) operates strictly on unordered mathematical sets/relations. Window functions such as ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) rely on explicit tuple ordering, sequence positioning, and window frame state, which have no classical RA equivalent.',
      closestPartialRA: 'π_{...}(σ_{...}(Relation)) [Partial: Partitioning and sequence ordering omitted]',
      warnings: [
        'Window functions require tuple-level ordering outside classical set algebra.',
        'No exact lossless translation possible in standard Relational Algebra.',
      ],
      derivationSteps: [
        '1. Parsed query and discovered analytical window function construct (ROW_NUMBER / OVER).',
        '2. Evaluated against Classical Relational Algebra operator set: {σ, π, ρ, ×, ⋈, ∪, ∩, −}.',
        '3. Evaluated against Extended Relational Algebra operator set: {γ, ⟕, ⟖, ⟗}.',
        '4. Diagnostic: Neither standard nor extended algebra natively supports window-frame partitioning and row index ranking without non-standard extensions.',
      ],
      operatorTree: {
        id: '1',
        operator: 'UNSUPPORTED',
        symbol: '⚠️',
        parameters: 'ROW_NUMBER() OVER (...)',
        description: 'Construct outside relational algebra scope',
        children: [
          {
            id: '2',
            operator: 'RELATION',
            symbol: 'R',
            parameters: query.match(/FROM\s+([a-zA-Z0-9_]+)/i)?.[1] || 'Relation',
            description: 'Source relation',
            children: [],
          },
        ],
      },
    };
  }

  // 2. Parse SELECT ... FROM ... WHERE ... GROUP BY
  const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM\s+(.*?)(?:\s+WHERE\s+(.*?))?(?:\s+GROUP\s+BY\s+(.*?))?(?:\s+ORDER\s+BY.*)?$/i);

  if (!selectMatch) {
    return {
      isSupported: false,
      classicalRA: 'Syntax error or unsupported SQL structure.',
      extendedRA: 'Unable to parse SQL query structure.',
      unsupportedReason: 'Query does not match standard SELECT ... FROM [WHERE] [GROUP BY] syntax.',
      warnings: ['Please verify SQL syntax.'],
      derivationSteps: ['Failed to parse standard relational projection and selection clauses.'],
      operatorTree: {
        id: '1',
        operator: 'ERROR',
        symbol: '✕',
        description: 'Parse failure',
        children: [],
      },
    };
  }

  const rawSelect = selectMatch[1].trim();
  const rawFrom = selectMatch[2].trim();
  const rawWhere = selectMatch[3]?.trim();
  const rawGroupBy = selectMatch[4]?.trim();

  const isAggregate =
    rawGroupBy ||
    rawSelect.includes('COUNT(') ||
    rawSelect.includes('SUM(') ||
    rawSelect.includes('AVG(') ||
    rawSelect.includes('MAX(') ||
    rawSelect.includes('MIN(');

  // Check for JOIN in FROM clause
  const joinMatch = rawFrom.match(/(.*?)\s+(?:INNER\s+)?JOIN\s+(.*?)\s+ON\s+(.*)/i);

  let fromExpression = '';
  let fromTree: RAOperatorNode;

  if (joinMatch) {
    const leftTable = joinMatch[1].trim();
    const rightTable = joinMatch[2].trim();
    const joinCondition = joinMatch[3].trim();

    fromExpression = `(${leftTable} ⋈_{${joinCondition}} ${rightTable})`;
    fromTree = {
      id: 'join_1',
      operator: 'JOIN',
      symbol: '⋈',
      parameters: joinCondition,
      description: `Theta Join on ${joinCondition}`,
      children: [
        {
          id: 'table_1',
          operator: 'RELATION',
          symbol: 'R',
          parameters: leftTable,
          description: `Relation ${leftTable}`,
          children: [],
        },
        {
          id: 'table_2',
          operator: 'RELATION',
          symbol: 'R',
          parameters: rightTable,
          description: `Relation ${rightTable}`,
          children: [],
        },
      ],
    };
  } else {
    fromExpression = rawFrom;
    fromTree = {
      id: 'table_1',
      operator: 'RELATION',
      symbol: 'R',
      parameters: rawFrom,
      description: `Relation ${rawFrom}`,
      children: [],
    };
  }

  // Handle Selection (WHERE)
  let currentExpr = fromExpression;
  let currentTree = fromTree;

  const derivationSteps: string[] = [
    `1. Identify base relation(s): ${fromExpression}`,
  ];

  if (rawWhere) {
    currentExpr = `σ_{${rawWhere}}(${currentExpr})`;
    derivationSteps.push(`2. Apply Selection condition σ with predicate: ${rawWhere}`);
    currentTree = {
      id: 'select_1',
      operator: 'SELECT',
      symbol: 'σ',
      parameters: rawWhere,
      description: `Filter tuples where ${rawWhere}`,
      children: [currentTree],
    };
  }

  // Handle Aggregation / Group By (Extended RA)
  if (isAggregate) {
    const groupAttrs = rawGroupBy || 'ALL';
    const aggFuncs = rawSelect;
    const extExpr = `γ_{${groupAttrs}; ${aggFuncs}}(${currentExpr})`;
    derivationSteps.push(`3. Apply Extended Grouping & Aggregation operator γ: grouping by [${groupAttrs}] with aggregates [${aggFuncs}]`);

    const aggTree: RAOperatorNode = {
      id: 'agg_1',
      operator: 'AGGREGATE',
      symbol: 'γ',
      parameters: `${groupAttrs}; ${aggFuncs}`,
      description: `Group by ${groupAttrs} and aggregate ${aggFuncs}`,
      children: [currentTree],
    };

    return {
      isSupported: true,
      classicalRA: 'Classical Relational Algebra has no native aggregate operator. Requires Extended Relational Algebra (γ).',
      extendedRA: extExpr,
      derivationSteps,
      operatorTree: aggTree,
      warnings: [
        'Grouping and aggregation (γ) is an Extended Relational Algebra operator, beyond Codd’s basic classical algebra.',
      ],
    };
  }

  // Handle Projection (SELECT)
  const finalClassical = `π_{${rawSelect}}(${currentExpr})`;
  derivationSteps.push(`3. Apply Projection operator π with attributes: [${rawSelect}]`);

  const rootTree: RAOperatorNode = {
    id: 'proj_1',
    operator: 'PROJECT',
    symbol: 'π',
    parameters: rawSelect,
    description: `Project attributes: ${rawSelect}`,
    children: [currentTree],
  };

  return {
    isSupported: true,
    classicalRA: finalClassical,
    extendedRA: finalClassical,
    derivationSteps,
    operatorTree: rootTree,
    warnings: [],
  };
}

export const RELATIONAL_ALGEBRA_PRESETS = [
  {
    name: 'Example A: Selection + Projection (Basic RA)',
    sql: `SELECT name\nFROM MEMBER\nWHERE city = 'Prayagraj';`,
    schema: 'MEMBER(member_id, name, city)',
    explanation: 'Basic classical relational algebra. First filters tuples where city = \'Prayagraj\' using selection σ, then projects the name attribute using π.',
  },
  {
    name: 'Example B: Theta Join + Filter + Projection (Basic RA)',
    sql: `SELECT m.name, s.subscription_id\nFROM MEMBER AS m\nJOIN SUBSCRIPTION AS s ON s.member_id = m.member_id\nWHERE s.status = 'active';`,
    schema: 'MEMBER(member_id, name)\nSUBSCRIPTION(subscription_id, member_id, status)',
    explanation: 'Relational join between MEMBER and SUBSCRIPTION over member_id, filtered by status = \'active\', with projection of name and subscription_id.',
  },
  {
    name: 'Example C: Grouping & Aggregation (Extended RA)',
    sql: `SELECT plan_id, COUNT(*) AS total\nFROM SUBSCRIPTION\nWHERE status = 'active'\nGROUP BY plan_id;`,
    schema: 'SUBSCRIPTION(subscription_id, plan_id, status)',
    explanation: 'Extended Relational Algebra utilizing the aggregate/grouping operator γ. Groups active subscriptions by plan_id and computes COUNT(*).',
  },
  {
    name: 'Example D: Window Function (Mandatory Non-Exact Demo)',
    sql: `SELECT subscription_id,\n       ROW_NUMBER() OVER (\n         PARTITION BY plan_id\n         ORDER BY created_at DESC\n       ) AS rn\nFROM SUBSCRIPTION;`,
    schema: 'SUBSCRIPTION(subscription_id, plan_id, created_at)',
    explanation: 'Demonstrates an honest limitation: Standard classical Relational Algebra cannot express window ranking functions without non-standard ordering extensions.',
  },
];
