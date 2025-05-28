from flask import Blueprint, request, jsonify
from habits_building.services import create_habit_building_service
from habits_building.services import get_habits_with_tasks_service
import logging

habit_building_bp = Blueprint('habit_building',__name__)

@habit_building_bp.route('/users/<string:user_id>/habit_building',methods=['POST'])
def create_habit_building(user_id):
    data = request.json

    try:
        result, status_code = create_habit_building_service(user_id, data)
        return jsonify(result), status_code
    
    except Exception as e:
        logging.error(f"Habit Route Error: {str(e)}", exc_info=True)
        return jsonify({'error': '伺服器錯誤'}), 500
    
@habit_building_bp.route('/users/<string:user_id>/habit_building', methods=['GET'])
def get_user_habits(user_id):
    try:
        result, status_code = get_habits_with_tasks_service(user_id)
        return jsonify(result), status_code
    except Exception as e:
        logging.error(f"Habit Route GET Error: {str(e)}", exc_info=True)
        return jsonify({'error': '伺服器錯誤'}), 500