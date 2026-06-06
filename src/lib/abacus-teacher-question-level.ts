import { formatAbacusCeilingLabel } from '@/lib/abacus-access';

function normalizeTeacherInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/plus/g, '+')
    .replace(/minus/g, '-')
    .replace(/times/g, '*')
    .replace(/dividedby/g, '/')
    .replace(/divided\s*by/g, '/')
    .replace(/div/g, '/')
    .replace(/[x×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/\s+/g, '');
}

const OPERATIONS = {
  DIRECT_ADD: 'direct_add',
  DIRECT_SUB: 'direct_sub',
  FIVE_ADD: '5add',
  FIVE_SUB: '5sub',
  TEN_ADD: '10add',
  TEN_SUB: '10sub',
  MIX_ADD: 'mixadd',
  MIX_SUB: 'mixsub',
  MASTERING: 'mastering',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  DECIMAL: 'decimal',
  DECIMALMUL: 'decimalmul',
  DECIMALDIVI: 'decimaldivi',
  BODMAS: 'bodmas',
  SQRT: 'sqrt',
  PERCENT: 'percent',
  RANDOM: 'random',
} as const;

type OpTopic = (typeof OPERATIONS)[keyof typeof OPERATIONS];

const TOPIC_LABELS: Record<string, string> = {
  [OPERATIONS.DIRECT_ADD]: 'direct addition',
  [OPERATIONS.DIRECT_SUB]: 'direct subtraction',
  [OPERATIONS.FIVE_ADD]: "5's addition",
  [OPERATIONS.FIVE_SUB]: "5's subtraction",
  [OPERATIONS.TEN_ADD]: "10's addition",
  [OPERATIONS.TEN_SUB]: "10's subtraction",
  [OPERATIONS.MIX_ADD]: 'mixed addition',
  [OPERATIONS.MIX_SUB]: 'mixed subtraction',
  [OPERATIONS.MASTERING]: 'mastering sums',
  [OPERATIONS.MULTIPLY]: 'multiplication',
  [OPERATIONS.DIVIDE]: 'division',
  [OPERATIONS.DECIMAL]: 'decimals',
  [OPERATIONS.BODMAS]: 'BODMAS',
  [OPERATIONS.SQRT]: 'square roots',
  [OPERATIONS.PERCENT]: 'percentages',
  [OPERATIONS.RANDOM]: 'advanced mixed topics',
};

const tensDirectAddRestricted: Record<number, number[]> = {
  1: [1, 2, 5, 6, 7],
  2: [1, 5, 6],
  3: [5],
  5: [1, 2, 3],
  6: [1, 2],
  7: [1],
  8: [0],
};

const tensDirectSubRestricted: Record<number, number[]> = {
  2: [1],
  3: [1],
  4: [1, 2],
  6: [0],
  7: [1, 5],
  8: [1, 2, 5, 6],
  9: [1, 2, 3, 5, 6, 7],
};

const directAdd: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 7, 8],
  2: [1, 2, 5, 6, 7],
  3: [1, 5, 6],
  4: [5],
  5: [1, 2, 3, 4],
  6: [1, 2, 3],
  7: [1, 2],
  8: [1],
};

