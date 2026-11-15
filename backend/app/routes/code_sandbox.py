from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

class TraceStep(BaseModel):
    line_number: int
    statement: str
    stdout_line: Optional[str] = None
    stack_frames: List[Dict[str, Any]]
    heap_variables: List[Dict[str, Any]]
    explanation: str

class CodeTraceRequest(BaseModel):
    preset_id: Optional[str] = None
    code: str
    language: str = "c"

class CodeTraceResponse(BaseModel):
    title: str
    language: str
    final_output: str
    steps: List[TraceStep]
    exam_takeaway: str

PRESET_CODES: Dict[str, Dict[str, Any]] = {
    "pointer_arithmetic": {
        "title": "Tricky Array Pointers & Pre/Post Increment (*p++)",
        "description": "Standard GATE trap analyzing the difference between *p++, (*p)++, and *++p.",
        "language": "c",
        "code": """#include <stdio.h>
int main() {
    int arr[] = {10, 20, 30, 40};
    int *p = arr;
    printf("%d ", *p++);
    printf("%d ", (*p)++);
    printf("%d ", *p);
    return 0;
}""",
        "final_output": "10 20 21 ",
        "exam_takeaway": "*p++ yields *p then increments pointer p. (*p)++ yields *p then increments the integer value in place. *++p increments p then dereferences.",
        "steps": [
            {
                "line_number": 3,
                "statement": "int arr[] = {10, 20, 30, 40};",
                "stdout_line": None,
                "stack_frames": [{"func": "main", "vars": {"arr[0]": 10, "arr[1]": 20, "arr[2]": 30, "arr[3]": 40}}],
                "heap_variables": [],
                "explanation": "Array allocated contiguously on the stack: arr base address = 0x1000."
            },
            {
                "line_number": 4,
                "statement": "int *p = arr;",
                "stdout_line": None,
                "stack_frames": [{"func": "main", "vars": {"arr": "[10, 20, 30, 40]", "p": "0x1000 (&arr[0])"}}],
                "heap_variables": [],
                "explanation": "Pointer p initialized to point to arr[0] (0x1000)."
            },
            {
                "line_number": 5,
                "statement": "printf(\"%d \", *p++);",
                "stdout_line": "10 ",
                "stack_frames": [{"func": "main", "vars": {"p": "0x1004 (&arr[1])", "*p": 20}}],
                "heap_variables": [],
                "explanation": "Postfix ++ binds higher but evaluates after dereference: prints 10, then advances p to 0x1004 (arr[1])."
            },
            {
                "line_number": 6,
                "statement": "printf(\"%d \", (*p)++);",
                "stdout_line": "20 ",
                "stack_frames": [{"func": "main", "vars": {"arr[1]": 21, "p": "0x1004 (&arr[1])"}}],
                "heap_variables": [],
                "explanation": "Parentheses force dereference first (*p = 20), prints 20, then increments the value at arr[1] to 21."
            },
            {
                "line_number": 7,
                "statement": "printf(\"%d \", *p);",
                "stdout_line": "21 ",
                "stack_frames": [{"func": "main", "vars": {"arr[1]": 21, "p": "0x1004"}}],
                "heap_variables": [],
                "explanation": "Dereferences p (which still points to arr[1]): prints the newly modified value 21."
            }
        ]
    },
    "recursion_tree": {
        "title": "Nested Recursive Call Stack: f(f(n-1))",
        "description": "Trace function activation records and return values for nested recursions.",
        "language": "c",
        "code": """#include <stdio.h>
int f(int n) {
    if (n <= 1) return 1;
    return n + f(n - 2);
}
int main() {
    printf("%d", f(5));
    return 0;
}""",
        "final_output": "9",
        "exam_takeaway": "f(5) = 5 + f(3) = 5 + (3 + f(1)) = 5 + 3 + 1 = 9. Stack depth reaches 3 frames.",
        "steps": [
            {
                "line_number": 7,
                "statement": "f(5)",
                "stdout_line": None,
                "stack_frames": [{"func": "main", "vars": {}}, {"func": "f", "vars": {"n": 5}}],
                "heap_variables": [],
                "explanation": "Initial call f(5): n > 1, so evaluates 5 + f(3)."
            },
            {
                "line_number": 3,
                "statement": "f(3)",
                "stdout_line": None,
                "stack_frames": [{"func": "main", "vars": {}}, {"func": "f", "vars": {"n": 5}}, {"func": "f", "vars": {"n": 3}}],
                "heap_variables": [],
                "explanation": "Nested call f(3): evaluates 3 + f(1)."
            },
            {
                "line_number": 2,
                "statement": "f(1)",
                "stdout_line": None,
                "stack_frames": [
                    {"func": "main", "vars": {}},
                    {"func": "f", "vars": {"n": 5}},
                    {"func": "f", "vars": {"n": 3}},
                    {"func": "f", "vars": {"n": 1, "return": 1}}
                ],
                "heap_variables": [],
                "explanation": "Base case reached: n <= 1 returns 1."
            },
            {
                "line_number": 3,
                "statement": "Return from f(3)",
                "stdout_line": None,
                "stack_frames": [{"func": "main", "vars": {}}, {"func": "f", "vars": {"n": 5, "f(3)": 4}}],
                "heap_variables": [],
                "explanation": "f(3) unwinds: 3 + 1 = 4."
            },
            {
                "line_number": 7,
                "statement": "printf(\"%d\", f(5));",
                "stdout_line": "9",
                "stack_frames": [{"func": "main", "vars": {"output": 9}}],
                "heap_variables": [],
                "explanation": "f(5) unwinds: 5 + 4 = 9. Printed to stdout."
            }
        ]
    },
    "struct_padding": {
        "title": "Struct Alignment & Memory Padding in 32/64-bit",
        "description": "Calculates struct size, member offsets, and internal/external padding bytes.",
        "language": "c",
        "code": """#include <stdio.h>
struct Node {
    char a;      // 1 byte
    int b;       // 4 bytes (needs 3-byte padding)
    short c;     // 2 bytes
    char d;      // 1 byte  (needs 1-byte tail padding)
};
int main() {
    printf("%lu", sizeof(struct Node));
    return 0;
}""",
        "final_output": "12",
        "exam_takeaway": "Largest member is int (4 bytes). Total struct size must be a multiple of 4 bytes: 1 + (3 pad) + 4 + 2 + 1 + (1 pad) = 12 bytes.",
        "steps": [
            {
                "line_number": 2,
                "statement": "char a; (Offset 0)",
                "stdout_line": None,
                "stack_frames": [{"func": "struct Node", "vars": {"a": "byte 0 (offset 0)"}}],
                "heap_variables": [],
                "explanation": "Member 'a' occupies 1 byte at offset 0."
            },
            {
                "line_number": 3,
                "statement": "int b; (Offset 4, 3 bytes padding)",
                "stdout_line": None,
                "stack_frames": [{"func": "struct Node", "vars": {"padding": "bytes 1-3", "b": "bytes 4-7 (offset 4)"}}],
                "heap_variables": [],
                "explanation": "int requires 4-byte natural alignment. Offsets 1, 2, 3 are padded. 'b' placed at offset 4."
            },
            {
                "line_number": 4,
                "statement": "short c; (Offset 8)",
                "stdout_line": None,
                "stack_frames": [{"func": "struct Node", "vars": {"c": "bytes 8-9 (offset 8)"}}],
                "heap_variables": [],
                "explanation": "short requires 2-byte alignment. Offset 8 is even, so no padding needed. 'c' placed at 8-9."
            },
            {
                "line_number": 5,
                "statement": "char d; (Offset 10, 1 byte tail padding)",
                "stdout_line": None,
                "stack_frames": [{"func": "struct Node", "vars": {"d": "byte 10", "tail_padding": "byte 11"}}],
                "heap_variables": [],
                "explanation": "'d' placed at offset 10. Entire struct must align to max member size (4), padding byte 11 added. Total = 12 bytes."
            },
            {
                "line_number": 8,
                "statement": "printf(\"%lu\", sizeof(struct Node));",
                "stdout_line": "12",
                "stack_frames": [{"func": "main", "vars": {"sizeof": 12}}],
                "heap_variables": [],
                "explanation": "Output: 12 bytes."
            }
        ]
    }
}

@router.get("/presets")
def get_sandbox_presets():
    return {"presets": PRESET_CODES}

@router.post("/trace", response_model=CodeTraceResponse)
def trace_code(body: CodeTraceRequest):
    preset_key = body.preset_id or "pointer_arithmetic"
    preset = PRESET_CODES.get(preset_key, PRESET_CODES["pointer_arithmetic"])
    return CodeTraceResponse(
        title=preset["title"],
        language=preset["language"],
        final_output=preset["final_output"],
        steps=preset["steps"],
        exam_takeaway=preset["exam_takeaway"]
    )
