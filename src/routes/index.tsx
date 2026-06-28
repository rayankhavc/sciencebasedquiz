import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LangProvider, useLang, localizeQuestion } from "@/lib/i18n";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Science Based Quiz" },
      { name: "description", content: "Evidence-based quiz on anatomy, biomechanics, hypertrophy and nutrition. Battle bots and master the science." },
      { property: "og:title", content: "Science Based Quiz" },
      { property: "og:description", content: "Evidence-based quiz on anatomy, biomechanics, hypertrophy and nutrition." },
    ],
  }),
  component: App,
});


// ──────────────────────────────────────────────────────────────────────────────
// Question database
// ──────────────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hardcore";
type Category = "All" | "Nutrition" | "Biomechanics" | "Hypertrophy" | "Physiology";

type Question = {
  id: string;
  difficulty: Difficulty;
  category: Exclude<Category, "All">;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_pmid: string;
  source_url: string;
  // Optional French translations
  question_fr?: string;
  options_fr?: string[];
  explanation_fr?: string;
};


const QUESTIONS: Question[] = [
  // ── EASY ──
  {
    id: "e1",
    difficulty: "easy",
    category: "Nutrition",
    question: "Which supplement has the highest level of scientific evidence for increasing ATP recycling during high-intensity muscle contractions?",
    options: ["Creatine Monohydrate", "BCAA", "Glutamine", "Beta-Alanine"],
    correct_answer: "Creatine Monohydrate",
    explanation: "Creatine monohydrate increases phosphocreatine stores, allowing rapid resynthesis of ATP during short bursts of heavy exercise.",
    source_pmid: "28615996",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28615996/",
  },
  {
    id: "e2",
    difficulty: "easy",
    category: "Nutrition",
    question: "What is the commonly recommended daily protein intake range to maximize muscle protein synthesis in resistance-trained individuals?",
    options: ["0.8 g/kg/day", "1.6–2.2 g/kg/day", "3.5–4.0 g/kg/day", "0.4 g/kg/day"],
    correct_answer: "1.6–2.2 g/kg/day",
    explanation: "Meta-analyses converge on roughly 1.6–2.2 g/kg/day as the range that maximizes resistance-training adaptations; intake above this offers diminishing returns.",
    source_pmid: "28698222",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
  },
  {
    id: "e3",
    difficulty: "easy",
    category: "Physiology",
    question: "Which energy system dominates during a maximal effort lasting about 10 seconds?",
    options: ["Oxidative (aerobic)", "Glycolytic", "Phosphagen (ATP-PCr)", "Lipolytic"],
    correct_answer: "Phosphagen (ATP-PCr)",
    explanation: "The ATP-phosphocreatine system supplies the vast majority of energy during all-out efforts under ~10 seconds before glycolysis takes over.",
    source_pmid: "11252467",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/11252467/",
  },
  {
    id: "e4",
    difficulty: "easy",
    category: "Hypertrophy",
    question: "What is the minimum weekly set count per muscle group generally associated with significant hypertrophy gains in trained lifters?",
    options: ["2 sets", "10 sets", "30 sets", "50 sets"],
    correct_answer: "10 sets",
    explanation: "Schoenfeld et al. show a dose-response where ~10+ hard sets per muscle per week clearly outperforms low-volume work for hypertrophy.",
    source_pmid: "27433992",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
  },

  // ── MEDIUM ──
  {
    id: "m1",
    difficulty: "medium",
    category: "Biomechanics",
    question: "During a standard leg extension, at which position is the mechanical torque (resistance profile) highest on the rectus femoris?",
    options: [
      "Full extension (shortened position)",
      "90 degrees flexion (stretched position)",
      "Mid-range (45 degrees)",
      "The profile is perfectly linear",
    ],
    correct_answer: "Full extension (shortened position)",
    explanation: "Standard cam-based leg extensions maximize the moment arm when the shin is parallel to the floor, creating peak torque in full knee extension.",
    source_pmid: "35041043",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/35041043/",
  },
  {
    id: "m2",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "Within how many reps of failure must sets typically be taken to maximize hypertrophy in trained individuals?",
    options: ["0–5 reps of failure", "8–10 reps of failure", "12–15 reps of failure", "Failure is irrelevant"],
    correct_answer: "0–5 reps of failure",
    explanation: "Evidence indicates sets taken within roughly 0–5 reps of momentary muscular failure are needed to maximize stimulus per set in trained lifters.",
    source_pmid: "34822137",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/34822137/",
  },
  {
    id: "m3",
    difficulty: "medium",
    category: "Nutrition",
    question: "What is the approximate per-meal leucine threshold thought to maximally trigger muscle protein synthesis in young adults?",
    options: ["~0.5 g", "~1.0 g", "~2.5–3 g", "~6 g"],
    correct_answer: "~2.5–3 g",
    explanation: "Roughly 2.5–3 g of leucine per feeding is needed to robustly trigger mTORC1 signaling and maximize MPS in young adults.",
    source_pmid: "22451437",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/22451437/",
  },
  {
    id: "m4",
    difficulty: "medium",
    category: "Physiology",
    question: "Delayed onset muscle soreness (DOMS) is primarily attributed to:",
    options: ["Lactic acid accumulation", "Microscopic damage from eccentric contractions", "Dehydration", "Glycogen depletion"],
    correct_answer: "Microscopic damage from eccentric contractions",
    explanation: "DOMS is driven by ultrastructural muscle damage and inflammation following unaccustomed eccentric loading, not by lactate.",
    source_pmid: "12617692",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/12617692/",
  },

  // ── HARDCORE ──
  {
    id: "h1",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Which giant structural protein acts as a mechanosensor and is primarily responsible for generating passive tension during stretch-mediated hypertrophy?",
    options: ["Titin", "Actin", "Myosin", "Desmin"],
    correct_answer: "Titin",
    explanation: "Titin develops passive tension when muscle fibers are elongated, triggering intracellular signaling pathways (like titin kinase) required for stretch-mediated hypertrophy.",
    source_pmid: "31618140",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31618140/",
  },
  {
    id: "h2",
    difficulty: "hardcore",
    category: "Physiology",
    question: "What type of cellular adaptation is characterized by an increase in sarcoplasmic volume, including glycogen and water, without a concurrent increase in myofibrillar protein synthesis?",
    options: ["Sarcoplasmic Hypertrophy", "Myofibrillar Hypertrophy", "Hyperplasia", "Eccentric Remodeling"],
    correct_answer: "Sarcoplasmic Hypertrophy",
    explanation: "Sarcoplasmic hypertrophy involves the expansion of the non-contractile fluid and energy stores within the muscle sarcoplasm, independent of myofibrillar protein accretion.",
    source_pmid: "32174353",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/32174353/",
  },
  {
    id: "h3",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Which signaling pathway is the central anabolic regulator activated by mechanical tension and amino acids to drive muscle protein synthesis?",
    options: ["AMPK", "mTORC1", "FOXO3", "Myostatin/SMAD"],
    correct_answer: "mTORC1",
    explanation: "mTORC1 integrates mechanical and nutrient signals (leucine, IGF-1, mechanotransduction) to upregulate translation initiation and drive hypertrophy.",
    source_pmid: "21157483",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/21157483/",
  },
  {
    id: "h4",
    difficulty: "hardcore",
    category: "Biomechanics",
    question: "According to the force-length relationship, where is active isometric force production of a sarcomere maximal?",
    options: [
      "At very short sarcomere lengths (~1.6 µm)",
      "On the plateau of optimal myofilament overlap (~2.0–2.25 µm)",
      "At fully stretched lengths (~3.6 µm)",
      "Force is constant regardless of length",
    ],
    correct_answer: "On the plateau of optimal myofilament overlap (~2.0–2.25 µm)",
    explanation: "Gordon, Huxley & Julian's classic work shows peak active tension on the descending plateau where cross-bridge overlap between actin and myosin is optimal.",
    source_pmid: "5969491",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/5969491/",
  },
  // ===== Additional EASY =====
  {
    id: "e5",
    difficulty: "easy",
    category: "Hypertrophy",
    question: "Which weekly training volume range per muscle group is most commonly associated with maximizing hypertrophy in trained lifters?",
    options: ["1–3 sets", "4–6 sets", "10–20 sets", "30–40 sets"],
    correct_answer: "10–20 sets",
    explanation: "Meta-analyses (Schoenfeld et al.) show a dose–response up to roughly 10–20 hard sets per muscle per week before returns diminish.",
    source_pmid: "27433992",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
  },
  {
    id: "e6",
    difficulty: "easy",
    category: "Physiology",
    question: "What is the primary fuel for muscle contraction during a 1-rep max effort?",
    options: ["Free fatty acids", "ATP–phosphocreatine system", "Aerobic glycolysis", "Ketone bodies"],
    correct_answer: "ATP–phosphocreatine system",
    explanation: "Maximal efforts under ~10 seconds rely almost entirely on stored ATP and phosphocreatine (the alactic anaerobic system).",
    source_pmid: "11583104",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/11583104/",
  },
  {
    id: "e7",
    difficulty: "easy",
    category: "Nutrition",
    question: "What protein intake range (g/kg bodyweight/day) is recommended to maximize muscle protein synthesis in resistance-trained individuals?",
    options: ["0.4–0.8", "1.6–2.2", "3.0–4.0", "5.0+"],
    correct_answer: "1.6–2.2",
    explanation: "Morton et al.'s 2018 meta-analysis identified ~1.6 g/kg/day as the plateau, with little added benefit beyond ~2.2 g/kg.",
    source_pmid: "28698222",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
  },
  {
    id: "e8",
    difficulty: "easy",
    category: "Biomechanics",
    question: "Which joint action best describes the concentric phase of a barbell biceps curl?",
    options: ["Elbow extension", "Elbow flexion", "Shoulder abduction", "Wrist pronation"],
    correct_answer: "Elbow flexion",
    explanation: "The biceps brachii produces elbow flexion (and forearm supination); concentric = muscle shortens while producing force.",
    source_pmid: "26849784",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26849784/",
  },
  // ===== Additional MEDIUM =====
  {
    id: "m5",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "Training to failure vs. leaving 1–3 reps in reserve (RIR) produces what effect on long-term hypertrophy in trained lifters?",
    options: [
      "Failure is dramatically superior",
      "Similar hypertrophy with greater fatigue when training to failure",
      "RIR training causes muscle loss",
      "Only failure recruits high-threshold motor units",
    ],
    correct_answer: "Similar hypertrophy with greater fatigue when training to failure",
    explanation: "Grgic et al. found comparable hypertrophy between failure and non-failure protocols when volume is matched, but failure increases fatigue and recovery cost.",
    source_pmid: "34822137",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/34822137/",
  },
  {
    id: "m6",
    difficulty: "medium",
    category: "Nutrition",
    question: "What per-meal leucine threshold is typically cited to maximally stimulate muscle protein synthesis in young adults?",
    options: ["~0.7–3 g leucine (≈20–40 g high-quality protein)", "0.1 g leucine", "10 g leucine", "Leucine has no role in MPS"],
    correct_answer: "~0.7–3 g leucine (≈20–40 g high-quality protein)",
    explanation: "The 'leucine trigger' hypothesis (Phillips, Witard et al.) — ~2–3 g leucine, ≈20–40 g protein per meal saturates MPS in most young adults.",
    source_pmid: "24257722",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/24257722/",
  },
  {
    id: "m7",
    difficulty: "medium",
    category: "Physiology",
    question: "Which best describes Henneman's size principle of motor unit recruitment?",
    options: [
      "Motor units recruit randomly",
      "Large motor units recruit first",
      "Motor units recruit from smallest to largest as force demand rises",
      "Only Type II fibers are recruited under load",
    ],
    correct_answer: "Motor units recruit from smallest to largest as force demand rises",
    explanation: "Henneman (1965) — smaller, lower-threshold motor units are recruited first; high-threshold units join as force/fatigue increases.",
    source_pmid: "14328454",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/14328454/",
  },
  {
    id: "m8",
    difficulty: "medium",
    category: "Biomechanics",
    question: "How does sticking-point biomechanics in the bench press typically manifest?",
    options: [
      "At lockout, due to triceps weakness",
      "Off the chest, due to long moment arms and low mechanical advantage",
      "Sticking points don't exist in the bench press",
      "Mid-range, due to muscle inhibition",
    ],
    correct_answer: "Off the chest, due to long moment arms and low mechanical advantage",
    explanation: "Van den Tillaar & Ettema describe the sticking region just above the chest where shoulder/elbow moment arms create the lowest mechanical advantage.",
    source_pmid: "20093961",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/20093961/",
  },
  // ===== Additional HARDCORE =====
  {
    id: "h5",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Long-length partials (lengthened-position training) vs. full ROM: what does recent evidence suggest?",
    options: [
      "Full ROM is always superior",
      "Training at long muscle lengths can produce equal or greater regional hypertrophy",
      "Partials cause sarcomere loss",
      "ROM has no effect on hypertrophy",
    ],
    correct_answer: "Training at long muscle lengths can produce equal or greater regional hypertrophy",
    explanation: "Maeo, Pedrosa, Wolf et al. show long-length partials can match or exceed full ROM for hypertrophy, especially in distal regions of biarticular muscles.",
    source_pmid: "36029271",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/36029271/",
  },
  {
    id: "h6",
    difficulty: "hardcore",
    category: "Physiology",
    question: "Which molecular pathway is the central regulator of muscle protein synthesis in response to mechanical loading and amino acids?",
    options: ["AMPK/PGC-1α", "mTORC1 (via p70S6K and 4E-BP1)", "NF-κB inflammation pathway", "Myostatin/SMAD3"],
    correct_answer: "mTORC1 (via p70S6K and 4E-BP1)",
    explanation: "Mechanical tension and leucine activate mTORC1 → phosphorylation of p70S6K1 and 4E-BP1 → increased translation initiation and MPS.",
    source_pmid: "21795434",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/21795434/",
  },
  {
    id: "h7",
    difficulty: "hardcore",
    category: "Biomechanics",
    question: "On the force–velocity curve of skeletal muscle, what happens to active force as concentric shortening velocity increases?",
    options: [
      "Force increases linearly with velocity",
      "Force decreases hyperbolically (Hill's equation)",
      "Force is independent of velocity",
      "Force rises then plateaus",
    ],
    correct_answer: "Force decreases hyperbolically (Hill's equation)",
    explanation: "A.V. Hill's classic model: concentric force falls as velocity rises (fewer attached cross-bridges per unit time); eccentric force exceeds isometric.",
    source_pmid: "0",
    source_url: "https://royalsocietypublishing.org/doi/10.1098/rspb.1938.0050",
  },
  {
    id: "h8",
    difficulty: "hardcore",
    category: "Nutrition",
    question: "What does the current evidence say about creatine monohydrate loading vs. a maintenance-only protocol (3–5 g/day)?",
    options: [
      "Loading is mandatory for any benefit",
      "Both saturate muscle creatine; loading just gets there faster (~7 days vs. ~28 days)",
      "Maintenance-only does not raise muscle creatine",
      "Loading permanently elevates creatine stores",
    ],
    correct_answer: "Both saturate muscle creatine; loading just gets there faster (~7 days vs. ~28 days)",
    explanation: "Hultman et al. (1996) showed 20 g/day × 6 d and 3 g/day × 28 d reach equivalent muscle creatine saturation.",
    source_pmid: "8828669",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/8828669/",
  },
  {
    id: "h9",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Mechanical tension, metabolic stress, and muscle damage were proposed as hypertrophy drivers (Schoenfeld 2010). Current consensus emphasizes which?",
    options: [
      "Muscle damage as the primary driver",
      "Metabolic stress alone",
      "Mechanical tension as the dominant, possibly sole necessary stimulus",
      "Hormonal spikes (testosterone/GH) post-workout",
    ],
    correct_answer: "Mechanical tension as the dominant, possibly sole necessary stimulus",
    explanation: "More recent reviews (Schoenfeld, Wackerhage) argue mechanical tension via mechanotransduction is the primary driver; damage and acute hormones contribute little independently.",
    source_pmid: "30580468",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30580468/",
  },

  // ─── Easy (additional) ──────────────────────────────────────────────
  {
    id: "e5",
    difficulty: "easy",
    category: "Nutrition",
    question: "According to the ISSN position stand, what is a reasonable daily protein intake range to maximize resistance-training adaptations in healthy trained adults?",
    options: ["0.8 g/kg/day", "1.4–2.0 g/kg/day", "3.5–4.0 g/kg/day", "< 1.0 g/kg/day"],
    correct_answer: "1.4–2.0 g/kg/day",
    explanation: "The ISSN concludes that 1.4–2.0 g/kg/day is safe and sufficient for most training individuals, with higher intakes useful during energy deficit or aggressive recomposition.",
    source_pmid: "28642676",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
  },
  {
    id: "e6",
    difficulty: "easy",
    category: "Physiology",
    question: "Which energy system is the primary contributor to a maximal effort lasting roughly 5–10 seconds?",
    options: ["Oxidative phosphorylation", "Phosphagen (ATP–PCr) system", "Anaerobic glycolysis (lactate)", "Beta-oxidation"],
    correct_answer: "Phosphagen (ATP–PCr) system",
    explanation: "Phosphocreatine breakdown provides the fastest ATP resynthesis pathway and dominates very short, maximal efforts before glycolysis takes over.",
    source_pmid: "24791915",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/24791915/",
  },
  {
    id: "e7",
    difficulty: "easy",
    category: "Biomechanics",
    question: "What is the stretch-shortening cycle (SSC)?",
    options: [
      "A passive stretching routine before lifting",
      "A rapid eccentric–concentric coupling that augments concentric output",
      "The relaxation phase between two sets",
      "A slow tempo eccentric used for hypertrophy",
    ],
    correct_answer: "A rapid eccentric–concentric coupling that augments concentric output",
    explanation: "The SSC stores elastic energy and uses reflex potentiation during a fast eccentric to enhance the immediately following concentric action.",
    source_pmid: "10778660",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/10778660/",
  },
  {
    id: "e8",
    difficulty: "easy",
    category: "Nutrition",
    question: "Per the ISSN, an ergogenic caffeine dose for endurance and strength performance is roughly:",
    options: ["0.1–0.5 mg/kg", "3–6 mg/kg", "15–20 mg/kg", "> 25 mg/kg"],
    correct_answer: "3–6 mg/kg",
    explanation: "Doses of about 3–6 mg/kg taken ~60 min pre-exercise reliably improve endurance and have modest benefits on strength and power.",
    source_pmid: "33388079",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33388079/",
  },
  {
    id: "e9",
    difficulty: "easy",
    category: "Physiology",
    question: "On average, type II (fast-twitch) muscle fibers compared to type I fibers tend to have:",
    options: [
      "A smaller cross-sectional area",
      "A larger cross-sectional area and greater hypertrophic potential",
      "Identical CSA in trained individuals",
      "Higher mitochondrial density",
    ],
    correct_answer: "A larger cross-sectional area and greater hypertrophic potential",
    explanation: "Type II fibers are typically larger than type I and show greater absolute hypertrophy with resistance training.",
    source_pmid: "17313189",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/17313189/",
  },
  {
    id: "e10",
    difficulty: "easy",
    category: "Hypertrophy",
    question: "Comparing full vs. partial range of motion, what does the evidence generally suggest for hypertrophy?",
    options: [
      "Partial ROM is universally superior",
      "Full ROM tends to produce equal or greater hypertrophy in most cases",
      "ROM is irrelevant when load is matched",
      "Only isometrics maximize hypertrophy",
    ],
    correct_answer: "Full ROM tends to produce equal or greater hypertrophy in most cases",
    explanation: "Meta-analytic data favor full ROM (especially training at long muscle lengths) over short partials for whole-muscle hypertrophy.",
    source_pmid: "32058014",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/32058014/",
  },
  {
    id: "e11",
    difficulty: "easy",
    category: "Physiology",
    question: "Dehydration of roughly what magnitude begins to measurably impair endurance performance?",
    options: ["0.1% body mass", "≥ 2% body mass", "10% body mass", "Hydration has no effect"],
    correct_answer: "≥ 2% body mass",
    explanation: "ACSM and subsequent reviews note that fluid losses of ≥ ~2% body mass impair aerobic performance and thermoregulation.",
    source_pmid: "17277604",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/17277604/",
  },
  {
    id: "e12",
    difficulty: "easy",
    category: "Nutrition",
    question: "What is the most consistently reported effect of vitamin D deficiency on skeletal muscle?",
    options: [
      "Improved type II fiber function",
      "Proximal weakness and impaired contractile function",
      "Accelerated hypertrophy",
      "No measurable muscular effect",
    ],
    correct_answer: "Proximal weakness and impaired contractile function",
    explanation: "Deficiency is associated with type II fiber atrophy and proximal weakness; repletion improves strength in deficient individuals.",
    source_pmid: "24587329",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/24587329/",
  },
  {
    id: "e13",
    difficulty: "easy",
    category: "Biomechanics",
    question: "Surface EMG amplitude during a lift is best interpreted as:",
    options: [
      "A direct measure of long-term hypertrophy",
      "A proxy of muscle activation that does not predict hypertrophy outcomes",
      "An exact count of activated motor units",
      "A measurement of mechanical tension on the fiber",
    ],
    correct_answer: "A proxy of muscle activation that does not predict hypertrophy outcomes",
    explanation: "Vigotsky et al. caution that EMG amplitude is a noisy proxy for neural drive and should not be used to infer hypertrophic stimulus.",
    source_pmid: "28486337",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28486337/",
  },
  {
    id: "e14",
    difficulty: "easy",
    category: "Hypertrophy",
    question: "Across the literature, what is a sensible weekly hard-set range per muscle to drive hypertrophy in trained lifters?",
    options: ["1–2 sets", "Roughly 10–20 sets", "50+ sets", "Volume is irrelevant"],
    correct_answer: "Roughly 10–20 sets",
    explanation: "Dose–response meta-analyses by Schoenfeld and colleagues place most trained individuals in a productive band of about 10–20 hard sets per muscle per week.",
    source_pmid: "27433992",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
  },

  // ─── Medium (additional) ────────────────────────────────────────────
  {
    id: "m5",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "When total weekly volume is equated, what does the evidence say about training a muscle 2× vs. 1× per week?",
    options: [
      "1× is clearly superior",
      "2× is at least as effective and often slightly better",
      "Frequency has no effect under any condition",
      "≥ 4× per week is required for any hypertrophy",
    ],
    correct_answer: "2× is at least as effective and often slightly better",
    explanation: "Schoenfeld et al.'s meta-analysis shows that, with equated volume, splitting sets across ≥ 2 sessions/week tends to yield slightly greater hypertrophy than 1×.",
    source_pmid: "27102172",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27102172/",
  },
  {
    id: "m6",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "For maximizing strength and hypertrophy on compound lifts, what rest interval is best supported?",
    options: [
      "≤ 30 seconds",
      "About 2–3 minutes or more",
      "Exactly 60 seconds",
      "Rest length does not matter",
    ],
    correct_answer: "About 2–3 minutes or more",
    explanation: "Longer rest (≥ 2 min) preserves per-set performance and produced greater hypertrophy and strength than 1-min rest in trained men.",
    source_pmid: "26605807",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26605807/",
  },
  {
    id: "m7",
    difficulty: "medium",
    category: "Nutrition",
    question: "What is the approximate per-meal leucine threshold thought to maximally trigger muscle protein synthesis in young adults?",
    options: ["~0.3 g", "~3 g", "~10 g", "~30 g"],
    correct_answer: "~3 g",
    explanation: "Roughly 2.5–3 g of leucine per meal (≈ 0.3 g/kg of high-quality protein) appears to robustly stimulate MPS in young adults.",
    source_pmid: "22150425",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/22150425/",
  },
  {
    id: "m8",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "Pareja-Blanco et al. showed that high intra-set velocity loss (e.g., 40%) compared to low velocity loss (e.g., 10–20%):",
    options: [
      "Always produces more hypertrophy and strength",
      "Produces similar or smaller strength gains with more fatigue and fiber-type shifts",
      "Has no effect on adaptations",
      "Eliminates the need for progressive overload",
    ],
    correct_answer: "Produces similar or smaller strength gains with more fatigue and fiber-type shifts",
    explanation: "Low velocity loss thresholds matched or beat high VL for strength/power, with less neuromuscular fatigue and preservation of type IIX fibers.",
    source_pmid: "27038416",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27038416/",
  },
  {
    id: "m9",
    difficulty: "medium",
    category: "Biomechanics",
    question: "Maeo et al. (2023) compared training at long vs. short muscle lengths and reported:",
    options: [
      "Short-length training produced more hypertrophy",
      "Long-length partials produced equal or greater hypertrophy, especially regionally",
      "ROM and length had no effect",
      "Only isometrics induced hypertrophy",
    ],
    correct_answer: "Long-length partials produced equal or greater hypertrophy, especially regionally",
    explanation: "Training in lengthened positions biased greater regional hypertrophy compared to short-length work at matched volume.",
    source_pmid: "36242755",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/36242755/",
  },
  {
    id: "m10",
    difficulty: "medium",
    category: "Nutrition",
    question: "What is the best-supported mechanism by which beta-alanine improves high-intensity performance?",
    options: [
      "Increasing intramuscular ATP stores",
      "Raising muscle carnosine and improving intramuscular H+ buffering",
      "Acting as a direct vasodilator",
      "Inhibiting lactate production",
    ],
    correct_answer: "Raising muscle carnosine and improving intramuscular H+ buffering",
    explanation: "Beta-alanine is the rate-limiting precursor of carnosine, which buffers protons during high-intensity efforts lasting ~1–4 min.",
    source_pmid: "25739105",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/25739105/",
  },
  {
    id: "m11",
    difficulty: "medium",
    category: "Biomechanics",
    question: "What does Schoenfeld & Grgic's review on squat depth conclude about deep squats and hypertrophy/strength?",
    options: [
      "Partial squats are uniformly superior",
      "Deeper squats tend to favor lower-limb hypertrophy with no greater injury risk in healthy lifters",
      "Squat depth is biomechanically irrelevant",
      "Only quarter squats build the quadriceps",
    ],
    correct_answer: "Deeper squats tend to favor lower-limb hypertrophy with no greater injury risk in healthy lifters",
    explanation: "Greater squat depth increases hip and knee extensor demand and is associated with superior lower-limb hypertrophy without elevated injury rates in healthy populations.",
    source_pmid: "32624324",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/32624324/",
  },
  {
    id: "m12",
    difficulty: "medium",
    category: "Physiology",
    question: "Greater muscle pennation angle generally results in:",
    options: [
      "Reduced contractile force capacity",
      "More contractile material in a given anatomical CSA, increasing force at the expense of fiber excursion",
      "Higher fiber shortening velocity",
      "No mechanical consequence",
    ],
    correct_answer: "More contractile material in a given anatomical CSA, increasing force at the expense of fiber excursion",
    explanation: "Pennation packs more sarcomeres in parallel (greater PCSA) increasing force capacity, while reducing the fiber's effective shortening range.",
    source_pmid: "11460867",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/11460867/",
  },
  {
    id: "m13",
    difficulty: "medium",
    category: "Hypertrophy",
    question: "How does training to (or very near) momentary failure compare to stopping with reps in reserve for hypertrophy?",
    options: [
      "Failure is required for any hypertrophy",
      "Stopping a few reps short generally produces similar hypertrophy with less fatigue",
      "Stopping short produces zero hypertrophy",
      "Only failure training builds type I fibers",
    ],
    correct_answer: "Stopping a few reps short generally produces similar hypertrophy with less fatigue",
    explanation: "Recent meta-analyses (Grgic et al.) show that stopping 1–3 reps short of failure yields hypertrophy outcomes broadly comparable to training to failure with lower fatigue cost.",
    source_pmid: "34669519",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/34669519/",
  },
  {
    id: "m14",
    difficulty: "medium",
    category: "Physiology",
    question: "VO2max is best described mechanistically as limited primarily by:",
    options: [
      "Skeletal muscle mitochondrial density alone",
      "Central cardiovascular oxygen delivery (cardiac output × arterial O2 content) in most healthy people",
      "Lung diffusing capacity exclusively",
      "Hemoglobin affinity alone",
    ],
    correct_answer: "Central cardiovascular oxygen delivery (cardiac output × arterial O2 content) in most healthy people",
    explanation: "Bassett & Howley summarize that, in most healthy individuals, maximal cardiac output and arterial O2 content are the primary limiters of VO2max.",
    source_pmid: "10647532",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/10647532/",
  },

  // ─── Hardcore (additional) ──────────────────────────────────────────
  {
    id: "h6",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Which molecular mechanism best explains mechanical-tension-induced mTORC1 activation in skeletal muscle?",
    options: [
      "Insulin receptor autophosphorylation",
      "Diacylglycerol kinase ζ–mediated phosphatidic acid production at the membrane",
      "Direct ATP binding to mTOR kinase",
      "Cortisol receptor translocation",
    ],
    correct_answer: "Diacylglycerol kinase ζ–mediated phosphatidic acid production at the membrane",
    explanation: "Hornberger and colleagues showed DGKζ-derived phosphatidic acid is a key second messenger linking mechanical loading to mTORC1 activation.",
    source_pmid: "31375607",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31375607/",
  },
  {
    id: "h7",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "What is the current view of satellite cells in long-term overload hypertrophy?",
    options: [
      "They are dispensable in all conditions",
      "They are required to add myonuclei and support hypertrophy beyond a ceiling defined by myonuclear domain",
      "They only contribute to fiber repair after injury, never to hypertrophy",
      "They differentiate into adipocytes during overload",
    ],
    correct_answer: "They are required to add myonuclei and support hypertrophy beyond a ceiling defined by myonuclear domain",
    explanation: "Murach et al. argue satellite-cell-mediated myonuclear accretion is needed to sustain hypertrophy past a domain ceiling, especially under prolonged overload.",
    source_pmid: "29687895",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29687895/",
  },
  {
    id: "h8",
    difficulty: "hardcore",
    category: "Physiology",
    question: "Muscle protein synthesis remains elevated above baseline following an intense bout of resistance exercise for approximately:",
    options: ["1–2 hours", "Up to 24–48 hours, with greater duration in untrained individuals", "1 week", "It does not change after exercise"],
    correct_answer: "Up to 24–48 hours, with greater duration in untrained individuals",
    explanation: "Burd et al. showed MPS remains elevated up to 24–48 h after resistance exercise, with longer/larger responses in untrained subjects.",
    source_pmid: "21289204",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/21289204/",
  },
  {
    id: "h9",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Across the training literature, eccentric vs. concentric-only resistance training tends to produce:",
    options: [
      "Identical hypertrophy in all studies",
      "A small but consistent advantage for eccentric training, partly via greater regional/whole-muscle hypertrophy",
      "Greater hypertrophy with concentric-only training",
      "Hypertrophy only in eccentric-trained limbs, zero in concentric limbs",
    ],
    correct_answer: "A small but consistent advantage for eccentric training, partly via greater regional/whole-muscle hypertrophy",
    explanation: "Schoenfeld et al.'s meta-analysis reports a small effect favoring eccentric training for hypertrophy compared to concentric-only protocols.",
    source_pmid: "28755103",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28755103/",
  },
  {
    id: "h10",
    difficulty: "hardcore",
    category: "Biomechanics",
    question: "Heavy eccentric training tends to induce which structural adaptation in the muscle?",
    options: [
      "A net decrease in pennation angle and fascicle length",
      "An increase in fascicle length via in-series sarcomerogenesis",
      "Replacement of titin by desmin",
      "Conversion of type II fibers into tendon",
    ],
    correct_answer: "An increase in fascicle length via in-series sarcomerogenesis",
    explanation: "Eccentric loading at long muscle lengths increases fascicle length by adding sarcomeres in series, as shown by Blazevich and others.",
    source_pmid: "17313281",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/17313281/",
  },
  {
    id: "h11",
    difficulty: "hardcore",
    category: "Physiology",
    question: "In concurrent training, the molecular 'interference' between strength and endurance adaptations is largely attributed to:",
    options: [
      "AMPK-mediated suppression of mTORC1 signaling after high-volume endurance work",
      "Glycogen-independent insulin resistance only",
      "Permanent inhibition of satellite cell activity",
      "Increased androgen receptor density",
    ],
    correct_answer: "AMPK-mediated suppression of mTORC1 signaling after high-volume endurance work",
    explanation: "Activation of AMPK by endurance work can blunt downstream mTORC1 signaling, although programming (mode, intensity, timing) modulates real-world interference.",
    source_pmid: "24728927",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/24728927/",
  },
  {
    id: "h12",
    difficulty: "hardcore",
    category: "Nutrition",
    question: "Compared to whey, plant proteins (e.g., soy) typically show a:",
    options: [
      "Higher acute leucine-driven MPS response at matched doses",
      "Lower acute MPS response, mitigated by higher doses or blends to match leucine content",
      "Identical MPS response in all conditions",
      "Anti-anabolic effect at any dose",
    ],
    correct_answer: "Lower acute MPS response, mitigated by higher doses or blends to match leucine content",
    explanation: "Differences in leucine content and digestion kinetics make many plant proteins less anabolic per gram, but matching leucine via higher doses or blends can close the gap.",
    source_pmid: "29722584",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29722584/",
  },
  {
    id: "h13",
    difficulty: "hardcore",
    category: "Hypertrophy",
    question: "Within a sensible range, how does total weekly set volume relate to hypertrophy?",
    options: [
      "A flat, no-dose response",
      "An approximate dose–response up to an individual ceiling, after which gains plateau or decline",
      "Strictly linear with no upper limit",
      "Inverse: less volume always produces more hypertrophy",
    ],
    correct_answer: "An approximate dose–response up to an individual ceiling, after which gains plateau or decline",
    explanation: "Meta-regressions (Schoenfeld, Baz-Valle) describe a dose–response that flattens and can invert at very high weekly set counts, with substantial inter-individual variability.",
    source_pmid: "27433992",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
  },
  {
    id: "h14",
    difficulty: "hardcore",
    category: "Biomechanics",
    question: "Force–velocity profiling in sprinting (Morin & Samozino) is primarily used to:",
    options: [
      "Predict VO2max from a single sprint",
      "Identify whether an athlete is force- or velocity-deficient to guide individualized training",
      "Replace strength testing entirely",
      "Estimate body fat percentage",
    ],
    correct_answer: "Identify whether an athlete is force- or velocity-deficient to guide individualized training",
    explanation: "The F–v profile derived from sprint mechanics flags force or velocity deficits, allowing training to target the limiting end of the profile.",
    source_pmid: "26222600",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26222600/",
  },
  {
    id: "h15",
    difficulty: "hardcore",
    category: "Physiology",
    question: "Resistance training is most consistently shown to increase which mitochondrial property in skeletal muscle?",
    options: [
      "A large increase in mitochondrial density comparable to endurance training",
      "Modest improvements in mitochondrial respiration and quality without large density gains",
      "Total ablation of mitochondria",
      "Conversion of mitochondria to peroxisomes",
    ],
    correct_answer: "Modest improvements in mitochondrial respiration and quality without large density gains",
    explanation: "Groennebaek & Vissing reviewed evidence that resistance training improves mitochondrial respiration and quality control with only modest changes in volume density.",
    source_pmid: "28507483",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28507483/",
  },

  // ─── Easy (Wave 3) ─────────────────────────────────────────────────
  {
    id: "e20", difficulty: "easy", category: "Physiology",
    question: "Wolff's law states that bone tissue:",
    options: [
      "Always decreases in density with exercise",
      "Adapts its structure to the mechanical loads it experiences",
      "Cannot remodel after age 25",
      "Is unaffected by mechanical stress",
    ],
    correct_answer: "Adapts its structure to the mechanical loads it experiences",
    explanation: "Wolff's law: bone adapts its architecture and density to the mechanical loading it routinely experiences, which is why resistance training increases bone mineral density.",
    source_pmid: "21062574",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/21062574/",
    question_fr: "La loi de Wolff énonce que l'os :",
    options_fr: [
      "Diminue toujours en densité avec l'exercice",
      "Adapte sa structure aux contraintes mécaniques qu'il subit",
      "Ne peut plus se remodeler après 25 ans",
      "N'est pas affecté par le stress mécanique",
    ],
    explanation_fr: "Loi de Wolff : l'os adapte son architecture et sa densité aux charges mécaniques qu'il subit régulièrement, raison pour laquelle la musculation augmente la densité minérale osseuse.",
  },
  {
    id: "e21", difficulty: "easy", category: "Physiology",
    question: "Davis's law applies to which tissue?",
    options: ["Bone", "Soft tissues (muscle, tendon, fascia)", "Cartilage only", "Blood vessels only"],
    correct_answer: "Soft tissues (muscle, tendon, fascia)",
    explanation: "Davis's law is the soft-tissue analogue of Wolff's law: connective tissues remodel along the lines of stress imposed on them.",
    source_pmid: "29541537",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29541537/",
    question_fr: "La loi de Davis s'applique à quel tissu ?",
    options_fr: ["L'os", "Les tissus mous (muscle, tendon, fascia)", "Le cartilage uniquement", "Les vaisseaux sanguins uniquement"],
    explanation_fr: "La loi de Davis est l'équivalent de la loi de Wolff pour les tissus mous : les tissus conjonctifs se remodèlent selon les lignes de contrainte imposées.",
  },
  {
    id: "e22", difficulty: "easy", category: "Nutrition",
    question: "Why are carbohydrates often consumed pre-workout for high-volume training?",
    options: [
      "They directly build muscle protein",
      "They top up muscle glycogen, the primary fuel for high-intensity work",
      "They lower body temperature",
      "They are required to activate mTOR",
    ],
    correct_answer: "They top up muscle glycogen, the primary fuel for high-intensity work",
    explanation: "Muscle glycogen is the dominant substrate during moderate-to-high intensity efforts; pre-workout carbs maintain glycogen and can sustain volume and power output.",
    source_pmid: "29315892",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29315892/",
    question_fr: "Pourquoi consommer des glucides avant un entraînement à fort volume ?",
    options_fr: [
      "Ils construisent directement la protéine musculaire",
      "Ils rechargent le glycogène musculaire, carburant principal des efforts intenses",
      "Ils abaissent la température corporelle",
      "Ils sont nécessaires pour activer mTOR",
    ],
    explanation_fr: "Le glycogène musculaire est le substrat dominant à intensité modérée à élevée ; les glucides pré-séance maintiennent le glycogène et soutiennent le volume et la puissance.",
  },
  {
    id: "e23", difficulty: "easy", category: "Nutrition",
    question: "What is the typical ergogenic dose of caffeine for performance?",
    options: ["0.1 mg/kg", "3–6 mg/kg taken ~60 min pre-exercise", "30 mg/kg", "Only effective above 1 g/day"],
    correct_answer: "3–6 mg/kg taken ~60 min pre-exercise",
    explanation: "ISSN position: 3–6 mg/kg of caffeine ~60 min before exercise reliably improves endurance, strength-endurance and time-trial performance.",
    source_pmid: "33388079",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33388079/",
    question_fr: "Quelle est la dose ergogénique typique de caféine pour la performance ?",
    options_fr: ["0,1 mg/kg", "3–6 mg/kg environ 60 min avant l'effort", "30 mg/kg", "Efficace seulement au-dessus de 1 g/jour"],
    explanation_fr: "Position de l'ISSN : 3–6 mg/kg de caféine ~60 min avant l'exercice améliorent l'endurance, l'endurance de force et la performance.",
  },
  {
    id: "e24", difficulty: "easy", category: "Biomechanics",
    question: "On a free-weight biceps curl, where is the resistance curve hardest?",
    options: [
      "At full extension (bottom)",
      "Around 90° of elbow flexion, where the moment arm of gravity is greatest",
      "At full flexion (top)",
      "It is uniform throughout the range",
    ],
    correct_answer: "Around 90° of elbow flexion, where the moment arm of gravity is greatest",
    explanation: "External torque equals load × horizontal distance from the joint. With a free weight, that distance is maximal near 90°, making the mid-range the hardest point.",
    source_pmid: "20847704",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/20847704/",
    question_fr: "Sur un curl biceps avec haltère, où la courbe de résistance est-elle la plus difficile ?",
    options_fr: [
      "À l'extension complète (bas)",
      "Vers 90° de flexion du coude, où le bras de levier de la gravité est maximal",
      "À la flexion complète (haut)",
      "Elle est uniforme sur toute l'amplitude",
    ],
    explanation_fr: "Le couple externe = charge × distance horizontale à l'articulation. Avec un poids libre, cette distance est maximale autour de 90°, rendant le mi-parcours le plus dur.",
  },
  {
    id: "e25", difficulty: "easy", category: "Biomechanics",
    question: "Why are machines often more stable than free weights for isolating a target muscle?",
    options: [
      "They reduce the need for stabilizer recruitment, allowing more focus on the prime mover",
      "They are heavier than free weights",
      "They prevent any muscle activation",
      "They eliminate the need for warming up",
    ],
    correct_answer: "They reduce the need for stabilizer recruitment, allowing more focus on the prime mover",
    explanation: "Guided paths reduce the balance/stabilization demand, so a larger fraction of the effort can be directed at the target muscle and the load can be pushed closer to failure safely.",
    source_pmid: "32826828",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/32826828/",
    question_fr: "Pourquoi les machines isolent-elles souvent mieux un muscle cible que les poids libres ?",
    options_fr: [
      "Elles réduisent le recrutement des stabilisateurs, concentrant l'effort sur le muscle agoniste",
      "Elles sont plus lourdes que les poids libres",
      "Elles empêchent toute activation musculaire",
      "Elles évitent l'échauffement",
    ],
    explanation_fr: "Le trajet guidé réduit la demande de stabilisation, donc une plus grande part de l'effort se concentre sur le muscle cible et la charge peut être poussée plus près de l'échec.",
  },
  {
    id: "e26", difficulty: "easy", category: "Physiology",
    question: "The nervous system controls force output primarily by:",
    options: [
      "Changing the size of muscle fibers in real time",
      "Recruiting more motor units and increasing their firing rate",
      "Releasing testosterone within milliseconds",
      "Reducing blood flow to the muscle",
    ],
    correct_answer: "Recruiting more motor units and increasing their firing rate",
    explanation: "Force is graded by recruiting additional motor units (per Henneman's size principle) and increasing their discharge rate (rate coding).",
    source_pmid: "23121352",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/23121352/",
    question_fr: "Le système nerveux module la force principalement en :",
    options_fr: [
      "Changeant la taille des fibres musculaires en temps réel",
      "Recrutant plus d'unités motrices et augmentant leur fréquence de décharge",
      "Libérant de la testostérone en quelques millisecondes",
      "Réduisant la circulation sanguine du muscle",
    ],
    explanation_fr: "La force est graduée par le recrutement d'unités motrices (principe de Henneman) et l'augmentation de leur fréquence de décharge (rate coding).",
  },
  {
    id: "e27", difficulty: "easy", category: "Hypertrophy",
    question: "Which factor is consistently rated as the most important driver of long-term hypertrophy?",
    options: [
      "Pump-style sets only",
      "Progressive overload with sufficient volume close to failure",
      "Static stretching",
      "Fasted training",
    ],
    correct_answer: "Progressive overload with sufficient volume close to failure",
    explanation: "Hypertrophy requires sustained mechanical tension; this is achieved with sufficient hard sets and progressive overload over time.",
    source_pmid: "20847704",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/20847704/",
    question_fr: "Quel facteur est systématiquement le plus important pour l'hypertrophie à long terme ?",
    options_fr: [
      "Uniquement les séries en pump",
      "Surcharge progressive avec un volume suffisant près de l'échec",
      "Les étirements statiques",
      "L'entraînement à jeun",
    ],
    explanation_fr: "L'hypertrophie nécessite une tension mécanique soutenue, obtenue via des séries dures suffisantes et une surcharge progressive dans le temps.",
  },
  {
    id: "e28", difficulty: "easy", category: "Physiology",
    question: "Bone benefits most from training that is:",
    options: [
      "Low-load and prolonged endurance only",
      "Dynamic, high-magnitude, and applied in varied directions",
      "Completely static and isometric",
      "Performed only in zero-gravity environments",
    ],
    correct_answer: "Dynamic, high-magnitude, and applied in varied directions",
    explanation: "Bone osteogenic response is greatest under high-magnitude, dynamic, multi-directional loads — exactly what heavy resistance training and impact work provide.",
    source_pmid: "16294132",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/16294132/",
    question_fr: "L'os tire le plus de bénéfices d'un entraînement :",
    options_fr: [
      "Uniquement d'endurance prolongée à faible charge",
      "Dynamique, de forte intensité, et multidirectionnel",
      "Totalement statique et isométrique",
      "Réalisé seulement en apesanteur",
    ],
    explanation_fr: "La réponse ostéogénique de l'os est maximale sous des charges dynamiques, élevées et multidirectionnelles — typique de la musculation lourde et des impacts.",
  },
  {
    id: "e29", difficulty: "easy", category: "Hypertrophy",
    question: "Which rep range is broadly effective for hypertrophy, when sets are taken close to failure?",
    options: ["1–3 reps only", "Roughly 5–30 reps", "100+ reps only", "Only isometrics"],
    correct_answer: "Roughly 5–30 reps",
    explanation: "Schoenfeld and others show similar hypertrophy across roughly 5–30 reps when sets are taken close to failure with adequate volume.",
    source_pmid: "28834797",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28834797/",
    question_fr: "Quelle gamme de répétitions est globalement efficace pour l'hypertrophie, en allant près de l'échec ?",
    options_fr: ["1–3 reps uniquement", "Environ 5–30 reps", "Plus de 100 reps uniquement", "Uniquement isométrique"],
    explanation_fr: "Schoenfeld et al. : l'hypertrophie est similaire entre ~5 et ~30 reps quand les séries sont menées près de l'échec avec un volume suffisant.",
  },

  // ─── Medium (Wave 3) ─────────────────────────────────────────────────
  {
    id: "m20", difficulty: "medium", category: "Biomechanics",
    question: "A cable curl with a pulley positioned low changes the resistance curve mainly by:",
    options: [
      "Eliminating any external torque on the elbow",
      "Keeping tension on the biceps even in the stretched, low position",
      "Doubling the load on the biceps brachii",
      "Removing the need for stabilizers",
    ],
    correct_answer: "Keeping tension on the biceps even in the stretched, low position",
    explanation: "Cable line of pull alters the angle of resistance: a low pulley keeps tension on the biceps in the lengthened position where free weights provide little.",
    source_pmid: "26817740",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26817740/",
    question_fr: "Un curl à la poulie basse modifie la courbe de résistance principalement en :",
    options_fr: [
      "Supprimant tout couple externe sur le coude",
      "Maintenant la tension sur le biceps même en position basse, étirée",
      "Doublant la charge sur le biceps brachial",
      "Supprimant le besoin de stabilisateurs",
    ],
    explanation_fr: "La ligne de traction du câble modifie l'angle de résistance : une poulie basse maintient la tension sur le biceps en position allongée, là où le poids libre en fournit peu.",
  },
  {
    id: "m21", difficulty: "medium", category: "Nutrition",
    question: "For a 90-min strength session, a useful pre-workout carbohydrate target is approximately:",
    options: [
      "0 g — fasted is always optimal",
      "Around 1 g/kg body mass 1–3 h before training",
      "10 g/kg in the 5 minutes before training",
      "Only fructose, in any amount",
    ],
    correct_answer: "Around 1 g/kg body mass 1–3 h before training",
    explanation: "ISSN guidance: ~1–4 g/kg carbohydrate 1–4 h pre-exercise tops up glycogen and supports performance in moderate-to-long sessions.",
    source_pmid: "28919842",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28919842/",
    question_fr: "Pour une séance de force de 90 min, une cible utile de glucides pré-séance est environ :",
    options_fr: [
      "0 g — le jeûne est toujours optimal",
      "Environ 1 g/kg de poids de corps, 1 à 3 h avant l'entraînement",
      "10 g/kg dans les 5 minutes précédant la séance",
      "Uniquement du fructose, en n'importe quelle quantité",
    ],
    explanation_fr: "Recommandation ISSN : ~1–4 g/kg de glucides 1–4 h avant l'effort rechargent le glycogène et soutiennent la performance en séance moyenne à longue.",
  },
  {
    id: "m22", difficulty: "medium", category: "Physiology",
    question: "Caffeine improves performance primarily by:",
    options: [
      "Increasing glycogen storage acutely",
      "Antagonizing adenosine receptors, reducing perceived effort and increasing CNS drive",
      "Acting as a direct anabolic hormone",
      "Lowering core temperature during exercise",
    ],
    correct_answer: "Antagonizing adenosine receptors, reducing perceived effort and increasing CNS drive",
    explanation: "Caffeine's primary mechanism is adenosine receptor antagonism in the CNS, reducing perceived effort and increasing voluntary activation.",
    source_pmid: "33388079",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33388079/",
    question_fr: "La caféine améliore la performance principalement en :",
    options_fr: [
      "Augmentant le stockage aigu du glycogène",
      "Antagonisant les récepteurs à l'adénosine, réduisant la perception de l'effort et augmentant la commande nerveuse",
      "Agissant comme une hormone anabolique directe",
      "Abaissant la température centrale pendant l'effort",
    ],
    explanation_fr: "Le mécanisme principal de la caféine est l'antagonisme des récepteurs à l'adénosine dans le SNC, réduisant la perception de l'effort et augmentant l'activation volontaire.",
  },
  {
    id: "m23", difficulty: "medium", category: "Physiology",
    question: "Which type of resistance training contributes most to bone density in adults?",
    options: [
      "Low-load circuits at low intensity",
      "Heavy progressive resistance training and impact loading",
      "Pure cardiovascular work",
      "Static stretching",
    ],
    correct_answer: "Heavy progressive resistance training and impact loading",
    explanation: "RCTs (e.g., LIFTMOR) show heavy resistance and impact training increase BMD at the spine and femoral neck in postmenopausal women.",
    source_pmid: "28991366",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28991366/",
    question_fr: "Quel type d'entraînement contribue le plus à la densité osseuse chez l'adulte ?",
    options_fr: [
      "Des circuits à faible charge et faible intensité",
      "La musculation lourde progressive et les impacts",
      "Le travail purement cardio",
      "Les étirements statiques",
    ],
    explanation_fr: "Des essais randomisés (ex. LIFTMOR) montrent que la musculation lourde et les impacts augmentent la DMO du rachis et du col fémoral chez la femme post-ménopausée.",
  },
  {
    id: "m24", difficulty: "medium", category: "Biomechanics",
    question: "Cam-based machines (e.g., Nautilus) attempt to:",
    options: [
      "Match the external resistance curve to the muscle's length-tension/strength curve",
      "Eliminate concentric work entirely",
      "Provide zero resistance at full contraction",
      "Replicate gravity's curve exactly",
    ],
    correct_answer: "Match the external resistance curve to the muscle's length-tension/strength curve",
    explanation: "Variable-resistance cams are engineered so the moment arm of the load varies through the ROM, more closely matching the muscle's intrinsic strength curve.",
    source_pmid: "10696129",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/10696129/",
    question_fr: "Les machines à came (ex. Nautilus) cherchent à :",
    options_fr: [
      "Adapter la courbe de résistance externe à la courbe longueur-tension du muscle",
      "Supprimer totalement le travail concentrique",
      "Donner une résistance nulle en contraction complète",
      "Reproduire exactement la courbe de la gravité",
    ],
    explanation_fr: "Les cames à résistance variable sont conçues pour que le bras de levier varie sur l'amplitude, suivant mieux la courbe de force intrinsèque du muscle.",
  },
  {
    id: "m25", difficulty: "medium", category: "Hypertrophy",
    question: "When picking exercises for maximum hypertrophy of a target muscle, the strongest criterion is:",
    options: [
      "Whichever feels least challenging",
      "Loading the muscle through a long range with high tension at long lengths",
      "Maximum instability so balance limits performance",
      "Always using the heaviest 1RM-style loads",
    ],
    correct_answer: "Loading the muscle through a long range with high tension at long lengths",
    explanation: "Recent evidence (e.g., Maeo et al., Pedrosa et al.) highlights stronger hypertrophy when a muscle is loaded through a long ROM, especially in the stretched position.",
    source_pmid: "36029271",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/36029271/",
    question_fr: "Pour choisir l'exercice optimal d'hypertrophie d'un muscle, le critère le plus solide est :",
    options_fr: [
      "Celui qui semble le moins exigeant",
      "Charger le muscle sur une grande amplitude avec une forte tension aux longueurs longues",
      "Un maximum d'instabilité pour que l'équilibre limite la performance",
      "Utiliser exclusivement des charges de type 1RM",
    ],
    explanation_fr: "Les données récentes (Maeo et al., Pedrosa et al.) montrent une hypertrophie supérieure quand le muscle est chargé sur une grande ROM, surtout en position allongée.",
  },
  {
    id: "m26", difficulty: "medium", category: "Physiology",
    question: "Compared to stable surface training, training on highly unstable surfaces tends to:",
    options: [
      "Increase prime-mover force output",
      "Reduce the force the prime movers can produce and limit hypertrophy stimulus",
      "Have no effect on motor unit firing",
      "Always be superior for hypertrophy",
    ],
    correct_answer: "Reduce the force the prime movers can produce and limit hypertrophy stimulus",
    explanation: "Unstable-surface resistance training reduces external force output and prime mover EMG, blunting the hypertrophy and strength stimulus compared to stable-surface lifts.",
    source_pmid: "20300013",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/20300013/",
    question_fr: "Comparé à une surface stable, s'entraîner sur surface très instable tend à :",
    options_fr: [
      "Augmenter la force produite par les muscles moteurs",
      "Réduire la force produite par les agonistes et limiter le stimulus d'hypertrophie",
      "N'avoir aucun effet sur la décharge des unités motrices",
      "Être toujours supérieur pour l'hypertrophie",
    ],
    explanation_fr: "L'entraînement sur surface instable réduit la force externe et l'EMG des agonistes, atténuant le stimulus de force et d'hypertrophie comparé à un appui stable.",
  },
  {
    id: "m27", difficulty: "medium", category: "Physiology",
    question: "Early strength gains in untrained lifters are dominated by:",
    options: [
      "Massive hypertrophy in the first 2 weeks",
      "Neural adaptations (recruitment, rate coding, coordination)",
      "Acute increases in bone density",
      "Changes in tendon collagen type",
    ],
    correct_answer: "Neural adaptations (recruitment, rate coding, coordination)",
    explanation: "Initial strength improvements are driven primarily by neural factors — improved recruitment, rate coding and inter-muscular coordination — before measurable hypertrophy.",
    source_pmid: "16410373",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/16410373/",
    question_fr: "Les premiers gains de force chez le débutant sont dominés par :",
    options_fr: [
      "Une hypertrophie massive dès les 2 premières semaines",
      "Des adaptations nerveuses (recrutement, rate coding, coordination)",
      "Une hausse aiguë de la densité osseuse",
      "Des changements de type de collagène tendineux",
    ],
    explanation_fr: "Les premiers gains de force viennent surtout d'adaptations nerveuses — meilleur recrutement, rate coding et coordination — avant toute hypertrophie mesurable.",
  },
  {
    id: "m28", difficulty: "medium", category: "Nutrition",
    question: "If you train fasted in the morning, a practical pre-workout option to preserve performance is:",
    options: [
      "A small dose of fast-acting carbs and ~20–40 g protein/EAAs",
      "Pure water and skip nutrition",
      "A high-fat meal 5 minutes before lifting",
      "1 g of pure fructose only",
    ],
    correct_answer: "A small dose of fast-acting carbs and ~20–40 g protein/EAAs",
    explanation: "If fully fasted training hurts performance, a small carb + protein/EAA dose preserves volume and provides leucine without significant GI disturbance.",
    source_pmid: "28852372",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28852372/",
    question_fr: "Si vous vous entraînez à jeun le matin, une option pratique pour préserver la performance est :",
    options_fr: [
      "Une petite dose de glucides rapides et ~20–40 g de protéines/EAA",
      "De l'eau pure et aucune nutrition",
      "Un repas riche en lipides 5 min avant la séance",
      "1 g de fructose pur uniquement",
    ],
    explanation_fr: "Si le jeûne nuit à la performance, une petite dose de glucides + protéines/EAA préserve le volume et apporte de la leucine sans trouble digestif majeur.",
  },
  {
    id: "m29", difficulty: "medium", category: "Hypertrophy",
    question: "When two exercises target the same muscle equally well, the better hypertrophy pick is often the one that:",
    options: [
      "Is most painful at the joints",
      "Allows you to apply more progressive overload with high technical reliability",
      "Has the longest setup time",
      "Uses the cheapest equipment",
    ],
    correct_answer: "Allows you to apply more progressive overload with high technical reliability",
    explanation: "Practically, the exercise on which you can reliably progress loads/reps with good technique over weeks tends to drive more total hypertrophy.",
    source_pmid: "27433992",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
    question_fr: "Entre deux exercices ciblant aussi bien le même muscle, le meilleur choix d'hypertrophie est souvent celui qui :",
    options_fr: [
      "Provoque le plus de douleur articulaire",
      "Permet d'appliquer plus de surcharge progressive avec une technique fiable",
      "A le temps de mise en place le plus long",
      "Utilise le matériel le moins cher",
    ],
    explanation_fr: "En pratique, l'exercice sur lequel on peut progresser durablement en charge/répétitions avec une bonne technique génère le plus d'hypertrophie totale.",
  },

  // ─── Hardcore (Wave 3) ─────────────────────────────────────────────────
  {
    id: "h20", difficulty: "hardcore", category: "Physiology",
    question: "Mechanotransduction in bone is best explained by which cell type acting as the primary mechanosensor?",
    options: ["Osteoclasts", "Osteocytes embedded in the lacuno-canalicular network", "Chondrocytes", "Macrophages"],
    correct_answer: "Osteocytes embedded in the lacuno-canalicular network",
    explanation: "Osteocytes sense fluid shear stress through their canaliculi and orchestrate osteoblast/osteoclast activity, translating mechanical load into bone remodeling.",
    source_pmid: "23877011",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/23877011/",
    question_fr: "La mécanotransduction osseuse est principalement assurée par :",
    options_fr: ["Les ostéoclastes", "Les ostéocytes du réseau lacuno-canaliculaire", "Les chondrocytes", "Les macrophages"],
    explanation_fr: "Les ostéocytes détectent le cisaillement fluidique via leurs canalicules et orchestrent l'activité ostéoblastique/ostéoclastique, traduisant la charge en remodelage osseux.",
  },
  {
    id: "h21", difficulty: "hardcore", category: "Biomechanics",
    question: "Accommodating-resistance methods (bands/chains) primarily modify which feature of the lift?",
    options: [
      "Eccentric tempo",
      "The external resistance profile, increasing load where leverage is best",
      "Total bar mass at the bottom",
      "Muscle fiber-type recruitment order",
    ],
    correct_answer: "The external resistance profile, increasing load where leverage is best",
    explanation: "Bands and chains add resistance as the lifter ascends, smoothing the strength curve and overloading the top range where mechanical advantage is greatest.",
    source_pmid: "27669192",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27669192/",
    question_fr: "Les méthodes à résistance accommodante (bandes/chaînes) modifient surtout :",
    options_fr: [
      "Le tempo excentrique",
      "Le profil de résistance externe, augmentant la charge où le levier est meilleur",
      "La masse totale de la barre en bas",
      "L'ordre de recrutement des fibres",
    ],
    explanation_fr: "Bandes et chaînes ajoutent de la résistance en remontant, lissant la courbe de force et surchargeant le haut de l'amplitude où l'avantage mécanique est maximal.",
  },
  {
    id: "h22", difficulty: "hardcore", category: "Hypertrophy",
    question: "Recent evidence on partial-range training at long muscle lengths suggests:",
    options: [
      "Long-length partials can match or exceed full-ROM hypertrophy in several muscles",
      "Long-length partials produce no hypertrophy",
      "Only full ROM at any length produces hypertrophy",
      "Long-length partials are exclusively for tendon adaptation",
    ],
    correct_answer: "Long-length partials can match or exceed full-ROM hypertrophy in several muscles",
    explanation: "Maeo, Pedrosa and others report long-length partial reps producing hypertrophy at least equal to full ROM in several muscle groups, supporting tension-at-long-length as a key stimulus.",
    source_pmid: "36029271",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/36029271/",
    question_fr: "Les données récentes sur les partielles en position allongée suggèrent :",
    options_fr: [
      "Les partielles en position allongée peuvent égaler ou dépasser l'hypertrophie en ROM complète",
      "Les partielles en position allongée ne produisent aucune hypertrophie",
      "Seule la ROM complète à n'importe quelle longueur produit de l'hypertrophie",
      "Les partielles en position allongée ne servent qu'au tendon",
    ],
    explanation_fr: "Maeo, Pedrosa et al. rapportent une hypertrophie au moins équivalente à la ROM complète avec des partielles en position allongée, confortant l'idée de la tension en position longue comme stimulus clé.",
  },
  {
    id: "h23", difficulty: "hardcore", category: "Physiology",
    question: "High doses of pre-exercise caffeine (>9 mg/kg) generally:",
    options: [
      "Are linearly more effective than 3–6 mg/kg",
      "Provide little extra ergogenic effect while increasing side effects",
      "Are required for endurance benefits",
      "Eliminate adenosine entirely",
    ],
    correct_answer: "Provide little extra ergogenic effect while increasing side effects",
    explanation: "Above ~6 mg/kg, performance gains plateau while side effects (anxiety, GI distress, sleep disturbance) increase, so 3–6 mg/kg remains the practical sweet spot.",
    source_pmid: "33388079",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33388079/",
    question_fr: "Les fortes doses de caféine pré-exercice (>9 mg/kg) :",
    options_fr: [
      "Sont linéairement plus efficaces que 3–6 mg/kg",
      "Apportent peu d'effet supplémentaire mais davantage d'effets secondaires",
      "Sont nécessaires aux bénéfices en endurance",
      "Éliminent totalement l'adénosine",
    ],
    explanation_fr: "Au-delà d'environ 6 mg/kg, les gains de performance plafonnent tandis que les effets secondaires (anxiété, troubles digestifs, sommeil) augmentent. 3–6 mg/kg reste l'optimum pratique.",
  },
  {
    id: "h24", difficulty: "hardcore", category: "Hypertrophy",
    question: "Which factor most strongly predicts a single exercise's hypertrophy stimulus for a target muscle?",
    options: [
      "Subjective pump alone",
      "Mechanical tension on the target fibers across an effective ROM, sustained close to failure",
      "Total bar mass regardless of leverage",
      "Brand of equipment used",
    ],
    correct_answer: "Mechanical tension on the target fibers across an effective ROM, sustained close to failure",
    explanation: "Mechanical tension on the target muscle's contractile machinery, applied over an effective ROM and proximal to failure, is the proximate driver of hypertrophy.",
    source_pmid: "30580468",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30580468/",
    question_fr: "Quel facteur prédit le mieux le stimulus d'hypertrophie d'un exercice sur un muscle cible ?",
    options_fr: [
      "Le pump subjectif seul",
      "La tension mécanique sur les fibres cibles sur une ROM efficace, près de l'échec",
      "La masse totale de la barre quelle que soit la levier",
      "La marque du matériel utilisé",
    ],
    explanation_fr: "La tension mécanique sur l'appareil contractile du muscle cible, appliquée sur une ROM efficace et près de l'échec, est le moteur proximal de l'hypertrophie.",
  },
  {
    id: "h25", difficulty: "hardcore", category: "Physiology",
    question: "The central nervous system's contribution to maximal voluntary force is best probed with:",
    options: [
      "Skinfold calipers",
      "Interpolated twitch / voluntary activation technique",
      "DEXA scan",
      "Resting heart rate",
    ],
    correct_answer: "Interpolated twitch / voluntary activation technique",
    explanation: "The interpolated twitch technique superimposes an electrical stimulus during MVC to quantify the level of voluntary muscle activation by the CNS.",
    source_pmid: "8847234",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/8847234/",
    question_fr: "La contribution du SNC à la force maximale volontaire se mesure le mieux avec :",
    options_fr: [
      "Une pince à plis cutanés",
      "La technique du twitch interpolé / activation volontaire",
      "Un DEXA",
      "La fréquence cardiaque de repos",
    ],
    explanation_fr: "Le twitch interpolé superpose une stimulation électrique pendant une MVC pour quantifier le niveau d'activation volontaire du muscle par le SNC.",
  },
  {
    id: "h26", difficulty: "hardcore", category: "Biomechanics",
    question: "Why is the bottom of a barbell back squat often a strength 'sticking region'?",
    options: [
      "The hip and knee extensors operate at unfavorable lengths/leverages simultaneously",
      "The bar is in zero gravity",
      "Type I fibers shut off temporarily",
      "Tendons store no elastic energy at all",
    ],
    correct_answer: "The hip and knee extensors operate at unfavorable lengths/leverages simultaneously",
    explanation: "Near the bottom of the squat, hip and knee extensor moment arms and length-tension relationships are simultaneously unfavorable, creating a sticking region.",
    source_pmid: "20543740",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/20543740/",
    question_fr: "Pourquoi le bas du back squat est souvent une zone de blocage ?",
    options_fr: [
      "Les extenseurs de hanche et de genou sont simultanément en mauvaise longueur/levier",
      "La barre est en apesanteur",
      "Les fibres de type I s'éteignent temporairement",
      "Les tendons ne stockent aucune énergie élastique",
    ],
    explanation_fr: "Près du bas du squat, les bras de levier et les relations longueur-tension des extenseurs de hanche et de genou sont simultanément défavorables, créant une zone de blocage.",
  },
  {
    id: "h27", difficulty: "hardcore", category: "Physiology",
    question: "Co-ingesting carbohydrate with protein post-exercise primarily:",
    options: [
      "Massively increases muscle protein synthesis beyond protein alone",
      "Restores glycogen faster without meaningfully boosting MPS when protein is already sufficient",
      "Prevents any glycogen resynthesis",
      "Replaces the need for protein entirely",
    ],
    correct_answer: "Restores glycogen faster without meaningfully boosting MPS when protein is already sufficient",
    explanation: "When protein/leucine is sufficient, adding carbohydrate post-exercise speeds glycogen resynthesis but adds little to MPS; carbs matter more for sessions when glycogen is depleted.",
    source_pmid: "17609255",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/17609255/",
    question_fr: "Co-ingérer des glucides avec des protéines après l'effort :",
    options_fr: [
      "Augmente massivement la synthèse protéique par rapport à la protéine seule",
      "Restaure le glycogène plus vite sans réel gain de MPS si la protéine est déjà suffisante",
      "Empêche toute resynthèse du glycogène",
      "Remplace totalement le besoin en protéines",
    ],
    explanation_fr: "Quand la protéine/leucine est suffisante, ajouter des glucides post-exercice accélère le glycogène mais améliore peu la MPS ; les glucides comptent surtout quand le glycogène est très entamé.",
  },
  {
    id: "h28", difficulty: "hardcore", category: "Biomechanics",
    question: "Patellofemoral joint reaction force in the squat is highest:",
    options: [
      "In the standing lock-out",
      "Near deep knee flexion, especially at submaximal depths around 90–110°",
      "Only during the eccentric of a leg curl",
      "Never during squats",
    ],
    correct_answer: "Near deep knee flexion, especially at submaximal depths around 90–110°",
    explanation: "Patellofemoral compressive force scales with knee flexion angle and load, peaking around deep flexion — a key consideration for symptomatic individuals.",
    source_pmid: "11710657",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/11710657/",
    question_fr: "La force de réaction fémoro-patellaire au squat est maximale :",
    options_fr: [
      "Au verrouillage debout",
      "Près d'une flexion profonde du genou, typiquement autour de 90–110°",
      "Uniquement lors de l'excentrique d'un leg curl",
      "Jamais pendant un squat",
    ],
    explanation_fr: "La compression fémoro-patellaire augmente avec l'angle de flexion et la charge, atteignant son pic en flexion profonde — point clé chez les sujets symptomatiques.",
  },
  {
    id: "h29", difficulty: "hardcore", category: "Hypertrophy",
    question: "When choosing the single best hypertrophy exercise for a target muscle, the strongest combined criterion is:",
    options: [
      "Maximum joint pain",
      "Long ROM with high tension at long lengths, stable enough to push close to failure, and reliable progressive overload",
      "The newest exercise trending online",
      "Whichever uses the least equipment",
    ],
    correct_answer: "Long ROM with high tension at long lengths, stable enough to push close to failure, and reliable progressive overload",
    explanation: "Best hypertrophy picks combine tension at long muscle lengths, sufficient stability to train near failure safely, and the ability to progressively overload over time.",
    source_pmid: "31034661",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31034661/",
    question_fr: "Pour choisir le meilleur exercice d'hypertrophie d'un muscle cible, le critère combiné le plus solide est :",
    options_fr: [
      "Une douleur articulaire maximale",
      "Grande ROM, tension élevée en position allongée, assez stable pour aller près de l'échec et progresser dans le temps",
      "L'exercice le plus à la mode en ligne",
      "Celui qui demande le moins de matériel",
    ],
    explanation_fr: "Les meilleurs choix combinent tension en position longue, stabilité suffisante pour aller près de l'échec en sécurité, et la possibilité de surcharger progressivement dans la durée.",
  },
];



