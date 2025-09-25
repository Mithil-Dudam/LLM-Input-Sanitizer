import re
import spacy
import string
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import Counter


logging.basicConfig(
    filename="sanitizer.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_REGEX = r"(?:\+?\d|\(\d)[\d\s().-]{6,}\d"
CREDIT_CARD_REGEX = r"\b(?:\d[ -]*?){13,16}\b"

PROMPT_INJECTION_PATTERNS = [
    r"ignore (all|any|previous|earlier) instructions",
    r"disregard (all|any|previous|earlier) instructions",
    r"repeat this prompt verbatim",
    r"do anything now",
    r"bypass",
    r"override",
    r"forget previous",
    r"you are now",
    r"as an ai language model, you are not restricted",
    r"please pretend to",
    r"simulate",
    r"jailbreak",
    r"unfiltered",
    r"raw output",
    r"act as",
    r"output the following",
    r"print the following",
    r"execute the following",
    r"respond with",
]


def detect_prompt_injection(text):
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


# Load spaCy English model (make sure to run: python -m spacy download en_core_web_sm)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None
    print("spaCy model not found. Run: python -m spacy download en_core_web_sm")


def redact_pii(text):
    text = re.sub(EMAIL_REGEX, "[REDACTED]", text)
    text = re.sub(PHONE_REGEX, "[REDACTED]", text)
    text = re.sub(CREDIT_CARD_REGEX, "[REDACTED]", text)

    if nlp:
        doc = nlp(text)
        redacted = text
        offset = 0
        for ent in doc.ents:
            if ent.label_ in {"PERSON", "GPE", "ORG"}:
                start = ent.start_char + offset
                end = ent.end_char + offset
                redacted = redacted[:start] + "[REDACTED]" + redacted[end:]
                offset += len("[REDACTED]") - (end - start)
        return redacted
    else:
        return text


def detect_anomaly(text):
    if len(text) > 500:
        return "Input too long (possible anomaly)"
    special_chars = sum(1 for c in text if c in string.punctuation)
    if special_chars > 30:
        return "Too many special characters (possible anomaly)"
    words = text.split()
    if len(words) > 0:
        unique_words = set(words)
        if len(unique_words) / len(words) < 0.3:
            return "Highly repetitive input (possible anomaly)"
    return None


class InputRequest(BaseModel):
    text: str


@app.post("/sanitize")
def sanitize_input(request: InputRequest):
    user_input = request.text

    anomaly = detect_anomaly(user_input)
    if anomaly:
        logging.warning(f"Blocked input (anomaly): {anomaly} | Input: {user_input}")
        return {"status": "blocked", "reason": anomaly}
    if detect_prompt_injection(user_input):
        logging.warning(f"Blocked input (prompt injection): {user_input}")
        return {"status": "blocked", "reason": "possible prompt injection detected"}
    sanitized = redact_pii(user_input)
    if sanitized != user_input:
        logging.info(f"Sanitized input: {user_input} => {sanitized}")
        return {"status": "sanitized", "result": sanitized}
    logging.info(f"Clean input: {user_input}")
    return {"status": "clean", "result": sanitized}


@app.get("/report")
def get_report():
    log_file = "sanitizer.log"
    blocked_anomaly = 0
    blocked_prompt = 0
    sanitized = 0
    clean = 0
    anomaly_reasons = Counter()
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                if "Blocked input (anomaly):" in line:
                    blocked_anomaly += 1
                    m = re.search(r"Blocked input \(anomaly\): ([^|]+) \| Input:", line)
                    if m and m.group(1).strip():
                        anomaly_reasons[m.group(1).strip()] += 1
                elif "Blocked input (prompt injection):" in line:
                    blocked_prompt += 1
                elif "Sanitized input:" in line:
                    sanitized += 1
                elif "Clean input:" in line:
                    clean += 1
    except FileNotFoundError:
        return {"error": "No log file found."}
    return {
        "blocked_anomaly": blocked_anomaly,
        "blocked_prompt_injection": blocked_prompt,
        "sanitized": sanitized,
        "clean": clean,
        "anomaly_reasons": dict(anomaly_reasons),
    }
