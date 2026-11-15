from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import optional_verify_token
from app.core.rag import _get_llm
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(prefix="/audio-study", tags=["audio-study"])

class DialogueLine(BaseModel):
    speaker: str # 'Alex' (Host 1) | 'Sarah' (Host 2)
    role: str # 'explainer' | 'inquisitive'
    text: str

class PodcastEpisode(BaseModel):
    id: str
    title: str
    subject: str
    duration_minutes: float
    description: str
    transcript: List[DialogueLine]

class GeneratePodcastRequest(BaseModel):
    topic: str
    subject: Optional[str] = "Computer Science"

class VoiceQuizQuestion(BaseModel):
    id: str
    subject: str
    voice_prompt: str
    expected_keywords: List[str]
    ideal_spoken_answer: str

PRESET_EPISODES: List[Dict[str, Any]] = [
    {
        "id": "ep_vm",
        "title": "Virtual Memory & The TLB Speed Mystery",
        "subject": "Operating Systems",
        "duration_minutes": 3.5,
        "description": "Alex and Sarah break down why multi-level paging increases memory access time and how the TLB rescues OS performance.",
        "transcript": [
            {
                "speaker": "Sarah",
                "role": "inquisitive",
                "text": "Hey Alex, in GATE Operating Systems questions, students always stumble over Multi-Level Paging. Why do we even use 2-level or 4-level paging if each level requires an extra RAM access?"
            },
            {
                "speaker": "Alex",
                "role": "explainer",
                "text": "Great question, Sarah! If a 32-bit machine has 4KB pages, a single linear page table needs 4 Megabytes of contiguous space per process. With 100 processes, that's 400 Megabytes wasted just on tables! Multi-level paging allows us to keep only the outer table and allocate inner tables on demand."
            },
            {
                "speaker": "Sarah",
                "role": "inquisitive",
                "text": "Ah, so it saves memory! But doesn't a 2-level page table mean two memory lookups just to get one byte of data?"
            },
            {
                "speaker": "Alex",
                "role": "explainer",
                "text": "Exactly—two lookups for the tables plus one for the actual data byte, so three total memory accesses. That's a 300% slowdown! And that is exactly why hardware engineers invented the TLB—Translation Lookaside Buffer. With a 98% TLB hit ratio, Effective Memory Access Time drops right back down close to normal RAM speed!"
            },
            {
                "speaker": "Sarah",
                "role": "inquisitive",
                "text": "And remember the classic GATE exam trap: if the page fault occurs, the TLB hit ratio doesn't even save you—disk access takes milliseconds!"
            }
        ]
    },
    {
        "id": "ep_btree",
        "title": "Why Real Databases Use B+ Trees, Not B-Trees",
        "subject": "Databases (DBMS)",
        "duration_minutes": 4.0,
        "description": "Discover the physical disk storage reasons why MySQL InnoDB and PostgreSQL store indexes as B+ Trees.",
        "transcript": [
            {
                "speaker": "Alex",
                "role": "explainer",
                "text": "Welcome back! Today we are tackling one of the most frequently asked GATE and database systems interview questions: Why do databases use B+ Trees instead of standard B-Trees?"
            },
            {
                "speaker": "Sarah",
                "role": "inquisitive",
                "text": "Right! On paper, B-Trees store data pointers in internal nodes, which sounds like they could find some records faster without going all the way to the leaf nodes."
            },
            {
                "speaker": "Alex",
                "role": "explainer",
                "text": "Yes, but because internal nodes in a B-Tree hold both the key and the record pointer, fewer keys can fit into a single disk block. In a B+ Tree, internal nodes only store keys and block pointers. This gives a B+ Tree a much higher branching factor or fan-out!"
            },
            {
                "speaker": "Sarah",
                "role": "inquisitive",
                "text": "Higher fan-out means shallower tree height! So even for a billion records, the tree is only 3 or 4 levels deep, meaning only 3 or 4 disk I/O operations!"
            },
            {
                "speaker": "Alex",
                "role": "explainer",
                "text": "And second, in a B+ Tree, all leaf nodes are connected via a doubly linked list. So range queries like 'WHERE age BETWEEN 20 AND 30' just traverse sequentially across the leaves without re-traversing the tree!"
            }
        ]
    }
]

