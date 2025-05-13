# app/goal_breakdown/routes.py
from flask import Blueprint, request, jsonify
from goal_breakdown.services import create_goal_breakdown_service,get_tasks_service,get_all_goals_service,get_goal_service
import logging

breakdown_bp = Blueprint('goal', __name__)

@breakdown_bp.route('/users/<string:user_id>/goal_breakdown', methods=['POST'])
def create_goal_breakdown(user_id):
    data = request.json
    result, status_code = create_goal_breakdown_service(user_id, data)
    return jsonify(result), status_code

@breakdown_bp.route('/users/<string:user_id>/goal_breakdown/<string:goal_id>/tasks', methods=['GET'])
def get_tasks(user_id, goal_id):
    try:
        result, status_code = get_tasks_service(user_id, goal_id)
        return jsonify(result), status_code
    except Exception as e:
        logging.error(f"Route Error: {str(e)}")
        return jsonify({'error': '伺服器錯誤'}), 500

# 新增的路由 - 獲取所有目標及其任務
@breakdown_bp.route('/users/<string:user_id>/goal_breakdown_all', methods=['GET'])
def get_all_goals(user_id):
    try:
        result, status_code = get_all_goals_service(user_id)
        return jsonify(result), status_code
    except Exception as e:
        logging.error(f"Route Error: {str(e)}")
        return jsonify({'error': '伺服器錯誤'}), 500

# 新增的路由 - 獲取單個目標詳情
@breakdown_bp.route('/users/<string:user_id>/goal_breakdown/<string:goal_id>', methods=['GET'])
def get_goal(user_id, goal_id):
    try:
        result, status_code = get_goal_service(user_id, goal_id)
        return jsonify(result), status_code
    except Exception as e:
        logging.error(f"Route Error: {str(e)}")
        return jsonify({'error': '伺服器錯誤'}), 500