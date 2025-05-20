import os
from dotenv import load_dotenv
import requests
import logging

load_dotenv()  # 讀取 .env 檔案

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID")


def get_learning_links_from_google(query, max_results=3):
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": GOOGLE_API_KEY,
            "cx": SEARCH_ENGINE_ID,
            "q": query,
            "num": max_results
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json().get("items", [])

        links = [{"title": item["title"], "link": item["link"]} for item in results]
        return links
    except Exception as e:
        logging.error(f"學習資源搜尋失敗: {e}", exc_info=True)
        return []