const directSub: Record<number, number[]> = {
  1: [1],
  2: [1, 2],
  3: [1, 2, 3],
  4: [1, 2, 3, 4],
  5: [5],
  6: [1, 5, 6],
  7: [1, 2, 5, 6, 7],
  8: [1, 2, 3, 5, 6, 7, 8],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const fiveAdd: Record<number, number[]> = {
  1: [4],
  2: [3, 4],
  3: [2, 3, 4],
  4: [1, 2, 3, 4],
};

const fiveSub: Record<number, number[]> = {
  5: [1, 2, 3, 4],
  6: [2, 3, 4],
  7: [3, 4],
  8: [4],
};

const tenAdd: Record<number, number[]> = {
  1: [9],
  2: [8, 9],
  3: [7, 8, 9],
  4: [6, 7, 8, 9],
  5: [5],
  6: [4, 5, 9],
  7: [3, 4, 5, 8, 9],
  8: [2, 3, 4, 5, 7, 8, 9],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const tenSub: Record<number, number[]> = {
  0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  1: [2, 3, 4, 5, 7, 8, 9],
  2: [3, 4, 5, 9],
  3: [4, 5, 9],
  4: [5],
  5: [6, 7, 8, 9],
  6: [7, 8, 9],
  7: [8, 9],
  8: [9],
};

const mixAdd: Record<number, number[]> = {
  5: [6, 7, 8, 9],
  6: [6, 7, 8],
  7: [6, 7],
  8: [6],
};

const mixSub: Record<number, number[]> = {
  1: [6],
  2: [6, 7],
  3: [6, 7, 8],
  4: [6, 7, 8, 9],
};

const COMPLEMENT_TOPICS: OpTopic[] = [
  OPERATIONS.DIRECT_ADD,
  OPERATIONS.DIRECT_SUB,
  OPERATIONS.FIVE_ADD,
  OPERATIONS.FIVE_SUB,
  OPERATIONS.TEN_ADD,
  OPERATIONS.TEN_SUB,
  OPERATIONS.MIX_ADD,
  OPERATIONS.MIX_SUB,
];

export type TeacherQuestionLevelResult =
  | { ok: true }
  | { ok: false; message: string };

function levelTopics(category: string, levelName: string): OpTopic[] {
  if (category === 'Star Juniors') {
    if (levelName === 'SJ1') return [OPERATIONS.DIRECT_ADD];
    if (levelName === 'SJ2') return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB];
    if (levelName === 'SJ3')
      return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB, OPERATIONS.FIVE_ADD];
    if (levelName === 'SJ4') return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB];
  }

  if (category === 'Juniors') {
    if (levelName === 'J1')
      return [
        OPERATIONS.DIRECT_ADD,
        OPERATIONS.DIRECT_SUB,
        OPERATIONS.FIVE_ADD,
        OPERATIONS.FIVE_SUB,
      ];
    if (levelName === 'J2') return [OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB];
    if (levelName === 'J3') return [OPERATIONS.MIX_ADD, OPERATIONS.MIX_SUB];
    if (levelName === 'J4') return [OPERATIONS.MASTERING];
  }

  if (category === 'Seniors') {
    if (levelName === 'S1')
      return [
        OPERATIONS.FIVE_ADD,
        OPERATIONS.FIVE_SUB,
        OPERATIONS.TEN_ADD,
        OPERATIONS.TEN_SUB,
      ];
    if (levelName === 'S2')
      return [
        OPERATIONS.FIVE_ADD,
        OPERATIONS.FIVE_SUB,
        OPERATIONS.TEN_ADD,
        OPERATIONS.TEN_SUB,
        OPERATIONS.MIX_ADD,
        OPERATIONS.MIX_SUB,
      ];
    if (levelName === 'S3') return [OPERATIONS.MASTERING];
    if (levelName === 'S4') return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY];
    if (levelName === 'S5')
      return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE];
    if (levelName === 'S6')
      return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE, OPERATIONS.DECIMAL];
    if (levelName === 'S7')
      return [OPERATIONS.MULTIPLY, OPERATIONS.DECIMAL, OPERATIONS.MASTERING, OPERATIONS.DECIMALMUL];
    if (levelName === 'S8')
      return [
        OPERATIONS.DECIMALMUL,
        OPERATIONS.DECIMALDIVI,
        OPERATIONS.MULTIPLY,
        OPERATIONS.DIVIDE,
        OPERATIONS.BODMAS,
      ];
    if (levelName === 'S9')
      return [
        OPERATIONS.MULTIPLY,
        OPERATIONS.DIVIDE,
        OPERATIONS.BODMAS,
        OPERATIONS.SQRT,
        OPERATIONS.PERCENT,
      ];
    if (levelName === 'S10') return [OPERATIONS.RANDOM];
  }

  return [OPERATIONS.DIRECT_ADD];
}

