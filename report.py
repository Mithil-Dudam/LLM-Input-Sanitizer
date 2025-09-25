import re
from collections import Counter

LOG_FILE = "sanitizer.log"


def parse_log():
    blocked_anomaly = 0
    blocked_prompt = 0
    sanitized = 0
    anomaly_reasons = Counter()
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if "Blocked input (anomaly):" in line:
                blocked_anomaly += 1
                m = re.search(r"Blocked input \(anomaly\): (.*?) \| Input:", line)
                if m:
                    anomaly_reasons[m.group(1)] += 1
            elif "Blocked input (prompt injection):" in line:
                blocked_prompt += 1
            elif "Sanitized input:" in line:
                sanitized += 1
    print("--- Sanitizer Report ---")
    print(f"Blocked (Anomaly): {blocked_anomaly}")
    print(f"Blocked (Prompt Injection): {blocked_prompt}")
    print(f"Sanitized (PII Redacted): {sanitized}")
    print("\nAnomaly Reasons:")
    for reason, count in anomaly_reasons.items():
        print(f"  {reason}: {count}")


if __name__ == "__main__":
    parse_log()
