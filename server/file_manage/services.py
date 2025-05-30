import os
from datetime import datetime
from firebase_admin import firestore
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'  # 存檔案的資料夾

def upload_file_to_goal_service(user_id, goal_id, title, file):
    try:
        db = firestore.client()

        # 確認資料夾存在，沒有就建立
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        # 儲存檔案
        filename = secure_filename(file.filename)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        save_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, unique_filename))
        file.save(save_path)

        # 準備 firestore 資料
        file_url = f"http://localhost:5000/uploads/{unique_filename}"

        file_data = {
            'title': title,
            'fileName': unique_filename,
            'filePath': save_path,
            'fileUrl': file_url,    # 新增這行
            'uploadTime': datetime.utcnow(),
            'storageType': 'local'
        }

        files_ref = db.collection(f'users/{user_id}/goalBreakdown/{goal_id}/files')
        files_ref.add(file_data)

        return {'message': '檔案已成功儲存並寫入資料庫'}, 200

    except Exception as e:
        return {'error': str(e)}, 500