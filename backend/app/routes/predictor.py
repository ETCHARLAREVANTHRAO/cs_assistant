from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/predictor", tags=["predictor"])

COLLEGE_CUTOFFS_DATA: List[Dict[str, Any]] = [
    # Tier 1 IITs
    {
        "id": "iitb_cse",
        "institute": "IIT Bombay",
        "program": "M.Tech Computer Science & Engg (TA)",
        "tier": "Tier-1 IIT",
        "location": "Mumbai, Maharashtra",
        "general_cutoff": 750,
        "obc_cutoff": 680,
        "sc_cutoff": 500,
        "st_cutoff": 420,
        "ews_cutoff": 720,
        "avg_ctc": "₹28.5 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iitd_cse",
        "institute": "IIT Delhi",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Tier-1 IIT",
        "location": "New Delhi",
        "general_cutoff": 760,
        "obc_cutoff": 690,
        "sc_cutoff": 510,
        "st_cutoff": 425,
        "ews_cutoff": 730,
        "avg_ctc": "₹27.0 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iitm_cse",
        "institute": "IIT Madras",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Tier-1 IIT",
        "location": "Chennai, Tamil Nadu",
        "general_cutoff": 745,
        "obc_cutoff": 675,
        "sc_cutoff": 490,
        "st_cutoff": 410,
        "ews_cutoff": 715,
        "avg_ctc": "₹26.4 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iitk_cse",
        "institute": "IIT Kanpur",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Tier-1 IIT",
        "location": "Kanpur, Uttar Pradesh",
        "general_cutoff": 735,
        "obc_cutoff": 665,
        "sc_cutoff": 485,
        "st_cutoff": 400,
        "ews_cutoff": 710,
        "avg_ctc": "₹25.8 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iisc_cds",
        "institute": "IISc Bangalore",
        "program": "M.Tech Computational & Data Science (CDS)",
        "tier": "Tier-1 Research",
        "location": "Bengaluru, Karnataka",
        "general_cutoff": 720,
        "obc_cutoff": 660,
        "sc_cutoff": 480,
        "st_cutoff": 395,
        "ews_cutoff": 700,
        "avg_ctc": "₹31.0 LPA",
        "coap_rounds": 4,
        "interview_required": True
    },
    {
        "id": "iitkgp_cse",
        "institute": "IIT Kharagpur",
        "program": "M.Tech Computer Science & Data Processing",
        "tier": "Tier-1 IIT",
        "location": "Kharagpur, West Bengal",
        "general_cutoff": 725,
        "obc_cutoff": 650,
        "sc_cutoff": 475,
        "st_cutoff": 390,
        "ews_cutoff": 695,
        "avg_ctc": "₹24.0 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iith_ai",
        "institute": "IIT Hyderabad",
        "program": "M.Tech Artificial Intelligence",
        "tier": "Top New IIT",
        "location": "Hyderabad, Telangana",
        "general_cutoff": 710,
        "obc_cutoff": 640,
        "sc_cutoff": 460,
        "st_cutoff": 380,
        "ews_cutoff": 685,
        "avg_ctc": "₹24.5 LPA",
        "coap_rounds": 5,
        "interview_required": True
    },
    {
        "id": "iitr_cse",
        "institute": "IIT Roorkee",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Tier-1 IIT",
        "location": "Roorkee, Uttarakhand",
        "general_cutoff": 705,
        "obc_cutoff": 635,
        "sc_cutoff": 455,
        "st_cutoff": 375,
        "ews_cutoff": 680,
        "avg_ctc": "₹23.5 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    {
        "id": "iitg_cse",
        "institute": "IIT Guwahati",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Tier-1 IIT",
        "location": "Guwahati, Assam",
        "general_cutoff": 695,
        "obc_cutoff": 625,
        "sc_cutoff": 440,
        "st_cutoff": 365,
        "ews_cutoff": 670,
        "avg_ctc": "₹22.0 LPA",
        "coap_rounds": 5,
        "interview_required": False
    },
    # Top NITs & IIITs
    {
        "id": "nitt_cse",
        "institute": "NIT Trichy",
        "program": "M.Tech Computer Science & Engg",
        "tier": "Top NIT",
        "location": "Tiruchirappalli, Tamil Nadu",
        "general_cutoff": 650,
        "obc_cutoff": 590,
        "sc_cutoff": 410,
        "st_cutoff": 340,
        "ews_cutoff": 630,
        "avg_ctc": "₹19.5 LPA",
        "coap_rounds": 3,
        "interview_required": False
    },
    {
        "id": "nitk_cse",
        "institute": "NIT Surathkal",
        "program": "M.Tech Information Technology & CSE",
        "tier": "Top NIT",
        "location": "Surathkal, Karnataka",
        "general_cutoff": 645,
        "obc_cutoff": 585,
        "sc_cutoff": 405,
        "st_cutoff": 335,
        "ews_cutoff": 625,
        "avg_ctc": "₹18.8 LPA",
        "coap_rounds": 3,
        "interview_required": False
    },
    {
        "id": "iiitb_cse",
        "institute": "IIIT Bangalore",
        "program": "M.Tech Computer Science",
        "tier": "Top IIIT",
        "location": "Bengaluru, Karnataka",
        "general_cutoff": 630,
        "obc_cutoff": 570,
        "sc_cutoff": 395,
        "st_cutoff": 330,
        "ews_cutoff": 610,
        "avg_ctc": "₹26.0 LPA",
        "coap_rounds": 3,
        "interview_required": False
    }
]

