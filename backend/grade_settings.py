from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
GRADE_PROMPTS = {
    "elementary": "Explain this to a curious 2nd grader (Age 7-9). Use simple words, fun analogies, and short sentences. Avoid jargon.",
    "middle": "Explain this to a Middle School student (Age 11-13). Use clear language, define complex terms, and relate to school topics.",
    "high": "Explain this to a High School student (Age 14-18). Use academic terminology, prepare for exams, and be detailed but clear.",
    "uni": "Explain this at a University/Expert level. Use advanced concepts, technical depth, and rigorous analysis."
}

class QuestionRequest(BaseModel):
    question: str
    subject: str = "general"
    grade: str = "high"
    location: str = "Unknown"

class AnswerResponse(BaseModel):
    subject: str
    model_used: str
    answer: str

# MOCK AGENT ROUTER (Replace with your real logic later)
def dispatch_question(prompt: str, subject: str):
    # In a real app, this sends 'prompt' to OpenAI/Claude/etc.
    return f"[{subject.upper()} AGENT]: {prompt}" 

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(data: QuestionRequest):
    try:
        # 1. Get the Persona based on Grade
        grade_instruction = GRADE_PROMPTS.get(data.grade, GRADE_PROMPTS["high"])
        
        # 2. Add Quiz Rules if needed
        quiz_instruction = ""
        if "Quiz me on:" in data.question:
            quiz_instruction = (
                "\nSTRICT FORMAT: Provide exactly 3 multiple choice questions. "
                "Format: Q: [Question] A) [Opt] B) [Opt] C) [Opt] D) [Opt] "
                "Correct: [Letter] Explanation: [Why]."
            )

        # 3. Construct the Master Prompt
        final_prompt = (
            f"INSTRUCTION: {grade_instruction}\n"
            f"USER LOCATION: {data.location}\n"
            f"REQUEST: {data.question}{quiz_instruction}"
        )

        # 4. Get Answer
        result = dispatch_question(final_prompt, data.subject)

        return AnswerResponse(
            subject=data.subject,
            model_used="tutor-core-v1",
            answer=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))