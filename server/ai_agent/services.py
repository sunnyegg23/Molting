import logging
from typing import Dict, Any, Tuple
from llm_model.agent_services import process_langgraph_request

logger = logging.getLogger(__name__)

def process_agent_message(user_id: str, message: str) -> Tuple[Dict[str, Any], int]:
    """
    處理 AI Agent 訊息的服務層

    Args:
        user_id: 用戶 ID
        message: 用戶訊息

    Returns:
        包含回應的字典和 HTTP 狀態碼
    """
    try:
        # 輸入驗證
        if not user_id or not isinstance(user_id, str):
            return {
                "error": "無效的用戶 ID",
                "status": "error"
            }, 400

        if not message or not isinstance(message, str):
            return {
                "error": "訊息不能為空",
                "status": "error"
            }, 400

        # 訊息長度限制
        if len(message) > 1000:
            return {
                "error": "訊息太長，請限制在 1000 字元以內",
                "status": "error"
            }, 400

        # 調用 Agent
        result = process_langgraph_request(user_id, message)

        # 根據結果返回適當的狀態碼
        if result['status'] == 'success':
            return result, 200
        else:
            return result, 500

    except Exception as e:
        logger.error(f"Agent 服務錯誤: {str(e)}", exc_info=True)
        return {
            "response": "抱歉，處理您的請求時發生錯誤。請稍後再試。",
            "status": "error",
            "error": str(e)
        }, 500

def get_agent_capabilities() -> Dict[str, Any]:
    """
    獲取 Agent 的能力列表

    Returns:
        Agent 能力描述
    """
    return {
        "capabilities": [
            {
                "name": "目標管理",
                "description": "查看、創建和管理您的目標",
                "examples": [
                    "顯示我所有的目標",
                    "創建目標：學習Python,掌握基礎程式設計,2025-12-31",
                    "查看「學習英文」目標的詳情"
                ]
            },
            {
                "name": "任務管理",
                "description": "查看和分析任務，獲取執行建議",
                "examples": [
                    "顯示目標 xxx 的所有任務",
                    "分析任務：學習Python,完成基礎語法",
                    "哪些任務優先級最高？"
                ]
            },
            {
                "name": "學習資源",
                "description": "搜尋相關的學習資源和教學",
                "examples": [
                    "搜尋學習 React 的資源",
                    "推薦 Python 初學者教學",
                    "有什麼好的時間管理方法？"
                ]
            },
            {
                "name": "執行指導",
                "description": "提供具體的任務執行步驟",
                "examples": [
                    "我不知道從哪裡開始",
                    "如何完成這個任務？",
                    "給我一個詳細的執行計劃"
                ]
            }
        ],
        "tips": [
            "可以直接用自然語言對話，不需要特定格式",
            "Agent 會根據您的需求自動選擇合適的工具",
            "可以要求 Agent 解釋它的思考過程"
        ]
    }