// ──────────────────────────────────────────────────────────────────────────────
// Bots
// ──────────────────────────────────────────────────────────────────────────────

type BotId = "novice" | "researcher" | "hypertrophy";
type Bot = {
  id: BotId;
  name: string;
  tag: string;
  accuracy: number;
  minDelay: number; // ms
  maxDelay: number;
  blurb: string;
};

const BOTS: Bot[] = [
  { id: "novice", name: "Novice Bot", tag: "Easy", accuracy: 0.5, minDelay: 5000, maxDelay: 8000, blurb: "Just discovered the gym. Slow and unsure." },
  { id: "researcher", name: "Researcher Bot", tag: "Medium", accuracy: 0.75, minDelay: 3000, maxDelay: 5000, blurb: "Reads abstracts on weekends. Solid opponent." },
  { id: "hypertrophy", name: "Dr. Hypertrophy", tag: "Hardcore", accuracy: 0.95, minDelay: 1000, maxDelay: 3000, blurb: "PhD in muscle science. Brutal accuracy." },
];

// ──────────────────────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────────────────────

type Mode = "solo" | "bot";
type Screen = "dashboard" | "username" | "botSelect" | "categorySelect" | "arena" | "results";

type RoundResult = {
  question: Question;
  selectedIndex: number | null;
  correct: boolean;
  opponentCorrect: boolean;
};

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60] as const;
const DEFAULT_DURATION = 15;

