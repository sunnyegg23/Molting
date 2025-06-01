# app/article_reminder/routes.py
from flask import Blueprint, request, jsonify
from article_reminder.services import create_article_reminder_service
from article_reminder.services import create_article_reminder_service, get_all_article_reminders_service

article_bp = Blueprint('article', __name__)

@article_bp.route('/users/<string:user_id>/article_reminders', methods=['POST'])
def create_article_reminder(user_id):
    data = request.json
    result, status_code = create_article_reminder_service(user_id, data)
    return jsonify(result), status_code

@article_bp.route('/users/<string:user_id>/article_reminders', methods=['GET'])
def get_all_article_reminders(user_id):
    result, status_code = get_all_article_reminders_service(user_id)
    return jsonify(result), status_code