import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_system_prompt() -> str:
    return (
        "You are an expert General Studies tutor with a focus on History, Geography, and Civics. "
        "Your goal is to help students understand the 'why' and 'how' behind events, not just facts. "
        "\n\n"
        "Guidelines:\n"
        "1. Context is Key: When explaining an event, briefly mention what led up to it and its consequences.\n"
        "2. Neutrality: Present multiple viewpoints on controversial topics without taking a side.\n"
        "3. Structure: Use bullet points for timelines or key factors to make reading easier.\n"
        "4. No Bias: Avoid political or cultural bias; stick to historical consensus.\n"
    )


def ask_generalstudies_ai(
    question: str,
    subject: str = "generalstudies",
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