function topicOperation(topic: OpTopic): '+' | '-' {
  if (
    topic === OPERATIONS.DIRECT_ADD ||
    topic === OPERATIONS.FIVE_ADD ||
    topic === OPERATIONS.TEN_ADD ||
    topic === OPERATIONS.MIX_ADD
  ) {
    return '+';
  }
  if (
    topic === OPERATIONS.DIRECT_SUB ||
    topic === OPERATIONS.FIVE_SUB ||
    topic === OPERATIONS.TEN_SUB ||
    topic === OPERATIONS.MIX_SUB
  ) {
    return '-';
  }
  return '+';
}

function digitTable(topic: OpTopic, op: '+' | '-', isTens: boolean): Record<number, number[]> | null {
  if (isTens) {
    if (topic === OPERATIONS.TEN_ADD || topic === OPERATIONS.MIX_ADD) {
      return op === '+' ? tensDirectAddRestricted : null;
    }
    if (topic === OPERATIONS.TEN_SUB || topic === OPERATIONS.MIX_SUB) {
      return op === '-' ? tensDirectSubRestricted : null;
    }
    if (topic === OPERATIONS.DIRECT_ADD || topic === OPERATIONS.FIVE_ADD) {
      return op === '+' ? directAdd : null;
    }
    if (topic === OPERATIONS.DIRECT_SUB || topic === OPERATIONS.FIVE_SUB) {
      return op === '-' ? directSub : null;
    }
    return null;
  }

  switch (topic) {
    case OPERATIONS.DIRECT_ADD:
      return op === '+' ? directAdd : null;
    case OPERATIONS.DIRECT_SUB:
      return op === '-' ? directSub : null;
    case OPERATIONS.FIVE_ADD:
      return op === '+' ? fiveAdd : null;
    case OPERATIONS.FIVE_SUB:
      return op === '-' ? fiveSub : null;
    case OPERATIONS.TEN_ADD:
      return op === '+' ? tenAdd : null;
    case OPERATIONS.TEN_SUB:
      return op === '-' ? tenSub : null;
    case OPERATIONS.MIX_ADD:
      return op === '+' ? mixAdd : null;
    case OPERATIONS.MIX_SUB:
      return op === '-' ? mixSub : null;
    default:
      return null;
  }
}

function digitTopicsForLevel(topics: OpTopic[]): OpTopic[] {
  if (topics.includes(OPERATIONS.RANDOM)) return COMPLEMENT_TOPICS;
  if (topics.includes(OPERATIONS.MASTERING) && topics.length === 1) return COMPLEMENT_TOPICS;
  if (topics.includes(OPERATIONS.MASTERING)) {
    return [...new Set([...topics.filter((t) => COMPLEMENT_TOPICS.includes(t)), ...COMPLEMENT_TOPICS])];
  }
  return topics.filter((t) => COMPLEMENT_TOPICS.includes(t));
}

function digitStepAllowed(
  current: number,
  digit: number,
  op: '+' | '-',
  digitTopics: OpTopic[],
  isTens: boolean,
): boolean {
  for (const topic of digitTopics) {
    if (topicOperation(topic) !== op) continue;
    const table = digitTable(topic, op, isTens);
    if (!table) continue;
    const allowed = table[current];
    if (allowed?.includes(digit)) return true;
  }
  return false;
}

function applyDigitStep(states: number[], rodIndex: number, digit: number, op: '+' | '-'): boolean {
  const current = states[rodIndex] ?? 0;
  const result = op === '+' ? current + digit : current - digit;

  if (result > 9) {
    states[rodIndex] = result - 10;
    const left = rodIndex - 1;
    if (left < 0) return false;
    states[left] = (states[left] ?? 0) + 1;
  } else if (result < 0) {
    let left = rodIndex - 1;
    while (left >= 0 && (states[left] ?? 0) === 0) {
      states[left] = 9;
      left--;
    }
    if (left < 0) return false;
    states[left] = (states[left] ?? 0) - 1;
    states[rodIndex] = result + 10;
  } else {
    states[rodIndex] = result;
  }
  return true;
}

function loadNumberOnStates(num: string, states: number[], rodCount: number): void {
  const digits = num.split('').reverse();
  for (let i = 0; i < digits.length; i++) {
    const rodIndex = rodCount - 1 - i;
    if (rodIndex < 0) continue;
    states[rodIndex] = parseInt(digits[i], 10);
  }
}

