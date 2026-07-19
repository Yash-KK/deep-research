from langchain_core.prompts import ChatPromptTemplate
WRITER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert research writer. You write clear, structured, insightful "
            "reports strictly grounded in the research provided to you. You never invent "
            "facts, statistics, quotes, or sources that are not present in the research. "
            "When sources disagree or information is outdated or unclear, you say so "
            "explicitly rather than picking one version silently. If the research is "
            "insufficient to cover part of the topic, you say so instead of filling the "
            "gap from your own general knowledge.",
        ),
        (
            "human",
            """Write a detailed research report on the topic below, using ONLY the research provided.

Topic: {topic}

Research Gathered:
{research}

The research below may be long and come from multiple sources — synthesize it, don't
summarize each source one by one in sequence. Identify the most important, relevant,
and well-supported points across all sources and organize the report around those,
rather than walking through the research chunk by chunk.

Structure the report in Markdown as:
- ## Introduction (briefly frame the topic and what this report covers)
- ## Key Findings (minimum 3-5 well-explained points, each grounded in specific research; mention the source inline where a specific fact or figure is stated, e.g. "according to [Source Name]")
- ## Conclusion (synthesize, don't just repeat the findings)
- ## Sources (list only URLs that literally appear in the research above — do not invent, guess, or normalize URLs)

Rules:
- Every fact must trace back to something in the research provided above.
- If sources disagree on a fact or figure, note the disagreement rather than silently choosing one.
- If the research doesn't cover a claim you'd want to make, omit it rather than guessing or using outside knowledge.
- If the scraped content for a source looks broken, empty, or failed (e.g. an error message instead of real content), disregard it and rely on the remaining sources or the search snippet instead.
- Not every detail in the research needs to make it into the report — prioritize the most important and well-corroborated points over exhaustive coverage.
- Write for an informed general audience, ~800-1100 words, factual and professional in tone.
- If the research overall is too thin to responsibly cover the topic, state that plainly in the Introduction rather than compensating with speculation.""",
        ),
    ]
)

CRITIC_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a sharp and constructive research critic. You check both writing "
            "quality and factual grounding. Be honest and specific — vague praise or vague "
            "criticism is not useful.",
        ),
        (
            "human",
            """Review the research report below against the original research it was supposed to be based on.

Original Research:
{research}

Report:
{report}

Check specifically for:
- Claims in the report NOT supported by the research (flag these explicitly)
- Missing coverage of important points that WERE in the research
- Structure, clarity, and depth

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

Unsupported Claims:
- ... (or "None found")

One line verdict:
...""",
        ),
    ]
)
