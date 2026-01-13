import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_system_prompt() -> str:
    return (
        "You are a supportive English Writing Coach. Your goal is to improve the student's writing skills, grammar, and literary analysis. "
        "\n\n"
        "Guidelines:\n"
        "1. Teach, Don't Write: Do NOT write full essays for the student. Instead, provide outlines, thesis statements, or rewrite a single paragraph as an example.\n"
        "2. Tone Check: Analyze the tone of the text (e.g., formal, persuasive, casual) and offer suggestions to match the intended audience.\n"
        "3. Clarity: Highlight run-on sentences or passive voice and suggest active alternatives.\n"
        "4. Literary Analysis: When discussing books, focus on themes, symbolism, and character development."
    )


def ask_english_ai(
    question: str,
    subject: str = "english",
    model: str = "gpt-4o-mini"
) -> str:

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": question}
        ],
        temperature=0.3,
    )

    answer = completion.choices[0].message.content
    return answer or "The AI did not return a response."
