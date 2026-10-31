from __future__ import annotations

from typing import Any
from copy import deepcopy
from urllib.parse import quote_plus


def _slug(value: str) -> str:
    keep = []
    last_dash = False
    for ch in value.lower():
        if ch.isalnum():
            keep.append(ch)
            last_dash = False
        elif not last_dash:
            keep.append("-")
            last_dash = True
    return "".join(keep).strip("-")


def _video(title: str, query: str) -> dict[str, Any]:
    encoded = quote_plus(query)
    return {
        "title": title,
        "provider": "youtube",
        "url": f"https://www.youtube.com/results?search_query={encoded}",
        "embed_url": f"https://www.youtube.com/embed?listType=search&list={encoded}",
        "duration_minutes": None,
    }


def _reference(title: str, url: str, resource_type: str = "reference") -> dict[str, str]:
    return {"title": title, "url": url, "type": resource_type}


def _topic_notes(title: str, concepts: list[str], pyq_concepts: list[str]) -> str:
    core = ", ".join(concepts[:5])
    concept_lines = " ".join(
        f"{concept.title()}: know the definition, when it applies, and one small worked example."
        for concept in concepts[:6]
    )
    pyq_focus = ", ".join(pyq_concepts[:4])
    return (
        f"{title} should be learned as a connected problem-solving unit, not as isolated definitions. "
        f"Start with the central vocabulary: {core}. {concept_lines} "
        f"For exam use, connect each idea to PYQ patterns such as {pyq_focus}. "
        "While solving, write the given data, identify the exact model or theorem, check boundary cases, "
        "and only then compute or prove. Keep a one-page sheet with definitions, standard transformations, "
        "edge cases, and two representative solved examples."
    )


def _topic_notes_hi(title: str, concepts: list[str], pyq_concepts: list[str]) -> str:
    return (
        f"{title} ko teen steps me padho: pehle definition clear karo, phir chhote examples solve karo, "
        f"aur phir PYQ pattern par practice karo. Main concepts: {', '.join(concepts[:5])}. "
        f"Exam me focus rakho: {', '.join(pyq_concepts[:4])}. Har question me pehle given data likho, "
        "kaunsa rule/model lagega ye identify karo, boundary cases check karo, aur final answer verify karo."
    )


def _revision_summary(title: str, concepts: list[str], pyq_concepts: list[str]) -> str:
    return (
        f"Revise {title} in four short rounds: 1. recall the definitions without notes, "
        f"2. redraw the concept map around {', '.join(concepts[:4])}, "
        f"3. solve three PYQ-style questions on {', '.join(pyq_concepts[:3])}, "
        "and 4. write the mistake that cost the most time. Finish by explaining the topic aloud in under two minutes."
    )


def _revision_summary_hi(title: str, concepts: list[str], pyq_concepts: list[str]) -> str:
    return (
        f"{title} revision ke liye: definitions yaad se likho, {', '.join(concepts[:4])} ka concept map banao, "
        f"{', '.join(pyq_concepts[:3])} par 3 timed questions solve karo, aur apni sabse badi mistake error notebook me likho."
    )


