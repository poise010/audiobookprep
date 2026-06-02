from backend.pronunciation.extractor import extract_candidates, CandidateWord


def test_extract_candidates_basic():
    text = "Siobhan walked into the café. Her companion, Niamh, was already seated."
    candidates = extract_candidates(text)
    words = [c.word.lower() for c in candidates]
    # Should find the Irish names
    assert any("siobhan" in w or "niamh" in w for w in words)


def test_extract_non_ascii():
    text = "She ordered a crème brûlée and a café au lait."
    candidates = extract_candidates(text)
    words = [c.word.lower() for c in candidates]
    assert any("café" in w or "crème" in w or "brûlée" in w for w in words)


def test_common_words_filtered():
    text = "John walked to the store and bought some bread."
    candidates = extract_candidates(text)
    words = [c.word.lower() for c in candidates]
    # "walked", "store", "bread" should be filtered as common words
    assert "walked" not in words
    assert "bread" not in words
