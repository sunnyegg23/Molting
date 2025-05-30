import os
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from file_manage.services import upload_file_to_goal_service
from firebase_admin import firestore

upload_bp = Blueprint('upload', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 目前這個檔案所在資料夾
UPLOAD_FOLDER = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'uploads'))

print(f'Uploads folder path: {UPLOAD_FOLDER}')
@upload_bp.route('/users/<string:user_id>/file_manage/<string:goal_id>/upload_file', methods=['POST'])
def upload_file(user_id, goal_id):
    try:
        title = request.form.get('title')
        file = request.files.get('file')

        if not title or not file:
            return jsonify({'error': '缺少標題或檔案'}), 400

        result, status = upload_file_to_goal_service(user_id, goal_id, title, file)
        return jsonify(result), status

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/users/<string:user_id>/file_manage/<string:goal_id>/get_files', methods=['GET'])
def get_uploaded_files(user_id, goal_id):
    try:
        db = firestore.client()
        files_ref = db.collection(f'users/{user_id}/goalBreakdown/{goal_id}/files')
        docs = files_ref.order_by('uploadTime', direction=firestore.Query.DESCENDING).stream()
        files = []
        for doc in docs:
            file_data = doc.to_dict()
            file_data['id'] = doc.id
            file_data['uploadTime'] = file_data['uploadTime'].isoformat()
            files.append(file_data)
        return jsonify({'files': files}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/uploads/<filename>', methods=['GET'])
def serve_uploaded_file(filename):
    try:
        print(f"Try to serve file: {filename}")
        print(f"Uploads folder contents: {os.listdir(UPLOAD_FOLDER)}")
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
        return jsonify({'error': '找不到檔案'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/users/<string:user_id>/file_manage/all_files', methods=['GET'])
def get_all_files(user_id):
    try:
        db = firestore.client()
        all_files = []
        # 先抓所有目標
        goals_ref = db.collection(f'users/{user_id}/goalBreakdown')
        goals = goals_ref.stream()
        
        for goal_doc in goals:
            goal_id = goal_doc.id
            files_ref = db.collection(f'users/{user_id}/goalBreakdown/{goal_id}/files')
            files_docs = files_ref.order_by('uploadTime', direction=firestore.Query.DESCENDING).stream()
            for doc in files_docs:
                file_data = doc.to_dict()
                file_data['id'] = doc.id
                file_data['goalId'] = goal_id  # 如果想知道是屬於哪個目標
                file_data['uploadTime'] = file_data['uploadTime'].isoformat()
                all_files.append(file_data)
        
        # 可以選擇排序，讓最新上傳的在前面
        all_files.sort(key=lambda x: x['uploadTime'], reverse=True)
        
        return jsonify({'files': all_files}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500