// ──────────────────────────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mode, setMode] = useState<Mode>("solo");
  const [username, setUsername] = useState("");
  const [bot, setBot] = useState<Bot>(BOTS[1]);
  const [category, setCategory] = useState<Category>("All");
  const [quizLength, setQuizLength] = useState<number>(10);
  const [questionDuration, setQuestionDuration] = useState<number>(DEFAULT_DURATION);
  const [results, setResults] = useState<RoundResult[]>([]);

  const startSolo = () => {
    setMode("solo");
    setScreen("username");
  };

  const startBot = () => {
    setMode("bot");
    setScreen("botSelect");
  };

  const finishGame = (finalResults: RoundResult[]) => {
    setResults(finalResults);
    setScreen("results");
  };

  return (
    <LangProvider>
      <div className="min-h-screen text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
          <TopBar />

          {screen === "dashboard" && (
            <Dashboard onSolo={startSolo} onBot={startBot} />
          )}

          {screen === "username" && (
            <UsernameScreen
              username={username}
              setUsername={setUsername}
              onBack={() => setScreen("dashboard")}
              onContinue={() => setScreen("categorySelect")}
            />
          )}

          {screen === "botSelect" && (
            <BotSelect
              selected={bot}
              setBot={setBot}
              onBack={() => setScreen("dashboard")}
              onContinue={() => setScreen("categorySelect")}
            />
          )}

          {screen === "categorySelect" && (
            <CategorySelect
              mode={mode}
              bot={bot}
              category={category}
              setCategory={setCategory}
              quizLength={quizLength}
              setQuizLength={setQuizLength}
              questionDuration={questionDuration}
              setQuestionDuration={setQuestionDuration}
              onBack={() => setScreen(mode === "solo" ? "username" : "botSelect")}
              onStart={() => {
                setResults([]);
                setScreen("arena");
              }}
            />
          )}

          {screen === "arena" && (
            <Arena
              mode={mode}
              bot={bot}
              category={category}
              quizLength={quizLength}
              questionDuration={questionDuration}
              onFinish={finishGame}
              onQuit={() => setScreen("dashboard")}
            />
          )}

          {screen === "results" && (
            <Results
              results={results}
              mode={mode}
              username={username || "You"}
              bot={bot}
              onHome={() => setScreen("dashboard")}
              onAgain={() => setScreen("categorySelect")}
            />
          )}

          <Footer />
        </div>
      </div>
    </LangProvider>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
// TopBar
// ──────────────────────────────────────────────────────────────────────────────

function TopBar() {
  const [isDark, setIsDark] = useState(true);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("hypersci-theme") : null;
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { window.localStorage.setItem("hypersci-theme", next ? "dark" : "light"); } catch {}
  };

  const toggleLang = () => setLang(lang === "en" ? "fr" : "en");

  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground neon-glow">
          <BoltIcon />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight">Science Based</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">QUIZ</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/about"
          className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary/60 hover:text-neon"
        >
          {t("why_platform")}
        </Link>
        <button
          onClick={toggleTheme}
          aria-label={t("toggle_theme")}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-secondary/60 text-foreground transition-colors hover:border-primary/60 hover:text-neon"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          onClick={toggleLang}
          aria-label={t("toggle_lang")}
          title={t("toggle_lang")}
          className="grid h-8 min-w-[2.5rem] place-items-center rounded-full border border-border bg-secondary/60 px-2 font-display text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary/60 hover:text-neon"
        >
          {lang === "en" ? "FR" : "EN"}
        </button>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Footer with static page links
// ──────────────────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/legal" className="hover:text-foreground transition-colors">{t("legal")}</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">{t("privacy")}</Link>
      </nav>
      <div className="mt-6 text-center text-[10px] uppercase tracking-widest opacity-60">
        {t("copyright")}
      </div>
    </footer>


  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────────────────────

function Dashboard({ onSolo, onBot }: { onSolo: () => void; onBot: () => void }) {
  const { t } = useLang();
  return (
    <div className="space-y-6 fade-in-up">
      <section>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-neon">Science</span> Based Quiz
        </h1>
      </section>


      <section className="glass rounded-2xl p-5 my-8">
        <div className="text-[10px] uppercase tracking-widest text-cyan-glow font-bold">{t("mission")}</div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t("mission_body")}
        </p>
      </section>

      <section className="grid gap-3">
        <CTAButton
          variant="primary"
          onClick={onBot}
          title={t("bot_arena")}
          subtitle={t("bot_arena_sub")}
          icon={<SwordsIcon />}
        />
        <CTAButton
          variant="ghost"
          onClick={onSolo}
          title={t("solo_mode")}
          subtitle={t("solo_mode_sub")}
          icon={<UserIcon />}
        />
      </section>
    </div>
  );
}


