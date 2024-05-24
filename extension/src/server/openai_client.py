from openai import OpenAI
import os

class OpenAIClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIClient, cls).__new__(cls)
            cls._instance.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY2"))
        return cls._instance
    
# Create a global instance
openai_client_instance = OpenAIClient().client