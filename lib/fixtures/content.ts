/**
 * Fixtures for building UI before the content tables exist.
 *
 * docs/content-model.md is explicit that the content schema lands once there
 * is UI rendering a lesson, so the model gets shaped by something real:
 * "build components against fixtures in this shape". These are that shape.
 *
 * When Phase 1 lands, these types are replaced by the Drizzle inferred types
 * and the data by real queries. Nothing in `components/margin` should need to
 * change — that is the point of typing them here rather than inline.
 */

export type Locale = "fr" | "en";

export type Level = "beginner" | "intermediate" | "advanced";

/** Per locale, never per entity. A lesson is routinely published in FR and
 *  draft in EN, and every read path has to survive that. */
export type PublishStatus = "draft" | "in_review" | "published" | "archived";

/** Why a learner cannot open something. `null` means they can. */
export type AccessState = null | "requires-subscription" | "requires-prerequisite";

export interface Concept {
  id: string;
  slug: string;
  /** Display name for the current locale. */
  name: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Two levels: group → subcategory. */
  parentId: string | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryId: string;
  categoryName: string;
  level: Level;
  /** Minutes. Locale-invariant, lives on the parent row. */
  estimatedMinutes: number;
  chapterCount: number;
  lessonCount: number;
  status: PublishStatus;
  /** Locales this course is actually readable in. */
  availableLocales: Locale[];
  accessState: AccessState;
  hasFreePreview: boolean;
  /**
   * Cover art. Null until the content team produces it — `CourseCover` draws
   * a deterministic abstract placeholder instead, so an unillustrated catalog
   * still looks finished and no placeholder can ever be mistaken for a real
   * photograph (AGENTS.md rule 1).
   */
  coverImageUrl?: string | null;
}

/** User-domain. Never cached, never joined to the content above inside a
 *  cached function. */
export interface CourseProgress {
  courseId: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  /** Slug of the lesson to resume at, if any. */
  resumeLessonSlug: string | null;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  position: number;
  estimatedMinutes: number;
  isFreePreview: boolean;
  status: PublishStatus;
  availableLocales: Locale[];
  accessState: AccessState;
  completed: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

/* -------------------------------------------------------------------------
   Blocks — the v1 types from docs/content-model.md.
   ------------------------------------------------------------------------- */

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "callout"
  | "example"
  | "chart"
  | "quiz"
  | "flashcards"
  | "exercise"
  | "resource";

interface BlockBase {
  id: string;
  position: number;
  /** Block payloads change shape; versioning lets old content keep
   *  rendering while new content uses a newer shape. */
  schemaVersion: number;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  level: 2 | 3;
  text: string;
}

export interface TextBlock extends BlockBase {
  type: "text";
  /** Trusted, authored HTML from the CMS. */
  html: string;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  aspectRatio: number;
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  /** `risk` is not decoration — educational content carries mandatory risk
   *  disclaimers, see docs/stack.md. */
  tone: "note" | "tip" | "warning" | "risk";
  title: string;
  body: string;
}

export interface ExampleBlock extends BlockBase {
  type: "example";
  title: string;
  body: string;
}

export interface ChartAnnotation {
  /** 0–1 along the series. */
  at: number;
  /** Translatable. */
  label: string;
}

/** Data, never an image: annotations must be translatable, wrong data must be
 *  fixable without re-exporting an asset, and this block can later be
 *  upgraded to live market data without touching content. */
export interface ChartBlock extends BlockBase {
  type: "chart";
  symbol: string;
  timeframe: string;
  range: string;
  caption?: string;
  annotations: ChartAnnotation[];
  candles: Candle[];
}

export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation: string;
  /** Concepts this question tests. Mastery attaches here, never to the
   *  lesson. */
  conceptIds: string[];
}