function CTAButton({
  title,
  subtitle,
  icon,
  variant,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "primary" | "ghost";
  onClick: () => void;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={
        "group relative flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 " +
        (isPrimary
          ? "bg-primary text-primary-foreground neon-glow hover:scale-[1.02]"
          : "glass hover:border-primary/60 hover:scale-[1.01]")
      }
    >
      <div className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl " + (isPrimary ? "bg-black/15" : "bg-primary/15 text-primary")}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-bold">{title}</div>
        <div className={"text-xs " + (isPrimary ? "opacity-80" : "text-muted-foreground")}>{subtitle}</div>
      </div>
      <ArrowIcon />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Username screen (Solo flow)
// ──────────────────────────────────────────────────────────────────────────────

function UsernameScreen({
  username,
  setUsername,
  onBack,
  onContinue,
}: {
  username: string;
  setUsername: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useLang();
  const valid = username.trim().length >= 2;
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("solo_label")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("enter_username")}</h2>
      </div>

      <div className="glass rounded-2xl p-5">
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) onContinue(); }}
          placeholder={t("username_placeholder")}
          className="mt-2 w-full rounded-xl border border-border bg-secondary/60 px-4 py-3 text-base font-medium outline-none focus:border-primary"
          maxLength={24}
        />
      </div>

      <button
        onClick={onContinue}
        disabled={!valid}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
      >
        {t("continue")}
      </button>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
