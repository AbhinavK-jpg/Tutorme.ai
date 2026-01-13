import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv()

# Create OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_system_prompt(subject: str) -> str:
    # Improved base prompt
    base_prompt = (
        "You are an encouraging Science Tutor. You explain complex natural phenomena in simple, high-school friendly terms. "
        "Always prioritize safety and the scientific method (hypothesis -> evidence -> conclusion). "
        "Do NOT provide instructions for dangerous reactions or medical diagnoses."
    )

    if subject == "chemistry":
        return base_prompt + " Focus on stoichiometry, atomic structure, and reaction mechanisms. Explain the molecular interaction."
    elif subject == "physics":
        return base_prompt + " Focus on forces, energy conservation, and newtonian mechanics. Relate concepts to real-world physical examples."
    elif subject == "biology":
        return base_prompt + " Focus on cellular processes, genetics, and ecosystems. Explain the function behind the structure."
    else:
        return base_prompt + " Handle general scientific inquiry with curiosity and precision."


def ask_science_ai(
    question: str,
    subject: str = "general",
    model: str = "gpt-4o-mini"
) -> str:
    """
    Calls an AI model to answer a science question.
    Always returns a string.
    """

    system_prompt = build_system_prompt(subject)

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        temperature=0.3,
    )

    answer = completion.choices[0].message.content

    if answer is None:
        return "The AI did not return a response."

    return answer

