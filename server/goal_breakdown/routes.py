# app/goal_breakdown/routes.py
from flask import Blueprint, request, jsonify
from goal_breakdown.services import create_goal_breakdown_service

breakdown_bp = Blueprint('goal', __name__)

@breakdown_bp.route('/users/<string:user_id>/goal_breakdown', methods=['POST'])
def create_goal_breakdown(user_id):
    data = request.json
    result, status_code = create_goal_breakdown_service(user_id, data)
    return jsonify(result), status_code
