import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI  # Import OpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


from dotenv import load_dotenv


# This looks for the .env file and loads the variables
load_dotenv()

# This pulls the key from the .env file
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# --- CONFIGURATION ---
GRADE_PROMPTS = {
    "elementary": "You are a friendly tutor for a 2nd grader (Age 7-9). Use simple words, fun analogies, and short sentences. Avoid jargon.",
    "middle": "You are a tutor for a Middle School student (Age 11-13). Use clear language, define complex terms, and relate to school topics.",
    "high": "You are a tutor for a High School student (Age 14-18). Use academic terminology, prepare for exams, and be detailed but clear.",
    "uni": "You are a University Professor. Use advanced concepts, technical depth, and rigorous analysis."
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

# --- 2. REAL AI DISPATCHER ---
def dispatch_question(system_instruction: str, user_question: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # or "gpt-3.5-turbo" or "gpt-4"
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_question}
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI Error: {str(e)}"

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(data: QuestionRequest):
    try:
        # 1. Get Grade Persona
        grade_instruction = GRADE_PROMPTS.get(data.grade, GRADE_PROMPTS["high"])
        
        # 2. Add Quiz Rules if needed
        # We need strict formatting so the frontend can split the text into buttons
        quiz_instruction = ""
        if "Quiz me on:" in data.question:
            quiz_instruction = (
                "\nIMPORTANT: You are generating a quiz. "
                "You must strictly follow this format for exactly 3 questions:\n\n"
                "Q: [The Question Text Here]\n"
                "A) [Option 1]\n"
                "B) [Option 2]\n"
                "C) [Option 3]\n"
                "D) [Option 4]\n"
                "Correct: [The Letter]\n"
                "Explanation: [A short explanation of why it is correct]\n\n"
                "Do not add intro text. Just start with 'Q:'."
            )

        # 3. Construct System Prompt
        system_prompt = (
            f"{grade_instruction}\n"
            f"You are an expert in {data.subject}.\n"
            f"User Location: {data.location}.\n"
            f"{quiz_instruction}"
        )

        # 4. Call Real AI
        result = dispatch_question(system_prompt, data.question)

        return AnswerResponse(
            subject=data.subject,
            model_used="gpt-4o-mini",
            answer=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))