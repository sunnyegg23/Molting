import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../css/TaskOverview.css';
import moment from 'moment';
import Select from 'react-select';

function SelfSpace() {
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [allGoals, setAllGoals] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    file: null
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  const API_BASE_URL = 'http://localhost:5000/api';
  const FILE_BASE_URL = 'http://localhost:5000'; // 用來拼接檔案連結
  const userId = "user123";


  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const [goals, files] = await Promise.all([
      fetchAllGoals(),
      fetchAllFiles()
    ]);
    setAllGoals(goals);
    setUploadedFiles(files);
  };

  const fetchAllGoals = async () => {
    try {
      const url = `${API_BASE_URL}/users/${userId}/goal_breakdown_all`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error("取得目標列表失敗");
      return data.goals || [];
    } catch (err) {
      console.error("❌ 獲取目標列表失敗：", err);
      return [];
    }
  };

    const fetchAllFiles = async () => {
    setIsLoadingFiles(true); // ⬅️ 開始 loading
    try {
      const url = `${API_BASE_URL}/users/${userId}/file_manage/all_files`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "讀取檔案失敗");
      return data.files || [];
    } catch (err) {
      console.error("❌ 無法取得檔案：", err);
      return [];
    } finally {
      setIsLoadingFiles(false); // ⬅️ 抓完關閉 loading
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGoalId || !formData.title || !formData.file) {
      alert("請填寫完整資訊並選擇檔案～");
      return;
    }

    const url = `${API_BASE_URL}/users/${userId}/file_manage/${selectedGoalId}/upload_file`;

    const data = new FormData();
    data.append('title', formData.title);
    data.append('file', formData.file);

    console.log("📤 即將送出資料：", {
      title: formData.title,
      goalId: selectedGoalId,
      fileName: formData.file.name
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: data
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "上傳失敗");
      }

      alert("✅ 上傳成功！");
      setFormData({ title: '', file: null });

      // 重新抓所有目標與所有檔案，讓畫面一致
      await fetchInitialData();

    } catch (err) {
      console.error("❌ 上傳失敗：", err);
      alert("上傳失敗，請稍後再試");
    }
  };

  const goalOptions = allGoals.map(goal => ({
    value: goal.id,
    label: `${goal.eventName}（截止：${moment(goal.eventDeadLine).format('YYYY-MM-DD')}）`
  }));

  return (
    <div className="CalendarPage">
      <Navbar />
      <div style={{ padding: '10px', marginLeft: "15%", color: "white", minHeight: '100vh' }}>
        <h2 style={{ color: "#CCC", fontSize: "26px", marginLeft: "2%" }}>個人資料庫</h2>
        <div className="scrollable-goal-list2">
          <div style={{ margin: '20px', paddingRight: '20px', paddingLeft: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
              onClick={() => setIsUploadOpen(!isUploadOpen)}
            >
              <h3>上傳學習資源</h3>
              <span style={{ fontSize: '20px', transform: isUploadOpen ? 'rotate(90deg)' : 'rotate(270deg)', transition: 'transform 0.3s' }}>
                ▶
              </span>
            </div>

            <div className={`upload-form-wrapper ${isUploadOpen ? 'open' : ''}`}>
              <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: '15px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label>標題：</label><br />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ marginTop:"10px", width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#222', border:"none", color:"white" }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label>選擇檔案（PDF, Word, PPT）：</label><br />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label >對應目標：</label><br />
                  <Select
                    options={goalOptions}
                    onChange={(selectedOption) => setSelectedGoalId(selectedOption?.value || '')}
                    placeholder="請選擇一個目標"
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        marginTop:"10px",
                        backgroundColor: '#222',
                        color: '#FFF',
                        borderColor: '#555',
                        borderRadius: '4px',
                        padding: '4px',
                        fontSize: '14px',
                      }),
                        singleValue: (base) => ({
                        ...base,
                        color: 'white',
                      }),
                      menu: (baseStyles) => ({
                        ...baseStyles,
                        maxHeight:"80vh",
                        backgroundColor: '#333',
                        color: 'white',
                        zIndex: 9999,
                      }),
                      option: (baseStyles, { isFocused }) => ({
                        ...baseStyles,
                        backgroundColor: isFocused ? '#555' : '#333',
                        color: 'white',
                        padding: '10px',
                      }),
                    }}
                    menuPlacement="bottom"
                    menuShouldScrollIntoView={false}
                    maxMenuHeight={300}  
                    menuPortalTarget={document.body}
                  />
                </div>

                <button type="submit" style={{ padding: '5px 25px', borderRadius: '3px', backgroundColor: 'transparent', color: '#68c98c', border: '1px solid #68c98c', marginLeft:"5px", marginTop:"10px" , marginBottom:"25px",}}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  上傳
                </button>
              </form>
            </div>
          </div>

          <div style={{ margin: '20px', padding: '20px' }}>
            <h3>已上傳的資料</h3>

            {isLoadingFiles ? (
              <p style={{ color: '#aaa' }}>載入中...</p>
            ) : uploadedFiles.length === 0 ? (
              <p style={{ color: '#aaa' }}>目前沒有資料～</p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  paddingLeft: 0,
                }}
              >
                {uploadedFiles.map((file, index) => {
                  const filename = file.fileName;
                  const fileUrl = `http://localhost:5000/api/uploads/${filename}`;
                  const goal = allGoals.find(goal => goal.id === file.goalId);
                  const goalName = goal ? goal.eventName : "（未知目標）";

                  return (
                    <div
                      key={index}
                      style={{
                        flex: '1 1 calc(25% - 20px)',
                        backgroundColor: "rgba(45, 50, 57, 0.4)",
                        padding: "20px",
                        color: 'white',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                        minWidth: '220px',
                        maxWidth: '300px',
                        height:"150px"
                      }}
                    >
                      <strong>{file.title}<br /><br /></strong>
                      <div style={{ fontSize: '13px', marginTop: '5px' }}>
                        上傳時間：{moment(file.uploadTime).format('YYYY-MM-DD HH:mm')}<br />
                        目標：{goalName}
                      </div>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4fc3f7', display: 'inline-block', marginTop: '8px' }}
                      >
                        查看檔案
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelfSpace;
