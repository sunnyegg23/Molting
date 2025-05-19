# llm_model/chat_services.py
import os
import json
from mistralai import Mistral
from flask import jsonify
from dotenv import load_dotenv

load_dotenv()

# 初始化 Mistral 客戶端
client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))


def get_chatbot_response(
        user_message: str,
        chat_history: list = None,
        system_prompt: str = None
) -> dict:
    """
    使用 Mistral 生成聊天機器人回覆

    :param user_message: 用戶的訊息
    :param chat_history: 之前的對話歷史 [{"role": "user"/"assistant", "content": "message"}, ...]
    :param system_prompt: 自訂系統提示詞
    :return: 含有回复内容的字典
    """
    try:
        # 預設系統提示詞 - 增強格式化和繁體中文支援
        default_system_prompt = """
        你是一個智能任務管理助手，目的是幫助用戶管理目標和任務。請提供簡短、有幫助且格式化的回答。

        你可以幫助用戶：
        1. 理解如何使用目標分解系統
        2. 解釋任務管理的功能
        3. 提供時間管理的建議
        4. 回答關於優先順序設置的問題

        格式化指南：
        - 使用數字列表表示步驟或順序性內容 (1. 第一步, 2. 第二步...)
        - 使用項目符號表示並列的選項或建議 (• 選項一, • 選項二...)
        - 適當使用標題和分隔符增強可讀性
        - 重要資訊可以使用**粗體**或*斜體*強調

        若使用者詢問任務排序，請以下列格式回覆：
        ## 建議任務順序
        1. [高優先級] 第一個任務 - 預計完成時間
        2. [中優先級] 第二個任務 - 預計完成時間
        3. [低優先級] 第三個任務 - 預計完成時間
        **理由**：(簡要解釋排序邏輯)

        若使用者詢問時間管理，請將回覆分為以下部分：
        ## 時間分配建議
        • 核心任務 (xx%): 具體任務名稱
        • 學習時間 (xx%): 具體內容
        • 休息時間 (xx%): 建議活動
        **時間管理技巧**：
        1. 第一個技巧
        2. 第二個技巧

        請保持回答簡潔、友好且實用。使用繁體中文回覆。
        """

        system_prompt = system_prompt or default_system_prompt
        chat_history = chat_history or []

        # 構建消息結構
        messages = [{"role": "system", "content": system_prompt}]

        # 添加聊天歷史
        for msg in chat_history:
            if msg["role"] in ["user", "assistant"]:
                messages.append(msg)

        # 添加最新的用戶消息
        messages.append({"role": "user", "content": user_message})

        # 呼叫 Mistral API
        response = client.chat.complete(
            model="open-mistral-nemo",  # 或者您偏好的模型
            messages=messages,
            max_tokens=800,  # 增加token數以支援更長的格式化回覆
            temperature=0.7
        )

        # 獲取回覆
        assistant_message = response.choices[0].message.content

        return {
            "response": assistant_message,
            "status": "success"
        }

    except Exception as e:
        return {
            "response": f"抱歉，我現在無法回答您的問題。錯誤：{str(e)}",
            "status": "error",
            "error": str(e)
        }


def get_task_helper_response(
        user_message: str,
        goal_name: str = None,
        goal_deadline: str = None,
        task_list: list = None
) -> dict:
    """
    使用 Mistral 為特定目標提供任務建議和幫助

    :param user_message: 用戶的訊息
    :param goal_name: 當前目標名稱（如果有）
    :param goal_deadline: 目標截止日期（如果有）
    :param task_list: 當前目標的任務列表（如果有）
    :return: 含有回复内容的字典
    """
    try:
        # 構建任務相關上下文
        context = ""
        if goal_name:
            context += f"**當前目標**: {goal_name}\n"
        if goal_deadline:
            context += f"**截止日期**: {goal_deadline}\n"
        if task_list and len(task_list) > 0:
            context += "**當前任務**:\n"
            for idx, task in enumerate(task_list):
                task_name = task.get("task_name", "未命名任務")
                due_date = task.get("due_date", "無截止日期")
                priority = task.get("priority", "未設置優先級")

                priority_text = "高" if priority == "high" else "中" if priority == "medium" else "低"
                context += f"{idx + 1}. [{priority_text}優先級] {task_name} (期限: {due_date})\n"

        # 系統提示詞 - 增強格式化和繁體中文支援
        system_prompt = f"""
        你是一個智能任務管理助手，專門協助用戶完成目標和任務。請使用格式化的方式回覆。

        使用者目前的背景資訊：
        {context}

        格式化指南：
        - 使用數字列表表示步驟或順序性內容 (1. 第一步, 2. 第二步...)
        - 使用項目符號表示並列的選項或建議 (• 選項一, • 選項二...)
        - 適當使用標題和分隔符增強可讀性
        - 重要資訊可以使用**粗體**或*斜體*強調

        請根據以上資訊，幫助用戶解決問題、提供建議或回答疑問。
        使用繁體中文回覆，保持簡潔友好的語氣。

        如果用戶詢問任務順序或規劃，請提供具體的排序建議，包括任務名稱、優先級和截止日期。
        """

        # 調用 Mistral API
        response = client.chat.complete(
            model="open-mistral-nemo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=800,  # 增加token數以支援更長的格式化回覆
            temperature=0.7
        )

        # 獲取回覆
        assistant_message = response.choices[0].message.content

        return {
            "response": assistant_message,
            "status": "success"
        }

    except Exception as e:
        return {
            "response": f"抱歉，我現在無法回答您的問題。錯誤：{str(e)}",
            "status": "error",
            "error": str(e)
        }