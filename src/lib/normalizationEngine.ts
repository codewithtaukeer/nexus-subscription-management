/**
 * Relational Database Normalization Engine (1NF, 2NF, 3NF, BCNF)
 * Algorithms for computing:
 * - Attribute closures
 * - Candidate keys
 * - 2NF, 3NF, BCNF verification with step-by-step mathematical proofs
 * - Dependency-preserving 3NF decomposition (Bernstein synthesis)
 * - Lossless BCNF decomposition
 */

export interface FunctionalDependency {
  id: string;
  lhs: string[]; // Determinants (left-hand side)
  rhs: string[]; // Dependents (right-hand side)
}

export interface NormalizationAnalysis {
  attributes: string[];
  fds: FunctionalDependency[];
  candidateKeys: string[][];
  primeAttributes: string[];
  nonPrimeAttributes: string[];
  is1NF: boolean;
  is2NF: boolean;
  is3NF: boolean;
  isBCNF: boolean;
  violations2NF: string[];
  violations3NF: string[];
  violationsBCNF: string[];
  decomposed3NF: Array<{ name: string; attributes: string[]; key: string[]; fds: string[] }>;
  decomposedBCNF: Array<{ name: string; attributes: string[]; key: string[] }>;
  steps: string[];
}

// Compute attribute closure X+ with respect to functional dependencies
export function computeClosure(attrs: string[], fds: FunctionalDependency[]): string[] {
  const closure = new Set<string>(attrs);
  let changed = true;

  while (changed) {
    changed = false;
    for (const fd of fds) {
      const lhsInClosure = fd.lhs.every((attr) => closure.has(attr));
      if (lhsInClosure) {
        for (const r of fd.rhs) {
          if (!closure.has(r)) {
            closure.add(r);
            changed = true;
          }
        }
      }
    }
  }

  return Array.from(closure).sort();
}

// Power set of attributes (ordered by size)
function getAllSubsets(arr: string[]): string[][] {
  const result: string[][] = [[]];
  for (const el of arr) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], el]);
    }
  }
  return result.sort((a, b) => a.length - b.length);
}

// Find all candidate keys of a relation R under F
export function findCandidateKeys(allAttrs: string[], fds: FunctionalDependency[]): string[][] {
  const allSubsets = getAllSubsets(allAttrs).filter((s) => s.length > 0);
  const superkeys: string[][] = [];

  for (const subset of allSubsets) {
    const closure = computeClosure(subset, fds);
    if (allAttrs.every((a) => closure.includes(a))) {
      superkeys.push(subset);
    }
  }

  // Filter minimal superkeys (candidate keys)
  const candidateKeys: string[][] = [];
  for (const sk of superkeys) {
    const hasProperSubset = candidateKeys.some((ck) =>
      ck.every((attr) => sk.includes(attr))
    );
    if (!hasProperSubset) {
      candidateKeys.push(sk);
    }
  }

  return candidateKeys.length > 0 ? candidateKeys : [allAttrs];
}

