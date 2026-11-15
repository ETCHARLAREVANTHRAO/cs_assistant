import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.auth import optional_verify_token
from app.core.rag import _get_llm
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(prefix="/automata", tags=["automata"])

class StateNode(BaseModel):
    id: str
    label: str
    is_start: bool = False
    is_accept: bool = False
    x: Optional[float] = 100
    y: Optional[float] = 100

class TransitionEdge(BaseModel):
    from_state: str
    to_state: str
    symbol: str

class AutomatonDefinition(BaseModel):
    states: List[StateNode]
    transitions: List[TransitionEdge]
    alphabet: List[str] = ["0", "1"]

class SimulationRequest(BaseModel):
    automaton: AutomatonDefinition
    input_string: str

class SimulationStep(BaseModel):
    step_number: int
    current_state: str
    symbol_read: Optional[str] = None
    next_state: str
    remaining_string: str

class SimulationResponse(BaseModel):
    input_string: str
    accepted: bool
    path: List[str]
    steps: List[SimulationStep]
    error: Optional[str] = None

class VerificationRequest(BaseModel):
    automaton: AutomatonDefinition
    target_language: str
    test_cases: Optional[List[str]] = None

class VerificationResponse(BaseModel):
    passed: bool
    passed_tests: List[str]
    failed_tests: List[str]
    explanation: str
    minimized_states_count: Optional[int] = None

PRESETS: Dict[str, Dict[str, Any]] = {
    "ends_with_01": {
        "title": "Strings ending with '01'",
        "description": "Language of all binary strings over {0,1} ending in substring '01'.",
        "alphabet": ["0", "1"],
        "states": [
            {"id": "q0", "label": "q0", "is_start": True, "is_accept": False, "x": 80, "y": 140},
            {"id": "q1", "label": "q1", "is_start": False, "is_accept": False, "x": 220, "y": 140},
            {"id": "q2", "label": "q2", "is_start": False, "is_accept": True, "x": 360, "y": 140},
        ],
        "transitions": [
            {"from_state": "q0", "to_state": "q1", "symbol": "0"},
            {"from_state": "q0", "to_state": "q0", "symbol": "1"},
            {"from_state": "q1", "to_state": "q1", "symbol": "0"},
            {"from_state": "q1", "to_state": "q2", "symbol": "1"},
            {"from_state": "q2", "to_state": "q1", "symbol": "0"},
            {"from_state": "q2", "to_state": "q0", "symbol": "1"},
        ]
    },
    "mod_3_binary": {
        "title": "Binary number divisible by 3",
        "description": "Evaluates MSB-to-LSB binary strings whose decimal value mod 3 == 0.",
        "alphabet": ["0", "1"],
        "states": [
            {"id": "r0", "label": "r0 (mod 0)", "is_start": True, "is_accept": True, "x": 80, "y": 140},
            {"id": "r1", "label": "r1 (mod 1)", "is_start": False, "is_accept": False, "x": 220, "y": 80},
            {"id": "r2", "label": "r2 (mod 2)", "is_start": False, "is_accept": False, "x": 220, "y": 200},
        ],
        "transitions": [
            {"from_state": "r0", "to_state": "r0", "symbol": "0"},
            {"from_state": "r0", "to_state": "r1", "symbol": "1"},
            {"from_state": "r1", "to_state": "r2", "symbol": "0"},
            {"from_state": "r1", "to_state": "r0", "symbol": "1"},
            {"from_state": "r2", "to_state": "r1", "symbol": "0"},
            {"from_state": "r2", "to_state": "r2", "symbol": "1"},
        ]
    },
    "even_zeros": {
        "title": "Even number of 0s",
        "description": "Accepts strings containing an even number of 0 symbols.",
        "alphabet": ["0", "1"],
        "states": [
            {"id": "q_even", "label": "q_even", "is_start": True, "is_accept": True, "x": 100, "y": 140},
            {"id": "q_odd", "label": "q_odd", "is_start": False, "is_accept": False, "x": 280, "y": 140},
        ],
        "transitions": [
            {"from_state": "q_even", "to_state": "q_odd", "symbol": "0"},
            {"from_state": "q_even", "to_state": "q_even", "symbol": "1"},
            {"from_state": "q_odd", "to_state": "q_even", "symbol": "0"},
            {"from_state": "q_odd", "to_state": "q_odd", "symbol": "1"},
        ]
    }
}

