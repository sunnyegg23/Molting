# chat_bot/services.py
import logging
from llm_model.chat_services import get_chatbot_response, get_task_helper_response


def get_chatbot_response_service(message, chat_history=None):
    """
    使用 Mistral 生成聊天機器人回覆(服務層)

    :param message: 用戶的訊息
    :param chat_history: 之前的對話歷史 [{"role": "user"/"assistant", "content": "message"}, ...]
    :return: 含有回复内容的字典和狀態碼的元組
    """
    try:
        # 調用 llm_model/chat_services.py 中的方法
        result = get_chatbot_response(
            user_message=message,
            chat_history=chat_history
        )

        # 記錄回應以便調試
        logging.info(f"聊天機器人回應: {result['response'][:100]}...")

        return result, 200

    except Exception as e:
        logging.error(f"Chat Service Error: {str(e)}", exc_info=True)
        return {
            "response": f"抱歉，我現在無法回答您的問題。請稍後再試。",
            "status": "error",
            "error": str(e)
        }, 500


def get_task_helper_response_service(message, goal_name=None, goal_deadline=None, task_list=None):
    """
    使用 Mistral 為特定目標提供任務建議和幫助(服務層)

    :param message: 用戶的訊息
    :param goal_name: 當前目標名稱（如果有）
    :param goal_deadline: 目標截止日期（如果有）
    :param task_list: 當前目標的任務列表（如果有）
    :return: 含有回复内容的字典和狀態碼的元組
    """
    try:
        # 記錄任務信息以便調試
        logging.info(
            f"處理任務助手請求: 目標='{goal_name}', 截止日期='{goal_deadline}', 任務數量={len(task_list) if task_list else 0}")

        # 調用 llm_model/chat_services.py 中的方法
        result = get_task_helper_response(
            user_message=message,
            goal_name=goal_name,
            goal_deadline=goal_deadline,
            task_list=task_list
        )

        # 記錄回應以便調試
        logging.info(f"任務助手回應: {result['response'][:100]}...")

        return result, 200

    except Exception as e:
        logging.error(f"Task Helper Service Error: {str(e)}", exc_info=True)
        return {
            "response": f"抱歉，我現在無法回答您的問題。請稍後再試。",
            "status": "error",
            "error": str(e)
        }, 500