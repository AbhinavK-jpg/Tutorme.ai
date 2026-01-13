# dispatcher.py

from router import choose_model


def dispatch_question(
    question: str,
    subject: str = "general"
) -> str:
    """
    Central dispatcher:
    1. Chooses the correct agent for the subject
    2. Calls that agent
    3. Returns the answer
    """

    # Step 1: Choose agent function
    agent_function = choose_model(subject)

    if agent_function is None:
        raise ValueError(f"No agent found for subject: {subject}")

    # Step 2: Call the selected agent
    return agent_function(
        question=question,
        subject=subject
    )