function formatAllowedTopics(topics: OpTopic[]): string {
  const labels = topics
    .filter((t) => TOPIC_LABELS[t])
    .map((t) => TOPIC_LABELS[t]);
  if (!labels.length) return 'sums for your assigned level';
  return labels.join(', ');
}

function levelMismatchMessage(category: string, level: string, topics: OpTopic[], detail: string): string {
  const ceiling = formatAbacusCeilingLabel(category, level);
  const allowed = formatAllowedTopics(topics);
  return `This question is not for your level. You are assigned ${ceiling}. Only ${allowed} are allowed. ${detail}`;
}

function parseQuestion(text: string) {
  const normalized = normalizeTeacherInput(text);
  const tokens = normalized.match(/(\d+|[+\-*/])/g);
  if (!tokens?.length) return null;

  const start = tokens.shift()!;
  const operations: Array<{ op: string; num: string }> = [];
  while (tokens.length >= 2) {
    operations.push({ op: tokens.shift()!, num: tokens.shift()! });
  }
  return { start, operations, normalized };
}

function allowedExpressionOps(topics: OpTopic[]): Set<string> {
  const ops = new Set<string>();
  if (topics.includes(OPERATIONS.RANDOM)) {
    return new Set(['+', '-', '*', '/']);
  }
  for (const topic of topics) {
    if (
      topic === OPERATIONS.DIRECT_ADD ||
      topic === OPERATIONS.FIVE_ADD ||
      topic === OPERATIONS.TEN_ADD ||
      topic === OPERATIONS.MIX_ADD
    ) {
      ops.add('+');
    }
    if (
      topic === OPERATIONS.DIRECT_SUB ||
      topic === OPERATIONS.FIVE_SUB ||
      topic === OPERATIONS.TEN_SUB ||
      topic === OPERATIONS.MIX_SUB
    ) {
      ops.add('-');
    }
    if (topic === OPERATIONS.MASTERING) {
      ops.add('+');
      ops.add('-');
    }
    if (topic === OPERATIONS.MULTIPLY || topic === OPERATIONS.DECIMALMUL) ops.add('*');
    if (topic === OPERATIONS.DIVIDE || topic === OPERATIONS.DECIMALDIVI) ops.add('/');
  }
  return ops;
}

function allowsDecimals(topics: OpTopic[]): boolean {
  return topics.some((t) =>
    [OPERATIONS.DECIMAL, OPERATIONS.DECIMALMUL, OPERATIONS.DECIMALDIVI, OPERATIONS.RANDOM].includes(t),
  );
}

function allowsAdvancedSymbols(topics: OpTopic[]): boolean {
  return topics.some((t) =>
    [OPERATIONS.BODMAS, OPERATIONS.SQRT, OPERATIONS.PERCENT, OPERATIONS.RANDOM].includes(t),
  );
}

const ROD_COUNT = 13;