VOICE_QUIZ_POOL: List[Dict[str, Any]] = [
    {
        "id": "vq_1",
        "subject": "Operating Systems",
        "voice_prompt": "What are the four necessary and sufficient conditions for deadlock to occur?",
        "expected_keywords": ["mutual exclusion", "hold and wait", "no preemption", "circular wait"],
        "ideal_spoken_answer": "The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait (Coffman conditions)."
    },
    {
        "id": "vq_2",
        "subject": "Computer Networks",
        "voice_prompt": "In the TCP 3-way handshake, what flags are set on each packet exchanged?",
        "expected_keywords": ["syn", "syn-ack", "ack"],
        "ideal_spoken_answer": "First client sends SYN. Server replies with SYN plus ACK. Finally client responds with ACK."
    },
    {
        "id": "vq_3",
        "subject": "Algorithms",
        "voice_prompt": "What is the worst-case time complexity of QuickSelect to find the k-th smallest element?",
        "expected_keywords": ["o(n^2)", "o(n) average"],
        "ideal_spoken_answer": "The worst case is O(n squared) with poor pivot selection, though its average case is linear O(n)."
    }
]

@router.get("/episodes")
def get_episodes():
    return {"episodes": PRESET_EPISODES}

@router.post("/generate", response_model=PodcastEpisode)
async def generate_podcast_dialogue(
    body: GeneratePodcastRequest,
    user_id: Optional[str] = Depends(optional_verify_token)
):
    system_prompt = (
        "You are an expert audio producer creating a conversational 2-host audio podcast script between Alex (Lead Systems Architect) and Sarah (Senior Software Engineer).\n"
        "Explain the requested topic clearly, highlighting real-world intuition and high-yield GATE exam insights.\n"
        "Format as JSON with a list of dialogue items with keys 'speaker' ('Alex' or 'Sarah'), 'role' ('explainer' or 'inquisitive'), and 'text'."
    )

    transcript: List[DialogueLine] = [
        DialogueLine(speaker="Alex", role="explainer", text=f"Welcome to today's focus session on {body.topic}!"),
        DialogueLine(speaker="Sarah", role="inquisitive", text=f"I'm excited to dive in! What's the biggest fundamental takeaway students should know about {body.topic}?"),
        DialogueLine(speaker="Alex", role="explainer", text=f"The most important insight with {body.topic} comes down to efficiency trade-offs and how the computer hardware optimizes data flow."),
        DialogueLine(speaker="Sarah", role="inquisitive", text="And keep an eye out for boundary conditions—that's where GATE test makers love to set traps!")
    ]

    try:
        llm = _get_llm(max_tokens=1000)
        if llm:
            res = await llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Create a 5-6 turn audio dialogue explaining: {body.topic} in {body.subject}.")
            ])
            import re, json
            match = re.search(r"\[\s*\{[\s\S]*\}\s*\]", res.content or "")
            if match:
                raw_list = json.loads(match.group(0))
                transcript = [DialogueLine(**item) for item in raw_list]
    except Exception:
        pass

    return PodcastEpisode(
        id=f"ep_dyn_{abs(hash(body.topic)) % 10000}",
        title=f"Mastering {body.topic}",
        subject=body.subject or "Computer Science",
        duration_minutes=3.2,
        description=f"Audio deep-dive dialogue exploring {body.topic}.",
        transcript=transcript
    )

@router.get("/voice-quiz", response_model=List[VoiceQuizQuestion])
def get_voice_quiz_questions():
    return [VoiceQuizQuestion(**q) for q in VOICE_QUIZ_POOL]