PSU_CUTOFFS_DATA: List[Dict[str, Any]] = [
    {
        "psu_name": "BARC (Bhabha Atomic Research Centre)",
        "role": "Scientific Officer (OCES/DGFS)",
        "general_cutoff": 740,
        "obc_cutoff": 680,
        "sc_cutoff": 520,
        "st_cutoff": 450,
        "pay_scale": "Level 10 (₹56,100 - ₹1,77,500) + Allowances (~₹18 LPA)",
        "selection_process": "GATE Score Shortlist + Rigorous Technical Interview"
    },
    {
        "psu_name": "DRDO (Defence Research & Dev Organisation)",
        "role": "Scientist 'B'",
        "general_cutoff": 730,
        "obc_cutoff": 670,
        "sc_cutoff": 510,
        "st_cutoff": 440,
        "pay_scale": "Level 10 (₹56,100) (~₹16.5 LPA)",
        "selection_process": "GATE 80% weightage + 20% Personal Interview"
    },
    {
        "psu_name": "ONGC (Oil and Natural Gas Corp)",
        "role": "Executive Trainee (Programming / IT)",
        "general_cutoff": 760,
        "obc_cutoff": 710,
        "sc_cutoff": 550,
        "st_cutoff": 480,
        "pay_scale": "E-1 Level (₹60,000 - ₹1,80,000) (~₹22 LPA CTC)",
        "selection_process": "GATE 60% + Qualification 25% + Interview 15%"
    },
    {
        "psu_name": "IOCL (Indian Oil Corporation Ltd)",
        "role": "Officer / Engineer (Information Systems)",
        "general_cutoff": 750,
        "obc_cutoff": 700,
        "sc_cutoff": 540,
        "st_cutoff": 470,
        "pay_scale": "Grade A (₹50,000 - ₹1,60,000) (~₹17.5 LPA CTC)",
        "selection_process": "GATE 85% + GD/GT 5% + Interview 10%"
    },
    {
        "psu_name": "NTPC Limited",
        "role": "Executive Trainee (IT & Systems)",
        "general_cutoff": 715,
        "obc_cutoff": 660,
        "sc_cutoff": 505,
        "st_cutoff": 430,
        "pay_scale": "E-1 Level (₹40,000 - ₹1,40,000) (~₹15 LPA CTC)",
        "selection_process": "GATE Score Shortlist + GD + PI"
    }
]


class PredictorRequest(BaseModel):
    gate_score: int = Field(..., ge=100, le=1000)
    gate_marks: Optional[float] = None
    category: str = "general"  # "general", "obc", "ews", "sc", "st"
    preferred_tier: Optional[str] = None


class CollegePrediction(BaseModel):
    institute: str
    program: str
    tier: str
    location: str
    chance: str  # "high", "medium", "low"
    cutoff_score: int
    user_score: int
    avg_ctc: str
    interview_required: bool


class PsuPrediction(BaseModel):
    psu_name: str
    role: str
    chance: str  # "high", "medium", "low"
    cutoff_score: int
    pay_scale: str
    selection_process: str


class PredictorResponse(BaseModel):
    user_score: int
    category: str
    safe_colleges: List[CollegePrediction]
    target_colleges: List[CollegePrediction]
    dream_colleges: List[CollegePrediction]
    psu_opportunities: List[PsuPrediction]
    total_matches: int


@router.post("/predict", response_model=PredictorResponse)
async def predict_admissions_endpoint(body: PredictorRequest):
    """Calculates admission chances across IITs/NITs and PSU shortlists based on GATE score & category."""
    cat_key = body.category.lower().strip()
    score = body.gate_score

    def get_cat_cutoff(item: dict) -> int:
        if cat_key == "obc":
            return item.get("obc_cutoff", item.get("general_cutoff", 700))
        if cat_key == "ews":
            return item.get("ews_cutoff", item.get("general_cutoff", 700))
        if cat_key == "sc":
            return item.get("sc_cutoff", item.get("general_cutoff", 500))
        if cat_key == "st":
            return item.get("st_cutoff", item.get("general_cutoff", 420))
        return item.get("general_cutoff", 720)

    safe: List[CollegePrediction] = []
    target: List[CollegePrediction] = []
    dream: List[CollegePrediction] = []

    for c in COLLEGE_CUTOFFS_DATA:
        cutoff = get_cat_cutoff(c)
        diff = score - cutoff

        if diff >= 25:
            chance = "high"
        elif diff >= -20:
            chance = "medium"
        else:
            chance = "low"

        pred = CollegePrediction(
            institute=c["institute"],
            program=c["program"],
            tier=c["tier"],
            location=c["location"],
            chance=chance,
            cutoff_score=cutoff,
            user_score=score,
            avg_ctc=c["avg_ctc"],
            interview_required=c["interview_required"]
        )

        if chance == "high":
            safe.append(pred)
        elif chance == "medium":
            target.append(pred)
        else:
            dream.append(pred)

    psus: List[PsuPrediction] = []
    for p in PSU_CUTOFFS_DATA:
        p_cutoff = get_cat_cutoff(p)
        diff = score - p_cutoff
        if diff >= 20:
            p_chance = "high"
        elif diff >= -25:
            p_chance = "medium"
        else:
            p_chance = "low"

        psus.append(PsuPrediction(
            psu_name=p["psu_name"],
            role=p["role"],
            chance=p_chance,
            cutoff_score=p_cutoff,
            pay_scale=p["pay_scale"],
            selection_process=p["selection_process"]
        ))

    return PredictorResponse(
        user_score=score,
        category=body.category.upper(),
        safe_colleges=safe,
        target_colleges=target,
        dream_colleges=dream,
        psu_opportunities=psus,
        total_matches=len(safe) + len(target)
    )