export interface QuizBlock extends BlockBase {
  type: "quiz";
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardsBlock extends BlockBase {
  type: "flashcards";
  cards: Flashcard[];
}

export interface ExerciseBlock extends BlockBase {
  type: "exercise";
  title: string;
  instructions: string;
  steps: string[];
}

export interface ResourceBlock extends BlockBase {
  type: "resource";
  title: string;
  description: string;
  href: string;
  kind: "pdf" | "spreadsheet" | "link";
  /** Bytes. Undefined for external links. */
  sizeBytes?: number;
}

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | CalloutBlock
  | ExampleBlock
  | ChartBlock
  | QuizBlock
  | FlashcardsBlock
  | ExerciseBlock
  | ResourceBlock;

/* -------------------------------------------------------------------------
   Sample data — the worked example from docs/content-model.md.
   ------------------------------------------------------------------------- */

export const sampleConcepts: Concept[] = [
  { id: "c1", slug: "candlestick-anatomy", name: "Candlestick anatomy" },
  { id: "c2", slug: "chart-basics", name: "Chart basics" },
  { id: "c3", slug: "risk-per-trade", name: "Risk per trade" },
  { id: "c4", slug: "leverage", name: "Leverage" },
  { id: "c5", slug: "support-resistance", name: "Support and resistance" },
];

export const sampleCourses: Course[] = [
  {
    id: "co1",
    slug: "reading-a-price-chart",
    title: "Reading a price chart",
    summary:
      "Start at the very beginning: what the lines and bars actually mean, and how to look at one without feeling lost.",
    categoryId: "cat1",
    categoryName: "Foundations",
    level: "beginner",
    estimatedMinutes: 240,
    chapterCount: 4,
    lessonCount: 18,
    status: "published",
    availableLocales: ["fr", "en"],
    accessState: null,
    hasFreePreview: true,
  },
  {
    id: "co2",
    slug: "what-moves-a-market",
    title: "What moves a market",
    summary:
      "Supply, demand, news and expectation — why a price changes at all, explained without jargon.",
    categoryId: "cat1",
    categoryName: "Foundations",
    level: "beginner",
    estimatedMinutes: 180,
    chapterCount: 3,
    lessonCount: 12,
    status: "published",
    availableLocales: ["fr", "en"],
    accessState: null,
    hasFreePreview: false,
  },
  {
    id: "co3",
    slug: "risk-before-reward",
    title: "Risk before reward",
    summary:
      "The part most people skip. How much you can lose, how to size a position, and why this comes first.",
    categoryId: "cat2",
    categoryName: "Risk",
    level: "intermediate",
    estimatedMinutes: 300,
    chapterCount: 5,
    lessonCount: 21,
    status: "published",
    availableLocales: ["fr", "en"],
    accessState: "requires-subscription",
    hasFreePreview: true,
  },
  {
    id: "co4",
    slug: "understanding-leverage",
    title: "Understanding leverage",
    summary:
      "Borrowed money magnifies both directions. What that means in practice, with the arithmetic done slowly.",
    categoryId: "cat2",
    categoryName: "Risk",
    level: "intermediate",
    estimatedMinutes: 200,
    chapterCount: 4,
    lessonCount: 14,
    status: "published",
    availableLocales: ["fr"],
    accessState: "requires-subscription",
    hasFreePreview: false,
  },
  {
    id: "co5",
    slug: "building-a-first-portfolio",
    title: "Building a first portfolio",
    summary:
      "Putting the pieces together: what to hold, in what proportion, and how often to leave it alone.",
    categoryId: "cat3",
    categoryName: "Practice",
    level: "intermediate",
    estimatedMinutes: 360,
    chapterCount: 6,
    lessonCount: 24,
    status: "published",
    availableLocales: ["fr", "en"],
    accessState: "requires-subscription",
    hasFreePreview: false,
  },
  {
    id: "co6",
    slug: "reading-the-order-book",
    title: "Reading the order book",
    summary:
      "Where the price actually comes from — bids, asks and the queue behind every quote.",
    categoryId: "cat3",
    categoryName: "Practice",
    level: "advanced",
    estimatedMinutes: 280,
    chapterCount: 5,
    lessonCount: 19,
    status: "published",
    availableLocales: ["fr", "en"],
    accessState: "requires-prerequisite",
    hasFreePreview: false,
  },
];

export const sampleProgress: CourseProgress[] = [
  {
    courseId: "co1",
    lessonsCompleted: 11,
    lessonsTotal: 18,
    resumeLessonSlug: "anatomy-of-a-candlestick",
  },
  {
    courseId: "co2",
    lessonsCompleted: 12,
    lessonsTotal: 12,
    resumeLessonSlug: null,
  },
  {
    courseId: "co3",
    lessonsCompleted: 0,
    lessonsTotal: 21,
    resumeLessonSlug: null,
  },
];

export const sampleChapters: Chapter[] = [
  {
    id: "ch1",
    title: "What a chart is",
    position: 1,
    lessons: [
      {
        id: "l1",
        slug: "why-price-is-drawn",
        title: "Why price is drawn at all",
        position: 1,
        estimatedMinutes: 8,
        isFreePreview: true,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: null,
        completed: true,
      },
      {
        id: "l2",
        slug: "axes-and-time",
        title: "Axes, time and scale",
        position: 2,
        estimatedMinutes: 11,
        isFreePreview: true,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: null,
        completed: true,
      },
      {
        id: "l3",
        slug: "line-bar-candle",
        title: "Line, bar, candle",
        position: 3,
        estimatedMinutes: 14,
        isFreePreview: false,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: null,
        completed: true,
      },
    ],
  },
  {
    id: "ch2",
    title: "The candlestick",
    position: 2,
    lessons: [
      {
        id: "l4",
        slug: "anatomy-of-a-candlestick",
        title: "Anatomy of a candlestick",
        position: 1,
        estimatedMinutes: 16,
        isFreePreview: false,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: null,
        completed: false,
      },
      {
        id: "l5",
        slug: "what-a-wick-tells-you",
        title: "What a wick tells you",
        position: 2,
        estimatedMinutes: 12,
        isFreePreview: false,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: null,
        completed: false,
      },
      {
        id: "l6",
        slug: "reading-a-session",
        title: "Reading a whole session",
        position: 3,
        estimatedMinutes: 18,
        isFreePreview: false,
        // Published in French, still draft in English. The single most
        // common real-world state, and the one that bites hardest.
        status: "published",
        availableLocales: ["fr"],
        accessState: null,
        completed: false,
      },
    ],
  },
  {
    id: "ch3",
    title: "Patterns, carefully",
    position: 3,
    lessons: [
      {
        id: "l7",
        slug: "why-patterns-mislead",
        title: "Why patterns mislead beginners",
        position: 1,
        estimatedMinutes: 15,
        isFreePreview: false,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: "requires-subscription",
        completed: false,
      },
      {
        id: "l8",
        slug: "support-and-resistance",
        title: "Support and resistance",
        position: 2,
        estimatedMinutes: 20,
        isFreePreview: false,
        status: "published",
        availableLocales: ["fr", "en"],
        accessState: "requires-subscription",
        completed: false,
      },
    ],
  },
];

/** EURUSD daily, the candle in block 3 of the worked example. */
const sampleCandles: Candle[] = [
  { t: "2026-06-01", o: 1.0812, h: 1.0848, l: 1.0796, c: 1.0839 },
  { t: "2026-06-02", o: 1.0839, h: 1.0861, l: 1.0821, c: 1.0827 },
  { t: "2026-06-03", o: 1.0827, h: 1.0834, l: 1.0772, c: 1.0785 },
  { t: "2026-06-04", o: 1.0785, h: 1.0819, l: 1.0768, c: 1.0812 },
  { t: "2026-06-05", o: 1.0812, h: 1.0894, l: 1.0805, c: 1.0886 },
  { t: "2026-06-08", o: 1.0886, h: 1.0902, l: 1.0843, c: 1.0851 },
  { t: "2026-06-09", o: 1.0851, h: 1.0878, l: 1.0796, c: 1.0803 },
  { t: "2026-06-10", o: 1.0803, h: 1.0815, l: 1.0741, c: 1.0758 },
  { t: "2026-06-11", o: 1.0758, h: 1.0796, l: 1.0752, c: 1.0788 },
  { t: "2026-06-12", o: 1.0788, h: 1.0842, l: 1.0781, c: 1.0836 },
  { t: "2026-06-15", o: 1.0836, h: 1.0871, l: 1.0828, c: 1.0864 },
  { t: "2026-06-16", o: 1.0864, h: 1.0925, l: 1.0858, c: 1.0918 },
];

/** The worked example lesson from docs/content-model.md, block for block. */
export const sampleBlocks: Block[] = [
  {
    id: "b1",
    position: 1,
    schemaVersion: 1,
    type: "heading",
    // A section heading, not the lesson's title. The lesson entity already
    // carries its title, and the player renders it — repeating it as the first
    // body block shows the reader the same words twice and models authoring
    // we do not want. `level` here is depth inside the lesson, not a tag.
    level: 2,
    text: "What a candlestick is",
  },
  {
    id: "b2",
    position: 2,
    schemaVersion: 1,
    type: "text",
    html: "<p>A candlestick is a summary. It takes everything that happened to a price over one slice of time — a day, an hour, a minute — and compresses it into a single shape you can read at a glance.</p><p>There are only four numbers in it. Once you know which is which, every chart in the world becomes legible.</p>",
  },
  {
    id: "b3",
    position: 3,
    schemaVersion: 1,
    type: "chart",
    symbol: "EURUSD",
    timeframe: "1D",
    range: "2026-06-01/2026-06-16",
    caption: "Euro against the US dollar, one candle per day.",
    annotations: [
      { at: 0.42, label: "A day that closed lower than it opened" },
      { at: 0.83, label: "A long upper wick — buyers pushed, then gave it back" },
    ],
    candles: sampleCandles,
  },
  {
    id: "b4",
    position: 4,
    schemaVersion: 1,
    type: "text",
    html: "<p>The four numbers are the <strong>open</strong>, the <strong>high</strong>, the <strong>low</strong> and the <strong>close</strong>.</p><ul><li><strong>Open</strong> — the first price of the period.</li><li><strong>High</strong> — the highest price reached.</li><li><strong>Low</strong> — the lowest price reached.</li><li><strong>Close</strong> — the last price of the period.</li></ul><p>The body of the candle spans open to close. The thin lines above and below — the wicks — reach out to the high and the low.</p>",
  },
  {
    id: "b5",
    position: 5,
    schemaVersion: 1,
    type: "callout",
    tone: "note",
    title: "Colour is a convention, not a rule",
    body: "Most platforms fill the body one way when the close is above the open and another way when it is below. Which colours they use varies, and you can usually change them. The shape is what carries the meaning.",
  },
  {
    id: "b6",
    position: 6,
    schemaVersion: 1,
    type: "example",
    title: "Reading one candle",
    body: "Suppose a daily candle opens at 1.0803, reaches 1.0815, falls to 1.0741 and closes at 1.0758. The body runs from 1.0803 down to 1.0758, so the day finished lower than it started. The lower wick stretches to 1.0741 — at some point the price went further down than where it ended, and buyers brought it back.",
  },
  {
    id: "b7",
    position: 7,
    schemaVersion: 1,
    type: "quiz",
    questions: [
      {
        id: "q1",
        prompt: "Which two numbers define the body of a candlestick?",
        options: [
          { id: "q1a", text: "The high and the low", correct: false },
          { id: "q1b", text: "The open and the close", correct: true },
          { id: "q1c", text: "The close and the high", correct: false },
        ],
        explanation:
          "The body spans open to close. The high and the low are reached by the wicks.",
        conceptIds: ["c1"],
      },
      {
        id: "q2",
        prompt: "A candle has a long upper wick and a small body. What happened?",
        options: [
          { id: "q2a", text: "The price never moved much", correct: false },
          {
            id: "q2b",
            text: "The price rose well above where it finished, then came back",
            correct: true,
          },
          { id: "q2c", text: "The period had no trading", correct: false },
        ],
        explanation:
          "A long upper wick means the high was far above the close: the move up was not held.",
        conceptIds: ["c1"],
      },
    ],
  },
  {
    id: "b8",
    position: 8,
    schemaVersion: 1,
    type: "exercise",
    title: "Find the four numbers",
    instructions:
      "Open the chart above and pick any single candle. Without looking at the tooltip, say out loud where its open, high, low and close are. Then check.",
    steps: [
      "Choose a candle roughly in the middle of the chart.",
      "Point to the top and bottom of the body — those are the open and close.",
      "Follow each wick to its tip — those are the high and the low.",
      "Decide whether the period finished higher or lower than it started.",
    ],
  },
  {
    id: "b9",
    position: 9,
    schemaVersion: 1,
    type: "flashcards",
    cards: [
      { id: "f1", front: "Open", back: "The first price of the period." },
      { id: "f2", front: "High", back: "The highest price reached during the period." },
      { id: "f3", front: "Low", back: "The lowest price reached during the period." },
      { id: "f4", front: "Close", back: "The last price of the period." },
      {
        id: "f5",
        front: "Body",
        back: "The thick part of the candle, spanning open to close.",
      },
      {
        id: "f6",
        front: "Wick",
        back: "The thin line reaching from the body to the high or the low.",
      },
    ],
  },
  {
    id: "b10",
    position: 10,
    schemaVersion: 1,
    type: "callout",
    tone: "risk",
    title: "This is education, not advice",
    body: "Nothing here is a recommendation to buy or sell anything. Trading and investing carry a real risk of losing money, including more than you put in when leverage is involved.",
  },
  {
    id: "b11",
    position: 11,
    schemaVersion: 1,
    type: "resource",
    title: "Candlestick anatomy — one-page summary",
    description: "The four numbers and the shape they make, on a single sheet.",
    href: "#",
    kind: "pdf",
    sizeBytes: 184_320,
  },
];

export const sampleCategories: Category[] = [
  { id: "cat1", slug: "foundations", name: "Foundations", parentId: null },
  { id: "cat2", slug: "risk", name: "Risk", parentId: null },
  { id: "cat3", slug: "practice", name: "Practice", parentId: null },
];
