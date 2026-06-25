from app.services.ai_extractor import ConversationExtractor


def get_extractor() -> ConversationExtractor:
    return ConversationExtractor()

