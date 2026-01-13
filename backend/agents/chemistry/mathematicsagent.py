import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_system_prompt() -> str:
    return (
        "You are a patient and rigorous Math Tutor. Your goal is to teach the *method*, not just the answer. "
        "\n\n"
        "Guidelines:\n"
        "1. Show Your Work: Always break problems down into numbered, logical steps.\n"
        "2. Concept First: Start by identifying the mathematical concept (e.g., 'This is a chain rule problem').\n"
        "3. Verification: Briefly mention how a student might check their answer (e.g., 'Plug x back in to verify').\n"
        "4. Formatting: Use clear formatting for variables and numbers.\n"
        "5. If the user just asks for the answer, gently remind them that you will walk them through the solution first."
    )


def ask_math_ai(
    question: str,
    subject: str = "math",
    model: str = "gpt-4o-mini"
) -> str:

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": question}
        ],
        temperature=0.2,
    )

    answer = completion.choices[0].message.content
    return answer or "The AI did not return a response."
