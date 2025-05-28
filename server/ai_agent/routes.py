from flask import Blueprint, request, jsonify
from llm_model.agent_services import process_langgraph_request
import logging

# 設置日誌
logger = logging.getLogger(__name__)

# 創建 Blueprint
agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/users/<string:user_id>/agent', methods=['POST'])
def handle_agent_request(user_id):
    """
    處理 AI Agent 請求

    請求格式：
    {
        "message": "用戶的問題或指令"
    }

    回應格式：
    {
        "response": "Agent 的回應",
        "status": "success/error"
    }
    """
    try:
        data = request.json

        # 驗證請求
        if not data or 'message' not in data:
            return jsonify({
                "error": "缺少必要參數 'message'",
                "status": "error"
            }), 400

        user_message = data.get('message')

        # 記錄請求
        logger.info(f"Agent 請求 - 用戶: {user_id}, 訊息: {user_message[:50]}...")

        # 處理請求
        result = process_langgraph_request(user_id, user_message)

        # 記錄回應
        logger.info(f"Agent 回應 - 狀態: {result['status']}")

        return jsonify(result), 200 if result['status'] == 'success' else 500

    except Exception as e:
        logger.error(f"Agent 路由錯誤: {str(e)}", exc_info=True)
        return jsonify({
            "response": "處理請求時發生錯誤",
            "status": "error",
            "error": str(e)
        }), 500

@agent_bp.route('/users/<string:user_id>/agent/health', methods=['GET'])
def agent_health_check(user_id):
    """
    AI Agent 健康檢查端點
    """
    try:
        return jsonify({
            "status": "healthy",
            "user_id": user_id,
            "message": "AI Agent 服務正常運行"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500