export function validateTeacherQuestionForLevel(
  raw: string,
  category: string,
  level: string,
): TeacherQuestionLevelResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: 'Enter a question first' };
  }

  if (!category || !level) {
    return { ok: false, message: 'Your category and level are not set. Contact your administrator.' };
  }

  const topics = levelTopics(category, level);
  const digitTopics = digitTopicsForLevel(topics);
  const allowedOps = allowedExpressionOps(topics);

  const parsed = parseQuestion(trimmed);
  if (!parsed) {
    return { ok: false, message: 'Invalid question — use whole numbers with + − × ÷' };
  }

  if (/[√%]/.test(parsed.normalized) && !allowsAdvancedSymbols(topics)) {
    return {
      ok: false,
      message: levelMismatchMessage(category, level, topics, 'Square roots and percentages are not part of this level.'),
    };
  }

  if (parsed.normalized.includes('.') && !allowsDecimals(topics)) {
    return {
      ok: false,
      message: levelMismatchMessage(category, level, topics, 'Decimal numbers are not part of this level.'),
    };
  }

  for (const opObj of parsed.operations) {
    if (!allowedOps.has(opObj.op)) {
      const opLabel =
        opObj.op === '*'
          ? 'multiplication'
          : opObj.op === '/'
            ? 'division'
            : opObj.op === '-'
              ? 'subtraction'
              : 'addition';
      return {
        ok: false,
        message: levelMismatchMessage(
          category,
          level,
          topics,
          `${opLabel.charAt(0).toUpperCase() + opLabel.slice(1)} is not part of this level.`,
        ),
      };
    }
  }

  const states = new Array(ROD_COUNT).fill(0);
  let runningValue = parseInt(parsed.start, 10);
  if (Number.isNaN(runningValue) || runningValue < 0) {
    return { ok: false, message: 'Use positive whole numbers only.' };
  }

  const needsInitialLoad =
    parsed.operations.length === 0 ||
    (parsed.operations[0].op !== '*' && parsed.operations[0].op !== '/');
  if (needsInitialLoad) loadNumberOnStates(parsed.start, states, ROD_COUNT);

  const isSj1 = category === 'Star Juniors' && level === 'SJ1';

  for (const opObj of parsed.operations) {
    if (opObj.op === '*' || opObj.op === '/') {
      const num = parseInt(opObj.num, 10);
      if (Number.isNaN(num) || num < 0) {
        return { ok: false, message: 'Use positive whole numbers for multiplication and division.' };
      }
      if (opObj.op === '*') runningValue *= num;
      else runningValue = num === 0 ? runningValue : Math.floor(runningValue / num);
      continue;
    }

    const operand = opObj.num;
    if (!/^\d+$/.test(operand)) {
      return { ok: false, message: 'Use whole numbers only for addition and subtraction.' };
    }

    if (isSj1) {
      if (opObj.op !== '+') {
        return {
          ok: false,
          message: levelMismatchMessage(category, level, topics, 'Only addition is allowed at this level.'),
        };
      }
      const value = parseInt(operand, 10);
      if (value < 1 || value > 9) {
        return {
          ok: false,
          message: levelMismatchMessage(
            category,
            level,
            topics,
            'At SJ1, add one digit at a time (1–9).',
          ),
        };
      }
      const rodIndex = ROD_COUNT - 1;
      const current = states[rodIndex] ?? 0;
      if (!digitStepAllowed(current, value, '+', digitTopics, false)) {
        return {
          ok: false,
          message: levelMismatchMessage(
            category,
            level,
            topics,
            `The step ${current} + ${value} does not match direct addition rules for your level.`,
          ),
        };
      }
      if (!applyDigitStep(states, rodIndex, value, '+')) {
        return { ok: false, message: 'This sum goes beyond the soroban columns.' };
      }
      runningValue += value;
      continue;
    }

    const digits = operand.split('');
    for (let i = digits.length - 1; i >= 0; i--) {
      const rodIndex = ROD_COUNT - 1 - (digits.length - 1 - i);
      if (rodIndex < 0) {
        return { ok: false, message: 'This sum is too large for the soroban.' };
      }
      const digit = parseInt(digits[i], 10);
      const current = states[rodIndex] ?? 0;
      const op = opObj.op as '+' | '-';

      if (!digitStepAllowed(current, digit, op, digitTopics, rodIndex < ROD_COUNT - 1)) {
        return {
          ok: false,
          message: levelMismatchMessage(
            category,
            level,
            topics,
            `The step ${current} ${op} ${digit} does not match your level rules.`,
          ),
        };
      }
      if (!applyDigitStep(states, rodIndex, digit, op)) {
        return { ok: false, message: 'This sum goes beyond the soroban columns.' };
      }
    }

    runningValue = opObj.op === '+' ? runningValue + parseInt(operand, 10) : runningValue - parseInt(operand, 10);
    if (runningValue < 0 && !topics.some((t) => t === OPERATIONS.MASTERING || t === OPERATIONS.RANDOM)) {
      return {
        ok: false,
        message: levelMismatchMessage(category, level, topics, 'This sum goes below zero.'),
      };
    }
  }

  return { ok: true };
}