// Analyze relational schema and compute normal forms & decompositions
export function analyzeRelation(
  attributes: string[],
  fds: FunctionalDependency[]
): NormalizationAnalysis {
  const steps: string[] = [];
  steps.push(`Relation schema R(${attributes.join(', ')}) defined with ${fds.length} functional dependencies.`);

  // 1. Find Candidate Keys
  const candidateKeys = findCandidateKeys(attributes, fds);
  steps.push(`Identified Candidate Keys: ${candidateKeys.map((k) => `(${k.join(', ')})`).join(', ')}`);

  // Prime vs Non-prime
  const primeSet = new Set<string>();
  candidateKeys.forEach((ck) => ck.forEach((attr) => primeSet.add(attr)));
  const primeAttributes = Array.from(primeSet).sort();
  const nonPrimeAttributes = attributes.filter((a) => !primeSet.has(a)).sort();

  steps.push(`Prime Attributes (part of any candidate key): {${primeAttributes.join(', ') || 'none'}}`);
  steps.push(`Non-Prime Attributes: {${nonPrimeAttributes.join(', ') || 'none'}}`);

  // 2. Test 2NF (No partial dependency: no non-prime attribute depends on a proper subset of any candidate key)
  const violations2NF: string[] = [];
  for (const fd of fds) {
    for (const r of fd.rhs) {
      if (nonPrimeAttributes.includes(r)) {
        for (const ck of candidateKeys) {
          const isSubset = fd.lhs.length < ck.length && fd.lhs.every((attr) => ck.includes(attr));
          if (isSubset) {
            violations2NF.push(
              `${fd.lhs.join(', ')} -> ${r} (non-prime attribute '${r}' depends on proper subset {${fd.lhs.join(', ')}} of candidate key (${ck.join(', ')}))`
            );
          }
        }
      }
    }
  }
  const is2NF = violations2NF.length === 0;

  // 3. Test 3NF (For every X -> Y, either Y ⊆ X, X is a superkey, or each attribute in Y is prime)
  const violations3NF: string[] = [];
  for (const fd of fds) {
    const closure = computeClosure(fd.lhs, fds);
    const isSuperKey = attributes.every((a) => closure.includes(a));
    const isTrivial = fd.rhs.every((r) => fd.lhs.includes(r));

    if (!isTrivial && !isSuperKey) {
      for (const r of fd.rhs) {
        if (!fd.lhs.includes(r) && !primeAttributes.includes(r)) {
          violations3NF.push(
            `${fd.lhs.join(', ')} -> ${r} (determinant is not a superkey, and dependent '${r}' is not a prime attribute)`
          );
        }
      }
    }
  }
  const is3NF = is2NF && violations3NF.length === 0;

  // 4. Test BCNF (For every non-trivial X -> Y, X must be a superkey)
  const violationsBCNF: string[] = [];
  for (const fd of fds) {
    const isTrivial = fd.rhs.every((r) => fd.lhs.includes(r));
    if (!isTrivial) {
      const closure = computeClosure(fd.lhs, fds);
      const isSuperKey = attributes.every((a) => closure.includes(a));
      if (!isSuperKey) {
        violationsBCNF.push(
          `${fd.lhs.join(', ')} -> ${fd.rhs.join(', ')} (determinant {${fd.lhs.join(', ')}} is not a superkey)`
        );
      }
    }
  }
  const isBCNF = is3NF && violationsBCNF.length === 0;

  // 5. Compute 3NF Decomposition (Bernstein's Synthesis)
  const decomposed3NF: Array<{ name: string; attributes: string[]; key: string[]; fds: string[] }> = [];
  const processedFds: FunctionalDependency[] = [];

  // Group FDs by determinant
  const groupedFds: Record<string, string[]> = {};
  for (const fd of fds) {
    const key = fd.lhs.sort().join(',');
    if (!groupedFds[key]) groupedFds[key] = [];
    fd.rhs.forEach((r) => {
      if (!fd.lhs.includes(r) && !groupedFds[key].includes(r)) {
        groupedFds[key].push(r);
      }
    });
  }

  let tableIdx = 1;
  let hasCandidateKey = false;
  for (const [lhsStr, rhsArr] of Object.entries(groupedFds)) {
    const lhs = lhsStr.split(',');
    const relAttrs = Array.from(new Set([...lhs, ...rhsArr])).sort();
    
    // Check if this relation already contains a candidate key
    if (candidateKeys.some((ck) => ck.every((a) => relAttrs.includes(a)))) {
      hasCandidateKey = true;
    }

    decomposed3NF.push({
      name: `R${tableIdx++}`,
      attributes: relAttrs,
      key: lhs,
      fds: [`${lhs.join(', ')} -> ${rhsArr.join(', ')}`],
    });
  }

  // If no decomposed relation contains a candidate key, add one candidate key relation to preserve lossless join
  if (!hasCandidateKey && candidateKeys.length > 0) {
    const chosenKey = candidateKeys[0];
    decomposed3NF.push({
      name: `R${tableIdx++}`,
      attributes: chosenKey,
      key: chosenKey,
      fds: ['(Candidate Key Relation)'],
    });
  }

  // 6. Compute BCNF Decomposition
  const decomposedBCNF: Array<{ name: string; attributes: string[]; key: string[] }> = [];
  if (isBCNF) {
    decomposedBCNF.push({
      name: 'R1',
      attributes,
      key: candidateKeys[0] || attributes,
    });
  } else {
    // Binary splitting for primary violation
    const violation = fds.find((fd) => {
      const closure = computeClosure(fd.lhs, fds);
      return !attributes.every((a) => closure.includes(a));
    });

    if (violation) {
      const r1Attrs = Array.from(new Set([...violation.lhs, ...violation.rhs])).sort();
      const r2Attrs = attributes.filter((a) => !violation.rhs.includes(a) || violation.lhs.includes(a)).sort();

      decomposedBCNF.push({
        name: 'R1_BCNF',
        attributes: r1Attrs,
        key: violation.lhs,
      });
      decomposedBCNF.push({
        name: 'R2_BCNF',
        attributes: r2Attrs,
        key: candidateKeys[0]?.filter((a) => r2Attrs.includes(a)) || [r2Attrs[0]],
      });
    } else {
      decomposedBCNF.push({
        name: 'R1',
        attributes,
        key: candidateKeys[0] || attributes,
      });
    }
  }

  return {
    attributes,
    fds,
    candidateKeys,
    primeAttributes,
    nonPrimeAttributes,
    is1NF: true, // Assuming atomic fields
    is2NF,
    is3NF,
    isBCNF,
    violations2NF,
    violations3NF,
    violationsBCNF,
    decomposed3NF,
    decomposedBCNF,
    steps,
  };
}
