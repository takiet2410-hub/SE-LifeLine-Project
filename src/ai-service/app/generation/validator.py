from typing import List

def validate_citations(citations: List[str], retrieved_docs: List[dict]) -> List[str]:
    """
    Validates that the citations returned by the LLM actually exist in the retrieved context.
    Prevents hallucinated citations.
    """
    valid_source_ids = {doc.get("sourceId") for doc in retrieved_docs}
    
    validated = []
    for citation in citations:
        if citation in valid_source_ids:
            validated.append(citation)
            
    return validated
