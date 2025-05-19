# chat_bot/routes.py
from flask import Blueprint, request, jsonify
from chat_bot.services import get_chatbot_response_service, get_task_helper_response_service
import logging

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/users/<string:user_id>/chat', methods=['POST'])
def get_chat_response(user_id):
    """
    獲取聊天機器人回覆的 API 端點

    請求參數:
    {
        "message": "用戶訊息",
        "chat_history": [
            {"role": "user", "content": "之前的用戶訊息"},
            {"role": "assistant", "content": "之前的助手回覆"}
        ]
    }
    """
    try:
        data = request.json

        if not data or 'message' not in data:
            return jsonify({"error": "缺少必要參數 'message'", "status": "error"}), 400

        message = data.get('message')
        chat_history = data.get('chat_history', [])

        # 獲取回覆
        result, status_code = get_chatbot_response_service(
            message=message,
            chat_history=chat_history
        )

        return jsonify(result), status_code

    except Exception as e:
        logging.error(f"Route Error: {str(e)}")
        return jsonify({
            "response": "處理請求時發生錯誤",
            "status": "error",
            "error": str(e)
        }), 500


@chat_bp.route('/users/<string:user_id>/chat/task-helper', methods=['POST'])
def get_task_help(user_id):
    """
    獲取與特定目標任務相關的聊天機器人回覆

    請求參數:
    {
        "message": "用戶訊息",
        "goal_name": "目標名稱",
        "goal_deadline": "YYYY-MM-DD",
        "tasks": [
            {
                "task_name": "任務名稱",
                "due_date": "YYYY-MM-DD",
                "priority": "high/medium/low"
            }
        ]
    }
    """
    try:
        data = request.json

        if not data or 'message' not in data:
            return jsonify({"error": "缺少必要參數 'message'", "status": "error"}), 400

        message = data.get('message')
        goal_name = data.get('goal_name')
        goal_deadline = data.get('goal_deadline')
        tasks = data.get('tasks', [])

        # 獲取回覆
        result, status_code = get_task_helper_response_service(
            message=message,
            goal_name=goal_name,
            goal_deadline=goal_deadline,
            task_list=tasks
        )

        return jsonify(result), status_code

    except Exception as e:
        logging.error(f"Route Error: {str(e)}")
        return jsonify({
            "response": "處理請求時發生錯誤",
            "status": "error",
            "error": str(e)
        }), 500