def _deep_notes(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[dict[str, str]]:
    return [
        {
            "heading": "Core Idea",
            "body": (
                f"{title} is built around {concepts[0]} and its relationship with {', '.join(concepts[1:4])}. "
                "Learn the formal definition first, then attach it to a small example, a counterexample, and a typical exam question."
            ),
        },
        {
            "heading": "How To Solve",
            "body": (
                "Read the question twice. Mark the input, required output, hidden constraints, and whether the task is calculation, proof, design, or tracing. "
                f"Then choose the method connected to {', '.join(concepts[:3])}."
            ),
        },
        {
            "heading": "PYQ Angle",
            "body": (
                f"Previous-year style questions usually test {', '.join(pyq_concepts[:3])}. "
                "The trap is often a changed condition, an edge case, or a familiar formula used outside its valid assumptions."
            ),
        },
        {
            "heading": "Revision Method",
            "body": (
                "Revise by active recall: close notes, write definitions, solve one direct example, solve one mixed example, then explain why the method works."
            ),
        },
    ]


def _formula_sheet(title: str, concepts: list[str]) -> list[str]:
    formulas = [
        f"Definition checkpoint: write the exact meaning of {concepts[0]} before starting a {title} question.",
        f"Model checkpoint: decide whether the problem is asking about {', '.join(concepts[1:4])}.",
        "Boundary checkpoint: test empty, singleton, zero, one, maximum, and repeated-value cases when relevant.",
        "Complexity/counting checkpoint: state the variable, input size, and assumptions before simplifying.",
        "Answer checkpoint: verify units, domain, range, and whether the result is exact or approximate.",
    ]
    formulas.extend(f"{concept.title()}: keep one formula/rule/example on the revision sheet." for concept in concepts[:5])
    return formulas


def _common_mistakes(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[str]:
    return [
        f"Using an informal meaning of {concepts[0]} instead of the precise definition.",
        f"Mixing up {concepts[1]} and {concepts[2]} when the question changes one condition.",
        f"Solving the calculation but missing what the question asks: {', '.join(pyq_concepts[:3])}.",
        "Ignoring boundary cases, especially zero, one, empty input, repeated values, and extreme sizes.",
        "Memorizing a shortcut without checking its assumptions.",
    ]


def _practice_tasks(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[str]:
    return [
        f"Write definitions for {', '.join(concepts[:4])} from memory.",
        f"Solve one direct example for each of {', '.join(concepts[:3])}.",
        f"Do five timed PYQ-style problems on {', '.join(pyq_concepts[:3])}.",
        f"Create one mixed question that combines {concepts[0]} with {concepts[-1]}.",
        "Maintain an error log with cause, correct idea, and one similar retry question.",
    ]


def _study_flow(title: str) -> list[str]:
    return [
        f"Concept pass: read the definitions and make a clean map of {title}.",
        "Example pass: solve small examples slowly and annotate every step.",
        "PYQ pass: attempt timed previous-year style questions without hints.",
        "Repair pass: update notes with mistakes, formulas, and traps.",
        "Recall pass: revise after 1 day, 3 days, 7 days, and 21 days.",
    ]


def _reference_links(title: str, query: str) -> list[dict[str, str]]:
    encoded = quote_plus(query or title)
    return [
        _reference(f"{title} topic search", f"https://www.google.com/search?q={encoded}", "search"),
        _reference(f"{title} GeeksforGeeks notes", f"https://www.google.com/search?q={encoded}+GeeksforGeeks", "notes"),
        _reference(f"{title} NPTEL lectures", f"https://www.google.com/search?q={encoded}+NPTEL", "course"),
        _reference(f"{title} PYQ practice", f"https://www.google.com/search?q={encoded}+GATE+CS+PYQ", "practice"),
    ]


def _prerequisites(title: str, concepts: list[str]) -> list[str]:
    return [
        "Comfort with basic notation, definitions, and small examples.",
        f"Ability to explain {concepts[0]} in plain language.",
        f"Familiarity with related ideas: {', '.join(concepts[1:4])}.",
        f"One solved warm-up problem before starting {title}.",
    ]


def _learning_outcomes(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[str]:
    return [
        f"Define and recognize {', '.join(concepts[:4])}.",
        f"Choose the correct method for PYQ patterns such as {', '.join(pyq_concepts[:3])}.",
        f"Solve direct, mixed, and boundary-case questions from {title}.",
        "Explain why the chosen formula, theorem, algorithm, or model is valid.",
        "Identify the most common wrong approach before committing to the final answer.",
    ]


def _quick_checks(title: str, concepts: list[str]) -> list[str]:
    return [
        f"What is the exact definition of {concepts[0]}?",
        f"When would {concepts[1]} fail or become invalid?",
        f"Give a smallest non-trivial example involving {concepts[2]}.",
        f"How does {concepts[3]} change the solution strategy?",
        f"What boundary case should always be tested in {title}?",
    ]


def _flashcards(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[dict[str, str]]:
    cards = [
        {
            "front": f"{title}: first step",
            "back": f"Write the precise definition and identify whether the question targets {', '.join(pyq_concepts[:2])}.",
        },
        {
            "front": f"{concepts[0]}",
            "back": "State its definition, one valid example, one invalid example, and the test used to recognize it.",
        },
        {
            "front": f"{concepts[1]} vs {concepts[2]}",
            "back": "Compare assumptions, output, and the type of question where each idea appears.",
        },
        {
            "front": "Common exam trap",
            "back": "A shortcut is valid only when all assumptions match the question statement.",
        },
    ]
    return cards


def _interview_prompts(title: str, concepts: list[str]) -> list[str]:
    return [
        f"Explain {title} to a beginner in two minutes.",
        f"Derive or justify the main rule behind {concepts[0]}.",
        f"Compare {concepts[1]} and {concepts[2]} with examples.",
        f"Design a small problem that tests {concepts[-1]} and solve it.",
        "Describe a mistake you made in this topic and how you fixed it.",
    ]


def _difficulty(priority: int, concepts: list[str]) -> str:
    if priority <= 2 or len(concepts) >= 8:
        return "Hard"
    if priority <= 5:
        return "Medium"
    return "Easy"


def _estimated_study_minutes(priority: int, concepts: list[str]) -> int:
    return min(180, 45 + priority * 10 + len(concepts) * 5)


def _diagram_spec(title: str, concepts: list[str]) -> dict[str, Any]:
    return {
        "title": f"{title} concept map",
        "type": "concept_map",
        "nodes": [title] + concepts[:6],
        "edges": [{"from": title, "to": concept} for concept in concepts[:6]],
    }


def _quiz_questions(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[dict[str, Any]]:
    return [
        {
            "question": f"Which idea should you identify first in a {title} problem?",
            "options": [
                f"The exact definition of {concepts[0]}",
                "The longest available formula",
                "The final numeric option",
                "The previous topic name",
            ],
            "answer": f"The exact definition of {concepts[0]}",
            "explanation": "Most mistakes start from using the wrong model. The first step is to identify the definition and conditions.",
        },
        {
            "question": f"Which PYQ pattern is most directly connected to {title}?",
            "options": [
                pyq_concepts[0],
                "Unrelated memorization",
                "Only vocabulary recall",
                "Only essay writing",
            ],
            "answer": pyq_concepts[0],
            "explanation": f"{pyq_concepts[0]} is one of the listed previous-year style patterns for this topic.",
        },
        {
            "question": f"What is the best final check before submitting a {title} answer?",
            "options": [
                "Verify assumptions, boundary cases, and what the question actually asks.",
                "Submit immediately after the first calculation.",
                "Ignore edge cases if the answer looks familiar.",
                "Use the same method for every question.",
            ],
            "answer": "Verify assumptions, boundary cases, and what the question actually asks.",
            "explanation": "GATE-style questions often punish missing conditions more than long calculations.",
        },
    ]


def _worked_examples(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[dict[str, str]]:
    return [
        {
            "title": f"Direct {title} recognition",
            "problem": f"Given a small instance involving {concepts[0]}, identify the concept being tested and list the conditions.",
            "solution": f"Match the statement against the definition of {concepts[0]}, then verify the conditions connected to {', '.join(concepts[1:3])}.",
        },
        {
            "title": f"PYQ pattern: {pyq_concepts[0]}",
            "problem": f"Convert a previous-year style prompt on {pyq_concepts[0]} into a sequence of clear solution steps.",
            "solution": "Separate given data, hidden condition, method, calculation/proof, and final verification.",
        },
        {
            "title": f"Boundary case check for {title}",
            "problem": "Test the solution on the smallest valid input and one extreme input.",
            "solution": "If the method fails on a boundary case, restate the assumption and choose the more general rule.",
        },
    ]


def _memory_hooks(title: str, concepts: list[str]) -> list[str]:
    return [
        f"Anchor {title} with one tiny example you can redraw in under 30 seconds.",
        f"Pair {concepts[0]} with its opposite or failure case.",
        f"Remember the order: define, model, compute, verify.",
        f"Create a one-line trigger for {concepts[-1]} so you recognize it inside mixed questions.",
    ]


def _reading_pointers(title: str, concepts: list[str]) -> list[str]:
    return [
        f"Read a standard textbook section covering {title} before watching shortcuts.",
        f"After reading, write a glossary for {', '.join(concepts[:4])}.",
        "Prefer solved examples first, then unsolved exercise sets, then timed PYQs.",
        "Keep only exam-useful derivations on the final revision page.",
    ]


def _revision_schedule(title: str) -> list[dict[str, str]]:
    return [
        {"when": "Same day", "task": f"Rewrite the definition map for {title} and solve one easy example."},
        {"when": "After 1 day", "task": "Attempt two quick checks without opening notes."},
        {"when": "After 3 days", "task": "Solve one PYQ-style question and update the error notebook."},
        {"when": "After 7 days", "task": "Do a timed mini-set and review formulas only after attempting."},
        {"when": "After 21 days", "task": "Explain the topic aloud and solve one mixed problem."},
    ]


def _mastery_rubric(title: str, concepts: list[str], pyq_concepts: list[str]) -> list[str]:
    return [
        f"Bronze: define {concepts[0]} and solve a direct example.",
        f"Silver: distinguish {concepts[1]} from {concepts[2]} under changed conditions.",
        f"Gold: solve timed questions on {', '.join(pyq_concepts[:2])} without hints.",
        f"Platinum: teach {title}, include edge cases, and create one new mixed problem.",
    ]


def _pyq_subject(slug: str, name: str) -> str:
    return {
        "programming-c": "Programming and Data Structures",
        "data-structures": "Programming and Data Structures",
        "discrete-mathematics": "Computer Science and Information Technology",
        "object-oriented-programming-design": "",
        "computer-graphics": "",
        "distributed-systems": "",
        "cybersecurity-cryptography": "",
        "cloud-computing-devops": "",
        "data-science-big-data": "",
        "web-technologies": "",
    }.get(slug, name)


def _subject_resources(name: str, pyq_subject: str) -> list[dict[str, str]]:
    encoded = quote_plus(name)
    resources = [
        _reference("GATE CSE best video lectures hub", "https://gatecse.in/w/index.php?title=Best_video_lectures_for_CSE", "video-hub"),
        _reference("NPTEL CSE course playlists", "https://sites.google.com/view/nptelcse/courses", "course-hub"),
        _reference(f"{name} YouTube playlist search", f"https://www.youtube.com/results?search_query={encoded}+GATE+CS+complete+playlist", "playlist-search"),
        _reference(f"{name} notes search", f"https://www.google.com/search?q={encoded}+GATE+CS+notes", "notes"),
    ]
    if pyq_subject:
        resources.append(_reference(f"{pyq_subject} PYQ search", f"https://www.google.com/search?q={quote_plus(pyq_subject)}+GATE+CS+PYQ", "pyq"))
    return resources


def _topic(
    title: str,
    priority: int,
    concepts: list[str],
    pyq_concepts: list[str],
    formulas: list[str] | None = None,
    notes: str = "",
    query: str = "",
) -> dict[str, Any]:
    search_query = query or f"GATE CS {title}"
    english_notes = notes or _topic_notes(title, concepts, pyq_concepts)
    english_revision = _revision_summary(title, concepts, pyq_concepts)
    return {
        "slug": _slug(title),
        "title": title,
        "priority": priority,
        "difficulty": _difficulty(priority, concepts),
        "estimated_study_minutes": _estimated_study_minutes(priority, concepts),
        "status": "ready",
        "concepts": concepts,
        "written_notes": english_notes,
        "revision_summary": english_revision,
        "notes_by_language": {"en": english_notes, "hi": _topic_notes_hi(title, concepts, pyq_concepts)},
        "revision_by_language": {"en": english_revision, "hi": _revision_summary_hi(title, concepts, pyq_concepts)},
        "deep_notes": _deep_notes(title, concepts, pyq_concepts),
        "formula_sheet": formulas or _formula_sheet(title, concepts),
        "mind_map": [title] + concepts[:8],
        "pyq_concepts": pyq_concepts,
        "common_mistakes": _common_mistakes(title, concepts, pyq_concepts),
        "practice_tasks": _practice_tasks(title, concepts, pyq_concepts),
        "study_flow": _study_flow(title),
        "prerequisites": _prerequisites(title, concepts),
        "learning_outcomes": _learning_outcomes(title, concepts, pyq_concepts),
        "quick_checks": _quick_checks(title, concepts),
        "flashcards": _flashcards(title, concepts, pyq_concepts),
        "interview_prompts": _interview_prompts(title, concepts),
        "diagram": _diagram_spec(title, concepts),
        "quiz_questions": _quiz_questions(title, concepts, pyq_concepts),
        "worked_examples": _worked_examples(title, concepts, pyq_concepts),
        "memory_hooks": _memory_hooks(title, concepts),
        "reading_pointers": _reading_pointers(title, concepts),
        "revision_schedule": _revision_schedule(title),
        "mastery_rubric": _mastery_rubric(title, concepts, pyq_concepts),
        "reference_links": _reference_links(title, search_query),
        "video_lectures": [
            _video(f"{title} full lecture", search_query),
            _video(f"{title} PYQ practice", f"{search_query} GATE CS PYQ solved"),
            _video(f"{title} quick revision", f"{search_query} quick revision"),
            _video(f"{title} Hindi explanation", f"{search_query} Hindi explanation"),
        ],
    }


def _subject(slug: str, name: str, weight: str, description: str, topics: list[dict[str, Any]]) -> dict[str, Any]:
    topic_titles = [topic["title"] for topic in topics]
    pyq_subject = _pyq_subject(slug, name)
    return {
        "slug": slug,
        "name": name,
        "exam_weight": weight,
        "description": description,
        "pyq_subject": pyq_subject,
        "pyq_available": bool(pyq_subject),
        "curated_resources": _subject_resources(name, pyq_subject),
        "roadmap": [
            f"Foundation: make concise notes for {', '.join(topic_titles[:3])}.",
            f"Core practice: solve mixed examples from {', '.join(topic_titles[3:6] or topic_titles[:3])}.",
            f"PYQ pass: attempt previous-year questions from {', '.join(topic_titles[6:9] or topic_titles[-3:])}.",
            "Revision loop: revisit mistakes after 1 day, 3 days, 7 days, and 21 days.",
        ],
        "exam_strategy": [
            "Start with direct definition and formula questions to secure fast marks.",
            "Mark calculation-heavy or proof-heavy questions for a second pass when time is limited.",
            "After each topic, maintain an error notebook with concept gap, careless error, and retry date.",
            "Before mocks, revise only compact sheets: definitions, traps, formulas, and solved patterns.",
        ],
        "milestones": [
            "Can explain every topic in the subject without opening notes.",
            "Can solve easy and medium PYQ-style questions within target time.",
            "Can identify the exact concept tested before doing the computation.",
            "Can recover from a wrong attempt by naming the missed condition.",
        ],
        "topics": topics,
    }


SUBJECT_SPECS: list[tuple[str, str, str, str, list[tuple[str, list[str], list[str]]]]] = [
    (
        "discrete-mathematics",
        "Discrete Mathematics",
        "Very High",
        "Logic, sets, counting, relations, algebra, and graph theory for GATE CS proof and problem solving.",
        [
            ("Propositional Logic", ["propositions", "truth tables", "logical equivalence", "implication", "contrapositive", "normal forms", "tautology", "contradiction"], ["truth-table validity", "CNF/DNF", "satisfiability"]),
            ("Predicate Logic", ["predicates", "quantifiers", "scope", "free and bound variables", "negation of quantified statements", "translation from English"], ["predicate translation", "unique existence", "quantifier negation"]),
            ("Sets and Countability", ["sets", "power set", "cartesian product", "cardinality", "countable sets", "uncountable sets", "diagonal argument"], ["power-set count", "bijection", "countability"]),
            ("Relations", ["relation matrix", "reflexive", "symmetric", "antisymmetric", "transitive", "equivalence relation", "equivalence classes", "closures"], ["relation properties", "equivalence classes", "transitive closure"]),
            ("Partial Orders and Lattices", ["partial order", "Hasse diagram", "chains", "antichains", "least/greatest elements", "lattice", "topological ordering"], ["Hasse diagrams", "maximal vs maximum", "lattice operations"]),
            ("Functions", ["domain and codomain", "one-one", "onto", "bijection", "composition", "inverse function", "pigeonhole use"], ["injective/surjective tests", "composition properties", "counting functions"]),
            ("Algebraic Structures", ["binary operation", "semigroup", "monoid", "group", "subgroup", "cyclic group", "cosets", "homomorphism"], ["group table", "identity/inverse", "cyclic groups"]),
            ("Combinatorics", ["sum and product rule", "permutations", "combinations", "multisets", "stars and bars", "inclusion-exclusion", "pigeonhole principle"], ["case counting", "arrangements with restrictions", "stars and bars"]),
            ("Recurrence Relations and Generating Functions", ["linear recurrences", "characteristic roots", "generating functions", "divide-and-conquer recurrence", "counting recurrence"], ["recurrence solving", "sequence counting", "generating functions"]),
            ("Graph Theory", ["graphs", "degree", "paths", "cycles", "trees", "connectivity", "bipartite graphs", "planarity", "coloring", "matching"], ["tree properties", "Euler/Hamilton paths", "bipartite tests", "chromatic number"]),
        ],
    ),
    (
        "engineering-mathematics",
        "Engineering Mathematics",
        "High",
        "Linear algebra, calculus, probability, statistics, and numerical methods used across CS questions.",
        [
            ("Linear Algebra - Matrices", ["matrix operations", "determinants", "rank", "inverse", "row reduction", "echelon form"], ["rank calculation", "determinant properties", "invertibility"]),
            ("Systems of Linear Equations", ["homogeneous systems", "non-homogeneous systems", "consistency", "rank test", "solution space", "Gaussian elimination"], ["rank consistency", "number of solutions", "null space"]),
            ("Vector Spaces", ["span", "basis", "dimension", "subspace", "linear independence", "rank-nullity"], ["basis tests", "dimension", "subspace identification"]),
            ("Eigenvalues and Eigenvectors", ["characteristic polynomial", "eigenvalues", "eigenvectors", "diagonalization", "trace", "determinant"], ["eigenvalue computation", "trace/product relation", "diagonalization"]),
            ("Calculus - Limits and Continuity", ["limits", "one-sided limits", "continuity", "standard limits", "piecewise functions"], ["limit evaluation", "continuity constraints", "piecewise parameters"]),
            ("Differentiation and Maxima-Minima", ["derivatives", "partial derivatives", "mean value theorem", "monotonicity", "local maxima", "local minima"], ["optimization", "critical points", "differentiability"]),
            ("Integration", ["indefinite integrals", "definite integrals", "area", "symmetry", "substitution", "integration by parts"], ["definite integral tricks", "area", "symmetry"]),
            ("Probability", ["sample space", "conditional probability", "independence", "Bayes theorem", "random variables", "expectation"], ["Bayes theorem", "conditional probability", "expected value"]),
            ("Statistics and Distributions", ["mean", "median", "variance", "standard deviation", "binomial", "Poisson", "normal", "exponential"], ["variance", "distribution parameters", "expected value"]),
            ("Numerical Methods", ["round-off error", "Newton-Raphson", "bisection", "interpolation", "numerical integration", "error bounds"], ["iteration formula", "root approximation", "error order"]),
        ],
    ),
    (
        "digital-logic",
        "Digital Logic",
        "High",
        "Number representation, Boolean minimization, combinational circuits, and sequential machines.",
        [
            ("Number Systems and Codes", ["binary", "octal", "hexadecimal", "BCD", "Gray code", "signed magnitude", "1s complement", "2s complement"], ["base conversion", "overflow", "signed arithmetic"]),
            ("Boolean Algebra and Logic Gates", ["Boolean laws", "De Morgan laws", "duality", "universal gates", "XOR/XNOR", "canonical forms"], ["Boolean simplification", "NAND/NOR implementation", "SOP/POS"]),
            ("K-Maps and Minimization", ["minterms", "maxterms", "K-map grouping", "don't cares", "prime implicants", "essential implicants"], ["K-map minimization", "hazards", "minimal SOP/POS"]),
            ("Combinational Circuits", ["half/full adder", "subtractor", "comparator", "decoder", "encoder", "priority encoder", "parity generator"], ["adder design", "decoder equations", "comparator logic"]),
            ("Multiplexers and Programmable Logic", ["multiplexer", "demultiplexer", "PLA", "PAL", "ROM implementation", "function realization"], ["MUX implementation", "function using decoder", "PLA/PAL design"]),
            ("Latches and Flip-Flops", ["SR latch", "D latch", "JK flip-flop", "T flip-flop", "excitation tables", "race-around"], ["flip-flop conversion", "excitation", "timing behavior"]),
            ("Counters and Registers", ["ripple counters", "synchronous counters", "shift registers", "ring counter", "Johnson counter", "mod-n counter"], ["counter sequence", "state design", "register operations"]),
            ("Finite State Machines", ["Mealy machine", "Moore machine", "state diagram", "state table", "state minimization", "sequence detector"], ["FSM design", "state minimization", "output timing"]),
        ],
    ),
    (
        "computer-organization-architecture",
        "Computer Organization and Architecture",
        "Very High",
        "Instruction execution, datapath, pipelining, memory hierarchy, storage, and I/O.",
        [
            ("Data Representation and Computer Arithmetic", ["integer representation", "floating point", "IEEE 754", "addition", "subtraction", "multiplication", "division"], ["2s complement", "overflow", "floating-point format"]),
            ("Instruction Formats and Addressing Modes", ["opcode", "operand fields", "addressing modes", "instruction length", "load-store ISA", "stack ISA"], ["effective address", "instruction encoding", "addressing mode identification"]),
            ("ALU, Datapath, and Control", ["ALU", "register file", "datapath", "control signals", "hardwired control", "microprogrammed control"], ["datapath timing", "control sequence", "CPI calculation"]),
            ("Pipelining and Hazards", ["pipeline stages", "structural hazards", "data hazards", "control hazards", "forwarding", "stalls", "branch penalty"], ["pipeline speedup", "hazard detection", "CPI with stalls"]),
            ("Cache Memory", ["direct mapping", "set associative cache", "fully associative cache", "tag/index/offset", "replacement", "write policies"], ["cache mapping", "AMAT", "hit/miss sequence"]),
            ("Main Memory and Virtual Memory", ["RAM", "DRAM", "paging", "page tables", "TLB", "address translation", "page faults"], ["virtual address split", "TLB reach", "page-table size"]),
            ("Storage and Disk Systems", ["magnetic disk", "seek time", "rotational latency", "transfer time", "RAID basics", "disk scheduling"], ["disk access time", "scheduling order", "storage geometry"]),
            ("I/O, Interrupts, and DMA", ["programmed I/O", "interrupts", "DMA", "memory-mapped I/O", "I/O channels", "priority interrupts"], ["interrupt sequence", "DMA timing", "I/O transfer rate"]),
            ("Parallelism and Performance", ["Amdahl law", "speedup", "throughput", "latency", "multicore basics", "SIMD/MIMD"], ["speedup limits", "CPI", "execution time"]),
        ],
    ),
    (
        "programming-c",
        "Programming in C",
        "High",
        "C syntax, control flow, pointers, memory, recursion, and output prediction.",
        [
            ("C Basics and Operators", ["tokens", "data types", "operators", "precedence", "associativity", "type conversion", "expressions"], ["operator precedence", "integer division", "type casting"]),
            ("Control Flow and Functions", ["if-else", "switch", "loops", "break/continue", "functions", "scope", "storage classes"], ["loop tracing", "function calls", "scope/shadowing"]),
            ("Arrays and Strings", ["arrays", "multidimensional arrays", "strings", "character arrays", "string library", "array decay"], ["array indexing", "string termination", "pointer-array relation"]),
            ("Pointers", ["address operator", "dereference", "pointer arithmetic", "pointer to pointer", "function pointers", "const pointers"], ["pointer arithmetic", "aliasing", "address tracing"]),
            ("Structures, Unions, and Memory Layout", ["struct", "union", "padding", "alignment", "bit fields", "typedef"], ["sizeof", "layout", "union value"]),
            ("Dynamic Memory and Linked Data", ["malloc", "calloc", "realloc", "free", "dangling pointer", "memory leak", "linked node"], ["dynamic allocation", "pointer updates", "memory errors"]),
            ("Recursion and Program Tracing", ["base case", "recursive case", "call stack", "tail recursion", "mutual recursion", "complexity"], ["recursive output", "stack depth", "recurrence from code"]),
        ],
    ),
    (
        "data-structures",
        "Data Structures",
        "Very High",
        "Linear structures, trees, heaps, hashing, graphs, and implementation complexity.",
        [
            ("Arrays, Stacks, and Queues", ["arrays", "dynamic arrays", "stack", "queue", "circular queue", "deque", "expression evaluation"], ["stack operations", "queue state", "postfix/infix"]),
            ("Linked Lists", ["singly linked list", "doubly linked list", "circular list", "insertion", "deletion", "reversal"], ["pointer update order", "linked-list tracing", "complexity"]),
            ("Trees and Traversals", ["tree terminology", "binary tree", "full/complete tree", "preorder", "inorder", "postorder", "level order"], ["traversal reconstruction", "node count", "height"]),
            ("Binary Search Trees and Balanced Trees", ["BST", "search/insert/delete", "AVL rotations", "height balance", "B trees", "B+ trees"], ["BST construction", "AVL rotation", "B+ tree node count"]),
            ("Heaps and Priority Queues", ["binary heap", "heapify", "build heap", "insert", "delete-min/max", "priority queue"], ["heap construction", "heap sort", "complexity"]),
            ("Hashing", ["hash functions", "load factor", "separate chaining", "linear probing", "quadratic probing", "double hashing", "rehashing"], ["probing sequence", "collision handling", "expected search time"]),
            ("Graph Representations and Traversals", ["adjacency matrix", "adjacency list", "BFS", "DFS", "connected components", "topological sort"], ["BFS/DFS order", "DFS timestamps", "space complexity"]),
        ],
    ),
    (
        "algorithms",
        "Algorithms",
        "Very High",
        "Complexity analysis, sorting, graph algorithms, greedy methods, dynamic programming, and NP-completeness.",
        [
            ("Asymptotic Analysis", ["Big-O", "Omega", "Theta", "little-o", "little-omega", "growth comparison", "loop analysis"], ["growth ordering", "nested-loop complexity", "asymptotic bounds"]),
            ("Recurrences and Master Theorem", ["substitution", "recursion tree", "Master theorem", "Akra-Bazzi intuition", "divide-and-conquer recurrences"], ["recurrence solving", "Master theorem cases", "recursion tree"]),
            ("Searching and Sorting", ["linear search", "binary search", "insertion sort", "merge sort", "quick sort", "heap sort", "counting sort"], ["comparison lower bound", "stability", "worst/average case"]),
            ("Divide and Conquer", ["divide", "conquer", "combine", "binary search variants", "merge procedure", "selection"], ["algorithm recurrence", "correctness by induction", "merge/count problems"]),
            ("Greedy Algorithms", ["greedy choice", "exchange argument", "activity selection", "Huffman coding", "fractional knapsack", "matroids intuition"], ["Huffman tree", "activity selection", "greedy correctness"]),
            ("Dynamic Programming", ["optimal substructure", "overlapping subproblems", "memoization", "tabulation", "LCS", "knapsack", "matrix chain"], ["DP recurrence", "table filling", "optimal cost"]),
            ("Graph Algorithms", ["BFS", "DFS", "topological sort", "SCC", "MST", "Dijkstra", "Bellman-Ford", "Floyd-Warshall"], ["DFS timestamps", "MST uniqueness", "shortest path", "SCC"]),
            ("Complexity Classes and NP-Completeness", ["P", "NP", "co-NP", "NP-hard", "NP-complete", "polynomial reduction", "decision vs optimization"], ["class membership", "reductions", "NP-complete identification"]),
        ],
    ),
    (
        "theory-of-computation",
        "Theory of Computation",
        "Very High",
        "Finite automata, regular languages, CFGs, PDAs, Turing machines, and undecidability.",
        [
            ("DFA, NFA, and Epsilon-NFA", ["DFA", "NFA", "epsilon transitions", "subset construction", "equivalence", "dead state"], ["NFA to DFA", "minimum states", "language acceptance"]),
            ("Regular Expressions and Regular Languages", ["regular expressions", "regular grammar", "closure", "decision properties", "finite languages"], ["regex design", "closure properties", "counting accepted strings"]),
            ("DFA Minimization and Myhill-Nerode", ["distinguishable states", "equivalence classes", "partition refinement", "minimal DFA", "Myhill-Nerode idea"], ["state minimization", "distinguishability", "minimum DFA count"]),
            ("Pumping Lemma for Regular Languages", ["pumping length", "decomposition", "non-regular proof", "closure-assisted proof"], ["non-regularity", "pumping arguments", "counterexamples"]),
            ("Context-Free Grammars", ["CFG", "derivation", "parse tree", "ambiguity", "left recursion", "CNF", "GNF"], ["grammar generation", "ambiguity", "CNF derivation length"]),
            ("Pushdown Automata and CFLs", ["PDA", "stack behavior", "DPDA", "NPDA", "CFL closure", "pumping lemma for CFL"], ["PDA design", "CFL/non-CFL", "closure questions"]),
            ("Turing Machines and Language Classes", ["TM", "decidable", "recognizable", "recursive", "recursively enumerable", "enumerator"], ["RE vs recursive", "TM acceptance", "closure of language classes"]),
            ("Decidability and Reductions", ["halting problem", "undecidable problems", "mapping reduction", "Rice theorem intuition", "semi-decidability"], ["decidability", "undecidability proof", "reduction direction"]),
        ],
    ),
    (
        "compiler-design",
        "Compiler Design",
        "High",
        "Lexical analysis, parsing, translation, runtime environments, and optimization.",
        [
            ("Compiler Phases and Symbol Table", ["lexical analysis", "syntax analysis", "semantic analysis", "intermediate code", "optimization", "code generation", "symbol table"], ["phase identification", "error type", "symbol-table role"]),
            ("Lexical Analysis", ["tokens", "lexemes", "patterns", "regular expressions", "DFA implementation", "lexical errors"], ["token counting", "regex to DFA", "lexical analyzer design"]),
            ("FIRST, FOLLOW, and LL Parsing", ["nullable", "FIRST", "FOLLOW", "LL(1)", "predictive parsing", "left factoring", "left recursion"], ["FIRST/FOLLOW", "LL(1) table", "grammar transformation"]),
            ("LR Parsing", ["LR(0)", "SLR", "CLR", "LALR", "items", "closures", "goto", "shift-reduce conflicts"], ["LR items", "parse table", "conflict detection"]),
            ("Syntax-Directed Translation", ["attributes", "S-attributed definitions", "L-attributed definitions", "semantic rules", "syntax tree", "three-address code"], ["attribute evaluation", "SDD/SDT", "intermediate code"]),
            ("Runtime Environment", ["activation record", "stack allocation", "heap allocation", "parameter passing", "static/dynamic scope", "access links"], ["activation records", "scope", "parameter passing"]),
            ("Code Optimization and Data Flow", ["basic blocks", "DAG", "common subexpression elimination", "constant folding", "liveness", "register allocation"], ["basic block DAG", "local optimization", "live variable analysis"]),
        ],
    ),
    (
        "operating-systems",
        "Operating Systems",
        "Very High",
        "Processes, scheduling, synchronization, deadlocks, memory management, and file systems.",
        [
            ("Processes, Threads, and System Calls", ["process states", "PCB", "context switch", "threads", "kernel/user mode", "system calls", "fork"], ["fork output", "state transition", "context switch"]),
            ("CPU Scheduling", ["FCFS", "SJF", "SRTF", "priority scheduling", "round robin", "waiting time", "turnaround time", "response time"], ["Gantt chart", "average waiting time", "preemption"]),
            ("Process Synchronization", ["critical section", "race condition", "semaphore", "mutex", "monitor", "producer-consumer", "readers-writers"], ["semaphore trace", "mutual exclusion", "synchronization bugs"]),
            ("Deadlocks", ["necessary conditions", "resource allocation graph", "Banker's algorithm", "prevention", "avoidance", "detection", "recovery"], ["safe sequence", "deadlock detection", "RAG"]),
            ("Memory Management", ["contiguous allocation", "paging", "segmentation", "address translation", "fragmentation", "page table"], ["logical to physical address", "page table size", "fragmentation"]),
            ("Virtual Memory and Page Replacement", ["demand paging", "page fault", "FIFO", "LRU", "Optimal", "thrashing", "working set"], ["page fault count", "Belady anomaly", "replacement algorithms"]),
            ("File Systems", ["file allocation", "linked allocation", "indexed allocation", "inodes", "directories", "free-space management"], ["allocation overhead", "inode addressing", "directory structure"]),
            ("Disk Scheduling and I/O", ["FCFS disk", "SSTF", "SCAN", "C-SCAN", "LOOK", "I/O buffering", "spooling"], ["disk head movement", "seek time", "scheduling order"]),
        ],
    ),
    (
        "databases",
        "Databases",
        "Very High",
        "ER design, relational algebra, SQL, normalization, indexing, transactions, and concurrency control.",
        [
            ("ER Model and Relational Model", ["entities", "attributes", "relationships", "cardinality", "participation", "keys", "schema mapping"], ["ER to relation", "weak entity", "cardinality"]),
            ("Relational Algebra", ["selection", "projection", "rename", "union", "difference", "cartesian product", "joins", "division"], ["query result", "join cardinality", "division"]),
            ("Tuple and Domain Relational Calculus", ["TRC", "DRC", "safe queries", "existential quantifier", "universal quantifier"], ["TRC to RA", "safe expression", "quantified query"]),
            ("SQL", ["DDL", "DML", "joins", "group by", "having", "nested queries", "views", "constraints"], ["SQL output", "aggregation", "nested query"]),
            ("Functional Dependencies and Keys", ["FD", "attribute closure", "canonical cover", "candidate keys", "superkeys", "Armstrong axioms"], ["attribute closure", "candidate key count", "FD inference"]),
            ("Normalization and Decomposition", ["1NF", "2NF", "3NF", "BCNF", "lossless join", "dependency preservation", "multivalued dependency"], ["normal form", "lossless decomposition", "dependency preservation"]),
            ("Transactions and Serializability", ["ACID", "schedules", "conflict serializability", "view serializability", "recoverability", "cascadeless schedules"], ["precedence graph", "recoverable schedule", "serial order"]),
            ("Concurrency Control and Recovery", ["2PL", "strict 2PL", "timestamp ordering", "deadlocks", "logging", "ARIES basics", "checkpoint"], ["2PL behavior", "timestamp ordering", "undo/redo"]),
            ("Indexing and File Organization", ["primary index", "secondary index", "dense/sparse index", "B+ tree", "hash index", "file organization"], ["B+ tree height", "index entries", "disk accesses"]),
        ],
    ),
    (
        "computer-networks",
        "Computer Networks",
        "Very High",
        "Layered models, data link protocols, IP, routing, TCP/UDP, congestion control, and applications.",
        [
            ("Network Models and Delay", ["OSI", "TCP/IP", "encapsulation", "packet switching", "circuit switching", "transmission delay", "propagation delay"], ["layer identification", "delay calculation", "encapsulation"]),
            ("Data Link Layer and Error Control", ["framing", "bit stuffing", "parity", "checksum", "CRC", "Hamming code", "ARQ"], ["CRC remainder", "Hamming code", "error detection"]),
            ("Flow Control and Sliding Window", ["stop-and-wait", "go-back-N", "selective repeat", "window size", "sequence numbers", "utilization"], ["window size", "throughput", "sequence number bits"]),
            ("MAC and LAN Technologies", ["ALOHA", "CSMA", "CSMA/CD", "Ethernet", "switches", "bridges", "VLAN basics"], ["CSMA/CD", "Ethernet frame", "collision"]),
            ("IP Addressing and Subnetting", ["IPv4", "CIDR", "subnet mask", "supernetting", "fragmentation", "ARP", "ICMP"], ["subnet calculation", "longest prefix match", "fragment offset"]),
            ("Routing Algorithms", ["distance vector", "link state", "Dijkstra", "Bellman-Ford", "routing tables", "count-to-infinity"], ["shortest path", "routing update", "table construction"]),
            ("Transport Layer TCP and UDP", ["UDP", "TCP", "three-way handshake", "sequence number", "acknowledgement", "flow control", "retransmission"], ["TCP sequence/ACK", "connection setup", "timeout"]),
            ("TCP Congestion Control", ["slow start", "congestion avoidance", "fast retransmit", "fast recovery", "AIMD", "cwnd", "ssthresh"], ["cwnd evolution", "throughput", "loss response"]),
            ("Application Layer Protocols", ["DNS", "HTTP", "HTTPS basics", "SMTP", "FTP", "DHCP", "socket API"], ["DNS lookup", "HTTP request", "protocol ports"]),
        ],
    ),
    (
        "software-engineering",
        "Software Engineering",
        "Medium",
        "Software process, requirements, design, testing, maintenance, and project metrics.",
        [
            ("Software Process Models", ["waterfall", "incremental", "spiral", "agile", "requirements", "risk analysis"], ["process-model choice", "SDLC phases", "risk-driven development"]),
            ("Requirements and Design", ["functional requirements", "non-functional requirements", "SRS", "cohesion", "coupling", "modularity", "UML basics"], ["cohesion/coupling", "requirement classification", "design metrics"]),
            ("Software Testing", ["unit testing", "integration testing", "system testing", "black-box", "white-box", "basis path", "cyclomatic complexity"], ["test-case design", "cyclomatic complexity", "coverage"]),
            ("Software Maintenance and Project Metrics", ["maintenance types", "effort estimation", "COCOMO basics", "reliability", "quality metrics"], ["maintenance type", "effort estimate", "quality metrics"]),
        ],
    ),
    (
        "web-technologies",
        "Web Technologies",
        "Medium",
        "HTTP, HTML, CSS, JavaScript, APIs, browser basics, and web security foundations.",
        [
            ("HTTP and Client-Server Architecture", ["request/response", "methods", "status codes", "headers", "cookies", "sessions", "caching"], ["HTTP method", "status code", "cookie/session"]),
            ("HTML and CSS", ["semantic HTML", "forms", "selectors", "box model", "layout", "responsive design"], ["selector specificity", "form behavior", "box model"]),
            ("JavaScript and DOM", ["variables", "functions", "events", "DOM tree", "asynchronous JavaScript", "fetch"], ["DOM manipulation", "event handling", "async behavior"]),
            ("APIs and Web Security Basics", ["REST", "JSON", "authentication", "CORS", "XSS", "CSRF", "HTTPS"], ["API request", "CORS", "web vulnerability"]),
        ],
    ),
    (
        "ai-machine-learning",
        "AI and Machine Learning",
        "Medium",
        "Core AI/ML topics useful for modern CS preparation, interviews, and DA/AI-adjacent exams.",
        [
            ("AI Search and Problem Solving", ["state space", "uninformed search", "BFS", "DFS", "uniform-cost search", "A*", "heuristics"], ["search tree", "admissible heuristic", "optimality"]),
            ("Knowledge Representation and Reasoning", ["logic-based agents", "rules", "inference", "resolution", "semantic networks", "planning basics"], ["logical inference", "resolution", "planning states"]),
            ("Machine Learning Basics", ["supervised learning", "unsupervised learning", "train/test split", "bias-variance", "overfitting", "regularization"], ["model selection", "overfitting", "bias-variance"]),
            ("Regression and Classification", ["linear regression", "logistic regression", "decision trees", "naive Bayes", "kNN", "SVM intuition"], ["loss function", "classification metrics", "decision boundary"]),
            ("Clustering and Dimensionality Reduction", ["k-means", "hierarchical clustering", "PCA", "distance metrics", "silhouette intuition"], ["cluster assignment", "PCA variance", "distance metric"]),
            ("Neural Networks and Deep Learning", ["perceptron", "activation functions", "backpropagation", "gradient descent", "CNN basics", "RNN basics", "transformers basics"], ["forward pass", "gradient descent", "activation functions"]),
            ("NLP and Generative AI", ["tokens", "embeddings", "language models", "attention", "transformers", "prompting", "RAG basics"], ["embedding similarity", "attention intuition", "RAG pipeline"]),
            ("ML Evaluation and Deployment", ["confusion matrix", "precision", "recall", "F1", "ROC", "data leakage", "model monitoring"], ["metric selection", "confusion matrix", "data leakage"]),
        ],
    ),
    (
        "object-oriented-programming-design",
        "Object-Oriented Programming and Design",
        "Medium",
        "OOP concepts, design principles, UML, and reusable design patterns for software construction.",
        [
            ("OOP Foundations", ["class", "object", "state", "behavior", "message passing", "identity", "encapsulation"], ["class vs object", "encapsulation", "object state"]),
            ("Inheritance and Polymorphism", ["inheritance", "subtyping", "overriding", "overloading", "dynamic dispatch", "abstract class", "interface"], ["method dispatch", "inheritance hierarchy", "overriding vs overloading"]),
            ("SOLID Principles", ["single responsibility", "open closed", "Liskov substitution", "interface segregation", "dependency inversion"], ["design principle identification", "coupling reduction", "substitutability"]),
            ("UML and Object Modeling", ["use-case diagram", "class diagram", "sequence diagram", "aggregation", "composition", "association"], ["UML relation", "class diagram", "object interaction"]),
            ("Design Patterns", ["factory", "singleton", "adapter", "observer", "strategy", "decorator", "command"], ["pattern selection", "object collaboration", "extension point"]),
            ("Clean Code and Refactoring", ["naming", "cohesion", "coupling", "duplication", "code smell", "extract method", "dependency injection"], ["code smell", "refactoring choice", "maintainability"]),
        ],
    ),
    (
        "computer-graphics",
        "Computer Graphics",
        "Medium",
        "2D/3D transformations, viewing, rasterization, curves, clipping, shading, and rendering basics.",
        [
            ("Graphics Pipeline", ["modeling", "world coordinates", "view coordinates", "projection", "clipping", "rasterization", "frame buffer"], ["pipeline stage", "coordinate system", "display transformation"]),
            ("2D Transformations", ["translation", "rotation", "scaling", "shearing", "homogeneous coordinates", "composite transform"], ["matrix multiplication", "rotation center", "composite transform"]),
            ("3D Transformations and Projection", ["3D translation", "3D rotation", "perspective projection", "orthographic projection", "view volume", "camera"], ["projection matrix", "view transform", "perspective divide"]),
            ("Line and Polygon Algorithms", ["DDA", "Bresenham line", "scan conversion", "polygon filling", "edge table", "aliasing"], ["line rasterization", "slope cases", "polygon fill"]),
            ("Clipping Algorithms", ["Cohen-Sutherland", "Liang-Barsky", "Sutherland-Hodgman", "window", "viewport"], ["region codes", "line clipping", "polygon clipping"]),
            ("Curves, Surfaces, and Shading", ["Bezier curve", "B-spline", "Phong shading", "Gouraud shading", "illumination", "hidden surface removal"], ["curve control points", "shading model", "visibility"]),
        ],
    ),
    (
        "distributed-systems",
        "Distributed Systems",
        "Medium",
        "Distributed computation, communication, consistency, replication, consensus, and fault tolerance.",
        [
            ("Distributed System Models", ["nodes", "network delay", "partial failure", "synchronous model", "asynchronous model", "failure detector"], ["failure model", "timing assumption", "system model"]),
            ("Communication and RPC", ["message passing", "RPC", "serialization", "idempotency", "at-least-once", "at-most-once", "timeouts"], ["RPC semantics", "retry safety", "message ordering"]),
            ("Clock Synchronization", ["physical clocks", "logical clocks", "Lamport clock", "vector clock", "happens-before", "causal order"], ["timestamp comparison", "causality", "event ordering"]),
            ("Consistency and Replication", ["replication", "strong consistency", "eventual consistency", "quorum", "read repair", "CAP theorem"], ["consistency model", "quorum condition", "replica update"]),
            ("Consensus and Leader Election", ["leader election", "two-phase commit", "Paxos intuition", "Raft intuition", "term", "log replication"], ["leader choice", "commit rule", "fault tolerance"]),
            ("Distributed Storage and MapReduce", ["partitioning", "sharding", "consistent hashing", "MapReduce", "shuffle", "fault recovery"], ["partitioning", "map/reduce flow", "load balance"]),
        ],
    ),
    (
        "cybersecurity-cryptography",
        "Cybersecurity and Cryptography",
        "Medium",
        "Security principles, cryptographic primitives, authentication, web security, and system defense basics.",
        [
            ("Security Foundations", ["confidentiality", "integrity", "availability", "threat model", "attack surface", "risk", "defense in depth"], ["CIA triad", "threat modeling", "risk control"]),
            ("Classical and Symmetric Cryptography", ["substitution", "transposition", "block cipher", "stream cipher", "AES intuition", "modes of operation"], ["encryption mode", "known plaintext", "confusion/diffusion"]),
            ("Public Key Cryptography", ["RSA", "Diffie-Hellman", "elliptic curves", "public key", "private key", "digital signature"], ["key exchange", "RSA property", "signature verification"]),
            ("Hashing and Message Authentication", ["hash function", "collision resistance", "preimage resistance", "MAC", "HMAC", "salt", "password hashing"], ["hash property", "MAC use", "password storage"]),
            ("Authentication and Access Control", ["authentication", "authorization", "MFA", "RBAC", "ABAC", "session token", "OAuth basics"], ["access control", "token lifecycle", "identity proof"]),
            ("Web and Network Security", ["TLS", "XSS", "CSRF", "SQL injection", "CORS", "firewall", "IDS"], ["web vulnerability", "TLS handshake", "input validation"]),
            ("Secure Software Practices", ["secure coding", "dependency risk", "secrets management", "logging", "incident response", "least privilege"], ["secure design", "secret leakage", "privilege control"]),
        ],
    ),
    (
        "cloud-computing-devops",
        "Cloud Computing and DevOps",
        "Medium",
        "Cloud service models, containers, orchestration, CI/CD, observability, and reliable deployment.",
        [
            ("Cloud Service Models", ["IaaS", "PaaS", "SaaS", "public cloud", "private cloud", "hybrid cloud", "shared responsibility"], ["service model", "responsibility split", "deployment model"]),
            ("Virtualization and Containers", ["hypervisor", "VM", "container", "image", "registry", "namespace", "cgroups"], ["VM vs container", "image layer", "isolation"]),
            ("Kubernetes Basics", ["pod", "deployment", "service", "ingress", "configmap", "secret", "autoscaling"], ["pod lifecycle", "service routing", "deployment update"]),
            ("CI/CD Pipelines", ["build", "test", "artifact", "deployment", "rollback", "blue-green", "canary"], ["pipeline stage", "deployment strategy", "rollback"]),
            ("Infrastructure as Code", ["declarative config", "Terraform basics", "state", "drift", "provisioning", "immutable infrastructure"], ["IaC state", "drift detection", "resource dependency"]),
            ("Observability and Reliability", ["logs", "metrics", "traces", "SLO", "SLA", "error budget", "alerting"], ["metric choice", "trace flow", "reliability target"]),
        ],
    ),
    (
        "data-science-big-data",
        "Data Science and Big Data",
        "Medium",
        "Data handling, analytics, pipelines, distributed processing, and practical data-system concepts.",
        [
            ("Data Cleaning and Preparation", ["missing values", "outliers", "normalization", "encoding", "feature scaling", "data validation"], ["data quality", "feature scaling", "outlier handling"]),
            ("Exploratory Data Analysis", ["summary statistics", "correlation", "visualization", "distribution", "skewness", "sampling"], ["statistic selection", "plot interpretation", "correlation"]),
            ("Feature Engineering", ["categorical encoding", "binning", "interaction feature", "text feature", "time feature", "leakage"], ["feature choice", "data leakage", "encoding"]),
            ("Big Data Architecture", ["HDFS", "distributed file system", "Spark", "RDD", "DataFrame", "partition", "lineage"], ["Spark transformation", "partitioning", "fault recovery"]),
            ("Batch and Stream Processing", ["batch job", "stream", "windowing", "event time", "watermark", "Kafka basics", "exactly-once intuition"], ["stream window", "event ordering", "processing guarantee"]),
            ("Data Warehousing and Analytics", ["OLTP", "OLAP", "star schema", "snowflake schema", "fact table", "dimension table", "ETL"], ["schema design", "OLAP query", "ETL flow"]),
        ],
    ),
    (
        "general-aptitude",
        "General Aptitude",
        "High",
        "Verbal, quantitative, analytical, and spatial aptitude for the compulsory GATE GA section.",
        [
            ("Verbal Aptitude", ["grammar", "articles", "prepositions", "sentence correction", "vocabulary", "synonyms", "antonyms"], ["grammar correction", "word meaning", "sentence completion"]),
            ("Reading Comprehension", ["main idea", "inference", "tone", "detail", "summary", "vocabulary in context"], ["passage inference", "detail question", "tone identification"]),
            ("Quantitative Aptitude", ["percentages", "ratio", "average", "profit loss", "time work", "speed distance", "number system"], ["arithmetic", "rate problems", "percentage comparison"]),
            ("Analytical Reasoning", ["arrangements", "blood relations", "directions", "coding decoding", "logical implication", "data interpretation"], ["arrangement puzzle", "direction sense", "logical inference"]),
            ("Spatial Aptitude", ["mirror image", "paper folding", "cube folding", "3D views", "rotation", "patterns"], ["folding/cutting", "3D visualization", "rotation"]),
        ],
    ),
]


SUBJECTS = [
    _subject(
        slug,
        name,
        weight,
        description,
        [
            _topic(
                title,
                index + 1,
                concepts,
                pyq_concepts,
                query=f"GATE CS {name} {title} full lecture",
            )
            for index, (title, concepts, pyq_concepts) in enumerate(topics)
        ],
    )
    for slug, name, weight, description, topics in SUBJECT_SPECS
]


def list_subjects():
    return [
        {
            "slug": subject["slug"],
            "name": subject["name"],
            "exam_weight": subject["exam_weight"],
            "description": subject["description"],
            "topic_count": len(subject["topics"]),
        }
        for subject in SUBJECTS
    ]


def get_subject(slug: str):
    for subject in SUBJECTS:
        if subject["slug"] == slug:
            return {**subject, "topic_count": len(subject["topics"])}
    return None


def all_subjects_detail():
    return [{**subject, "topic_count": len(subject["topics"])} for subject in SUBJECTS]


def apply_learning_overrides(subjects: list[dict[str, Any]], overrides: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not overrides:
        return subjects

    result = deepcopy(subjects)
    subject_overrides = overrides.get("subjects") or {}
    topic_overrides = overrides.get("topics") or {}
    allowed_subject = {"description", "roadmap", "exam_strategy", "milestones", "curated_resources", "exam_weight"}
    allowed_topic = {
        "written_notes",
        "revision_summary",
        "notes_by_language",
        "revision_by_language",
        "formula_sheet",
        "common_mistakes",
        "practice_tasks",
        "study_flow",
        "prerequisites",
        "learning_outcomes",
        "quick_checks",
        "flashcards",
        "interview_prompts",
        "reference_links",
        "video_lectures",
        "worked_examples",
        "memory_hooks",
        "reading_pointers",
        "revision_schedule",
        "mastery_rubric",
    }

    for subject in result:
        subject_patch = subject_overrides.get(subject["slug"]) or {}
        for key, value in subject_patch.items():
            if key in allowed_subject:
                subject[key] = value

        for topic in subject["topics"]:
            topic_key = f"{subject['slug']}:{topic['slug']}"
            topic_patch = topic_overrides.get(topic_key) or {}
            for key, value in topic_patch.items():
                if key in allowed_topic:
                    topic[key] = value
    return result
