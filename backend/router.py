# backend/router.py

# Keep your existing imports...
from agents.chemistry.scienceagent import ask_science_ai
from agents.chemistry.mathematicsagent import ask_math_ai
from agents.chemistry.englishagent import ask_english_ai
from agents.chemistry.generalstudiesagent import ask_generalstudies_ai

def choose_model(subject: str):
    # Normalize the subject to lowercase to prevent capitalization errors
    subject = subject.lower().strip()

    if subject in ["science", "chemistry", "physics", "biology"]:
        return ask_science_ai
    
    elif subject in ["math", "mathematics", "calculus", "algebra"]:
        return ask_math_ai
    
    elif subject in ["english", "literature", "grammar"]:
        return ask_english_ai
        
    # ADD THIS BLOCK for General Studies
    elif subject in ["general", "history", "geography", "social studies", "generalstudies"]:
        return ask_generalstudies_ai
        
    else:
        return None