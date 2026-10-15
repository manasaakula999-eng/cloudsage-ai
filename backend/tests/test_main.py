from app.main import split_text


def test_split_text_keeps_page_number():
    result = split_text("A short page with useful documentation.", page=3)
    assert len(result) == 1
    assert result[0]["page"] == 3
    assert "useful documentation" in result[0]["text"]


def test_split_text_empty_content():
    assert split_text("   \n\t ", page=1) == []


def test_split_text_creates_overlapping_chunks():
    text = " ".join(f"word{i}" for i in range(300))
    result = split_text(text, page=2, chunk_size=100, overlap=20)
    assert len(result) > 1
    assert all(item["page"] == 2 for item in result)