// Bot selection
// ──────────────────────────────────────────────────────────────────────────────

function BotSelect({
  selected,
  setBot,
  onBack,
  onContinue,
}: {
  selected: Bot;
  setBot: (b: Bot) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">{t("bot_arena")}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("choose_opponent")}</h2>
      </div>

      <div className="grid gap-3">
        {BOTS.map((b) => {
          const active = selected.id === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setBot(b)}
              className={
                "rounded-2xl p-5 text-left transition-all " +
                (active
                  ? "bg-primary/15 border-2 border-primary neon-glow"
                  : "glass hover:border-primary/60")
              }
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-bold">{b.name}</div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-glow">
                  {b.tag}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{b.blurb}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-secondary/60 p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</div>
                  <div className="font-display font-bold text-neon">{Math.round(b.accuracy * 100)}%</div>
                </div>
                <div className="rounded-lg bg-secondary/60 p-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Response</div>
                  <div className="font-display font-bold text-cyan-glow">{b.minDelay / 1000}-{b.maxDelay / 1000}s</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
      >
        {t("continue")}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Category select
// ──────────────────────────────────────────────────────────────────────────────

function CategorySelect({
  mode,
  bot,
  category,
  setCategory,
  quizLength,
  setQuizLength,
  questionDuration,
  setQuestionDuration,
  onBack,
  onStart,
}: {
  mode: Mode;
  bot: Bot;
  category: Category;
  setCategory: (c: Category) => void;
  quizLength: number;
  setQuizLength: (n: number) => void;
  questionDuration: number;
  setQuestionDuration: (n: number) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const { t } = useLang();
  const cats: Category[] = ["All", "Nutrition", "Biomechanics", "Hypertrophy", "Physiology"];
  const lengths = [5, 10, 15, 20, 25, 30, 40, 50];
  const available = useMemo(
    () => (category === "All" ? QUESTIONS.length : QUESTIONS.filter((q) => q.category === category).length),
    [category],
  );
  const effectiveLength = Math.min(quizLength, available);
  return (
    <div className="space-y-6 fade-in-up">
      <button onClick={onBack} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">{t("back")}</button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-cyan-glow">
          {mode === "bot" ? `${t("vs_label")} ${bot.name}` : t("solo_label")}
        </div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{t("choose_category")}</h2>
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                "rounded-full px-4 py-2 text-xs font-semibold transition-all " +
                (category === c
                  ? "border border-accent bg-accent/15 text-cyan-glow"
                  : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{t("quiz_length")}</h3>
          <span className="text-[11px] text-muted-foreground">{available} {t("available")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {lengths.map((n) => {
            const disabled = n > available;
            const active = quizLength === n;
            return (
              <button
                key={n}
                disabled={disabled}
                onClick={() => setQuizLength(n)}
                className={
                  "rounded-full px-4 py-2 text-xs font-semibold transition-all " +
                  (disabled
                    ? "border border-border/40 bg-secondary/30 text-muted-foreground/40 cursor-not-allowed"
                    : active
                    ? "border border-accent bg-accent/15 text-cyan-glow"
                    : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")
                }
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{t("question_time")}</h3>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((n) => {
            const active = questionDuration === n;
            return (
              <button
                key={n}
                onClick={() => setQuestionDuration(n)}
                className={
                  "rounded-full px-4 py-2 text-xs font-semibold transition-all " +
                  (active
                    ? "border border-accent bg-accent/15 text-cyan-glow"
                    : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")
                }
              >
                {n}{t("seconds_short")}
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={onStart}
        className="w-full rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
      >
        {(mode === "bot" ? t("start_match") : t("start_quiz"))} ({effectiveLength} Q · {questionDuration}{t("seconds_short")})
      </button>
    </div>
  );
}



// ──────────────────────────────────────────────────────────────────────────────
// Arena
// ──────────────────────────────────────────────────────────────────────────────

function Arena({
  mode,
  bot,
  category,
  quizLength,
  questionDuration,
  onFinish,
  onQuit,
}: {
  mode: Mode;
  bot: Bot;
  category: Category;
  quizLength: number;
  questionDuration: number;
  onFinish: (r: RoundResult[]) => void;
  onQuit: () => void;
}) {

  const questions = useMemo(() => {
    const pool = category === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.category === category);
    const source = pool.length > 0 ? pool : QUESTIONS;

    // Fisher–Yates shuffle
    const shuffled = [...source];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Category interleave: avoid two consecutive questions from the same category when possible
    const buckets = new Map<string, typeof shuffled>();
    for (const q of shuffled) {
      const k = q.category;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(q);
    }
    const ordered: typeof shuffled = [];
    let lastCat = "";
    while (ordered.length < shuffled.length) {
      // pick the largest bucket whose category differs from lastCat
      const candidates = [...buckets.entries()].filter(([c, arr]) => arr.length > 0 && c !== lastCat);
      const pickFrom = candidates.length > 0 ? candidates : [...buckets.entries()].filter(([, arr]) => arr.length > 0);
      pickFrom.sort((a, b) => b[1].length - a[1].length);
      const [cat, arr] = pickFrom[0];
      ordered.push(arr.shift()!);
      lastCat = cat;
    }
    return ordered.slice(0, Math.min(quizLength, ordered.length));
  }, [category, quizLength]);


  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentCorrect, setOpponentCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questionDuration);
  const [showSource, setShowSource] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const q = questions[idx];
  const correctIndex = q.options.indexOf(q.correct_answer);
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer
  useEffect(() => {
    if (selected !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s: number) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selected]);

  // Bot answer simulation
  useEffect(() => {
    if (mode !== "bot") return;
    const delay = bot.minDelay + Math.random() * (bot.maxDelay - bot.minDelay);
    opponentTimerRef.current = setTimeout(() => {
      const correct = Math.random() < bot.accuracy;
      setOpponentAnswered(true);
      setOpponentCorrect(correct);
      if (correct) setOppScore((s) => s + 1);
    }, delay);
    return () => {
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode]);

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === correctIndex;
    if (correct) setMyScore((s) => s + 1);

    let finalOppCorrect = opponentCorrect;
    if (mode === "bot" && !opponentAnswered) {
      // Lock the bot in immediately based on its accuracy
      const oc = Math.random() < bot.accuracy;
      finalOppCorrect = oc;
      setOpponentAnswered(true);
      setOpponentCorrect(oc);
      if (oc) setOppScore((s) => s + 1);
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    }

    const result: RoundResult = {
      question: q,
      selectedIndex: i === -1 ? null : i,
      correct,
      opponentCorrect: mode === "bot" ? finalOppCorrect : false,
    };
    setResults((prev) => [...prev, result]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      onFinish(results);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setOpponentAnswered(false);
    setOpponentCorrect(false);
    setTimeLeft(questionDuration);
    setShowSource(false);
  };

  const total = questions.length;
  const myPct = (myScore / total) * 100;
  const oppPct = (oppScore / total) * 100;
  const timerCritical = timeLeft <= 5;

  return (
    <div className="space-y-5 no-select fade-in-up">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button onClick={onQuit} className="uppercase tracking-widest hover:text-foreground">← Quit</button>
        <div className="uppercase tracking-widest">
          Question <span className="text-foreground">{idx + 1}</span>/{total}
        </div>
      </div>

      <section className="glass rounded-2xl p-4">
        <ScoreBar label="You" score={myScore} pct={myPct} accent="primary" />
        {mode === "bot" && (
          <div className="mt-3">
            <ScoreBar
              label={bot.name}
              score={oppScore}
              pct={oppPct}
              accent="cyan"
              indicator={opponentAnswered ? "answered" : "thinking"}
            />
          </div>
        )}
      </section>

      <div className="flex justify-center">
        <CountdownRing seconds={timeLeft} total={questionDuration} critical={timerCritical} />
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{q.difficulty}</Badge>
          <Badge variant="cyan">{q.category}</Badge>
        </div>
        <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{q.question}</h3>
      </section>

      <section className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;
          const revealed = selected !== null;
          let cls = "glass hover:border-primary/60";
          if (revealed && isCorrect) cls = "border-2 border-primary bg-primary/15 text-foreground neon-glow";
          else if (revealed && isSelected && !isCorrect) cls = "border-2 border-destructive bg-destructive/15 text-foreground";
          else if (revealed) cls = "glass opacity-50";
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => handleAnswer(i)}
              className={
                "flex items-center gap-3 rounded-xl p-4 text-left transition-all duration-200 " +
                cls +
                (selected === null ? " hover:scale-[1.01]" : "")
              }
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary font-display text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium sm:text-base">{opt}</span>
              {revealed && isCorrect && <CheckIcon />}
              {revealed && isSelected && !isCorrect && <CrossIcon />}
            </button>
          );
        })}
      </section>

      {selected !== null && (
        <div className="flex flex-col gap-2.5 fade-in-up sm:flex-row">
          <button
            onClick={() => setShowSource(true)}
            className="flex-1 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold text-cyan-glow transition-colors hover:bg-accent/20"
          >
            📚 View scientific source (PMID)
          </button>
          <button
            onClick={next}
            className="flex-1 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow transition-transform hover:scale-[1.02]"
          >
            {idx + 1 >= total ? "See results →" : "Next question →"}
          </button>
        </div>
      )}

      {showSource && <SourceModal q={q} onClose={() => setShowSource(false)} />}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  pct,
  accent,
  indicator,
}: {
  label: string;
  score: number;
  pct: number;
  accent: "primary" | "cyan";
  indicator?: "thinking" | "answered";
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{label}</span>
          {indicator === "thinking" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> thinking…
            </span>
          )}
          {indicator === "answered" && (
            <span className="text-[10px] uppercase tracking-wider text-cyan-glow">answered</span>
          )}
        </div>
        <span className="font-display font-bold">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={
            "h-full rounded-full transition-all duration-500 " +
            (accent === "primary"
              ? "bg-gradient-to-r from-primary to-primary/70"
              : "bg-gradient-to-r from-accent to-accent/70")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CountdownRing({ seconds, total, critical }: { seconds: number; total: number; critical: boolean }) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const pct = seconds / total;
  const dash = circ * pct;
  const color = critical ? "var(--danger)" : "var(--neon)";
  return (
    <div className={"relative grid h-24 w-24 place-items-center " + (critical ? "pulse-ring rounded-full" : "")}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold" style={{ color: critical ? "var(--danger)" : "var(--neon)" }}>
          {seconds}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">sec</div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "cyan" }) {
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest " +
        (variant === "primary" ? "bg-primary/15 text-neon" : "bg-accent/15 text-cyan-glow")
      }
    >
      {children}
    </span>
  );
}

function SourceModal({ q, onClose }: { q: Question; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="slide-up w-full max-w-lg rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border sm:hidden" />
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-cyan-glow">Scientific source</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <h4 className="font-display text-lg font-bold">PMID: {q.source_pmid}</h4>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        <div className="mt-5 rounded-xl bg-secondary p-3 text-xs">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Correct answer</div>
          <div className="mt-1 font-semibold text-primary">{q.correct_answer}</div>
        </div>
        <a
          href={q.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-xl bg-primary px-4 py-3 text-center font-display text-sm font-bold text-primary-foreground neon-glow"
        >
          Open on PubMed ↗
        </a>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Results
// ──────────────────────────────────────────────────────────────────────────────

function Results({
  results,
  mode,
  username,
  bot,
  onHome,
  onAgain,
}: {
  results: RoundResult[];
  mode: Mode;
  username: string;
  bot: Bot;
  onHome: () => void;
  onAgain: () => void;
}) {
  const myScore = results.filter((r) => r.correct).length;
  const oppScore = results.filter((r) => r.opponentCorrect).length;
  const total = results.length;
  const won = mode === "bot" ? myScore > oppScore : myScore >= Math.ceil(total / 2);
  const [reviewing, setReviewing] = useState(false);
  const mistakes = results.filter((r) => !r.correct);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {mode === "bot" ? "Match result" : "Quiz complete"}
        </div>
        <h2
          className={"mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl count-pop " + (won ? "text-neon" : "text-danger")}
          style={!won ? { color: "var(--danger)", textShadow: "0 0 18px color-mix(in oklab, var(--danger) 60%, transparent)" } : {}}
        >
          {mode === "bot" ? (won ? "VICTORY" : "DEFEAT") : "DONE"}
        </h2>
      </div>

      <section className="glass rounded-2xl p-6">
        {mode === "bot" ? (
          <div className="grid grid-cols-3 items-center gap-3">
            <ScoreColumn label={username} value={myScore} accent="primary" />
            <div className="text-center font-display text-xl text-muted-foreground">VS</div>
            <ScoreColumn label={bot.name} value={oppScore} accent="cyan" />
          </div>
        ) : (
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{username}</div>
            <div className="mt-1 font-display text-6xl font-bold text-neon">{myScore}<span className="text-muted-foreground text-3xl">/{total}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">Correct answers</div>
          </div>
        )}
      </section>

      {!reviewing ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {mistakes.length > 0 && (
            <button
              onClick={() => setReviewing(true)}
              className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold text-cyan-glow"
            >
              🔬 Review my {mistakes.length} mistake{mistakes.length > 1 ? "s" : ""}
            </button>
          )}
          <button onClick={onAgain} className="rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground neon-glow">
            Play again
          </button>
          <button onClick={onHome} className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground sm:col-span-2">
            ← Back to dashboard
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Mistake review</h3>
            <button onClick={() => setReviewing(false)} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          {mistakes.map((m) => (
            <div key={m.question.id} className="glass rounded-2xl p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{m.question.difficulty}</Badge>
                <Badge variant="cyan">{m.question.category}</Badge>
              </div>
              <div className="text-sm font-semibold">{m.question.question}</div>
              <div className="mt-3 rounded-lg bg-secondary p-3 text-xs">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Correct answer</div>
                <div className="mt-1 font-semibold text-primary">{m.question.correct_answer}</div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.question.explanation}</p>
              <a
                href={m.question.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-cyan-glow hover:underline"
              >
                PMID: {m.question.source_pmid} ↗
              </a>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ScoreColumn({ label, value, accent }: { label: string; value: number; accent: "primary" | "cyan" }) {
  return (
    <div className="text-center">
      <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-5xl font-bold " + (accent === "primary" ? "text-neon" : "text-cyan-glow")}>
        {value}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────────────────────────

function BoltIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>);
}
function SwordsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