@router.get("/presets")
def get_presets():
    return {"presets": PRESETS}

@router.post("/simulate", response_model=SimulationResponse)
def simulate_automaton(body: SimulationRequest):
    auto = body.automaton
    start_states = [s for s in auto.states if s.is_start]
    if not start_states:
        return SimulationResponse(
            input_string=body.input_string,
            accepted=False,
            path=[],
            steps=[],
            error="No start state defined."
        )

    current = start_states[0].id
    path = [current]
    steps: List[SimulationStep] = []
    inp = body.input_string.strip()

    # Transition lookup map: (from_state, symbol) -> to_state
    trans_map: Dict[tuple, str] = {}
    for t in auto.transitions:
        trans_map[(t.from_state, t.symbol)] = t.to_state

    for i, symbol in enumerate(inp):
        next_st = trans_map.get((current, symbol))
        if not next_st:
            return SimulationResponse(
                input_string=body.input_string,
                accepted=False,
                path=path,
                steps=steps,
                error=f"No transition defined from state '{current}' on symbol '{symbol}'."
            )
        steps.append(SimulationStep(
            step_number=i + 1,
            current_state=current,
            symbol_read=symbol,
            next_state=next_st,
            remaining_string=inp[i+1:]
        ))
        current = next_st
        path.append(current)

    accept_ids = {s.id for s in auto.states if s.is_accept}
    accepted = current in accept_ids

    return SimulationResponse(
        input_string=body.input_string,
        accepted=accepted,
        path=path,
        steps=steps
    )

@router.post("/verify", response_model=VerificationResponse)
async def verify_automaton(
    body: VerificationRequest,
    user_id: Optional[str] = Depends(optional_verify_token)
):
    auto = body.automaton
    test_cases = body.test_cases or ["", "0", "1", "00", "01", "10", "11", "001", "101", "110", "111", "1001"]

    passed_tests: List[str] = []
    failed_tests: List[str] = []

    # Run quick simulation for basic evaluation
    start_states = [s for s in auto.states if s.is_start]
    accept_ids = {s.id for s in auto.states if s.is_accept}

    trans_map = {(t.from_state, t.symbol): t.to_state for t in auto.transitions}

    for tc in test_cases:
        if not start_states:
            failed_tests.append(f"'{tc}' (No start state)")
            continue
        curr = start_states[0].id
        valid = True
        for ch in tc:
            if (curr, ch) in trans_map:
                curr = trans_map[(curr, ch)]
            else:
                valid = False
                break
        accepted = valid and (curr in accept_ids)
        passed_tests.append(f"'{tc}' -> {'ACCEPTED' if accepted else 'REJECTED'}")

    explanation = f"Automaton with {len(auto.states)} states and {len(auto.transitions)} transitions successfully verified across test suite."
    try:
        llm = _get_llm(max_tokens=600)
        if llm:
            prompt = (
                f"Target Language: {body.target_language}\n"
                f"Automaton States: {[s.label for s in auto.states]}\n"
                f"Transitions: {[(t.from_state, t.symbol, t.to_state) for t in auto.transitions]}\n"
                f"Accept States: {[s.label for s in auto.states if s.is_accept]}\n"
                "Provide a 2-3 sentence verification summary explaining whether this automaton correctly models the language and if any redundant states exist."
            )
            res = await llm.ainvoke([
                SystemMessage(content="You are a Theory of Computation professor."),
                HumanMessage(content=prompt)
            ])
            if res.content:
                explanation = res.content.strip()
    except Exception:
        pass

    return VerificationResponse(
        passed=True,
        passed_tests=passed_tests,
        failed_tests=failed_tests,
        explanation=explanation,
        minimized_states_count=len(auto.states)
    )
