import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

function WorkingHabitsPage(){
    const toast = useRef(null);
    const [userId, setUserId] = useState('user123'); // 固定 userId
    const [userType, setUserType] = useState('');
    const [currentWorkingF, setCurrentWorkingF] = useState('');
    const [idealWorkingF, setIdealWorkingF] = useState('');
    const [learningType, setLearningType] = useState('');
    const [optional, setOptional] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHabitId, setSelectedHabitId] = useState(''); // 用於更新時選擇的習慣ID
    const [isEditing, setIsEditing] = useState(false); // 標記是否處於編輯模式

    // 頁面載入時自動獲取習慣列表
    useEffect(() => {
      handleGetHabits();
    }, []);

    // 清空表單
    const resetForm = () => {
      setUserType('');
      setCurrentWorkingF('');
      setIdealWorkingF('');
      setLearningType('');
      setOptional('');
      setSelectedHabitId('');
      setIsEditing(false);
    };

    // 移除 handleCreateHabit 函數，因為已整合到 handleUpdateHabits 中

    const handleGetHabits = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/habits?user_id=${userId}`);
        const habits = await response.json();

        if (habits.length > 0) {
          // 取得第一筆資料並直接填入表單
          const habit = habits[0];
          setSelectedHabitId(habit.id);
          setUserType(habit.user_type || '');
          setCurrentWorkingF(habit.current_working_F || '');
          setIdealWorkingF(habit.ideal_working_f || '');
          setLearningType(habit.learning_type || '');
          setOptional(habit.optional || '');
          setIsEditing(false);

          toast.current.show({
            severity: 'info',
            summary: '資料取得成功',
            detail: '已載入您的習慣資料',
            life: 3000
          });
        } else {
          // 沒有資料，保持表單空白
          resetForm();
          toast.current.show({
            severity: 'info',
            summary: '暫無資料',
            detail: '您還沒有建立任何習慣記錄',
            life: 3000
          });
        }
      } catch (error) {
        console.error('錯誤', error);
        toast.current.show({
          severity: 'error',
          summary: '取得資料失敗',
          detail: error.message || '請稍後再試',
          life: 3000
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleUpdateHabits = async () => {
      if (!isEditing) {
        setIsEditing(true);
        toast.current.show({
          severity: 'info',
          summary: '編輯模式',
          detail: '您現在可以修改習慣資料，完成後請點擊儲存',
          life: 3000
        });
        return;
      }

      // 檢查必填欄位
      if (!userType || !currentWorkingF || !idealWorkingF || !learningType) {
        toast.current.show({
          severity: 'warn',
          summary: '缺少資訊',
          detail: '請填寫所有必要欄位',
          life: 3000
        });
        return;
      }

      const data = {
        user_id: userId,
        habit_id: selectedHabitId,
        working_habit_data: {
          user_type: userType,
          current_working_F: currentWorkingF,
          ideal_working_f: idealWorkingF,
          learning_type: learningType,
          optional: optional,
          updated_at: new Date().toISOString() // 添加更新時間
        }
      };

      try {
        const response = await fetch('http://localhost:5000/api/habits', {
          method: selectedHabitId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedHabitId ? data : {
            user_id: userId,
            working_habit_data: data.working_habit_data
          }),
        });
        const result = await response.json();
        toast.current.show({
          severity: 'success',
          summary: selectedHabitId ? '更新成功' : '建立成功',
          detail: result.message,
          life: 3000
        });

        // 重新獲取資料並退出編輯模式
        handleGetHabits();
        setIsEditing(false);
      } catch (error) {
        toast.current.show({
          severity: 'error',
          summary: '錯誤',
          detail: error.message || error,
          life: 3000
        });
      }
    };

    // 此函數已移除，因為不再需要從列表中選擇習慣

  return (
  <div className="CalendarPage">
    <Navbar />
    <Toast ref={toast} />

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 60px)", // 減去導航欄高度
        width: "100%",
        padding: "20px 0",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* 裝飾背景元素 */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(190, 104, 203, 0.1)",
          filter: "blur(60px)",
          zIndex: -1,
        }}
      ></div>

      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "rgba(110, 194, 185, 0.1)",
          filter: "blur(70px)",
          zIndex: -1,
        }}
      ></div>

      {/* 表單容器 */}
      <div
        style={{
          width: "90%",
          maxWidth: "900px",
          background: "rgba(40, 44, 52, 0.7)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
          padding: "30px",
          color: "white",
          animation: "fadeIn 0.5s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "600",
            textAlign: "center",
            marginBottom: "30px",
            color: "#fff",
            textShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
          }}
        >
          個人做事習慣紀錄
        </h1>

        {/* 使用者 ID 區塊 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "25px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "12px 20px",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "10px", fontSize: "18px" }}>👤</span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: "0.8",
                  marginBottom: "3px",
                }}
              >
                使用者 ID
              </div>
              <div style={{ fontWeight: "500" }}>{userId}</div>
            </div>
          </div>

          {isEditing && (
            <div
              style={{
                backgroundColor: "rgba(100, 180, 100, 0.2)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
              }}
            >
              <span style={{ marginRight: "5px" }}>✏️</span>
              編輯模式
            </div>
          )}
        </div>

        {/* 表單欄位 - 網格佈局 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}
        >
          {/* 左側欄位 */}
          <div>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                使用者類型 <span style={{ color: "#ff7878" }}>*</span>
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor:
                    isEditing || !selectedHabitId
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isEditing || !selectedHabitId ? "#333" : "white",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow:
                    isEditing || !selectedHabitId
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
                disabled={selectedHabitId && !isEditing}
              >
                <option value="">請選擇</option>
                <option value="perfectionist">完美主義者</option>
                <option value="dreamer">夢想家</option>
                <option value="worrier">杞人憂天者</option>
                <option value="crisis-maker">死到臨頭</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                現在做事頻率 <span style={{ color: "#ff7878" }}>*</span>
              </label>
              <select
                value={currentWorkingF}
                onChange={(e) => setCurrentWorkingF(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor:
                    isEditing || !selectedHabitId
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isEditing || !selectedHabitId ? "#333" : "white",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow:
                    isEditing || !selectedHabitId
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
                disabled={selectedHabitId && !isEditing}
              >
                <option value="">請選擇目前做事頻率</option>
                <option value="不規律，偶爾進行">不規律，偶爾進行</option>
                <option value="每月1-2次">每月1-2次</option>
                <option value="每月3-4次">每月3-4次</option>
                <option value="每週1次">每週1次</option>
                <option value="每週2-3次">每週2-3次</option>
                <option value="每週4-5次">每週4-5次</option>
                <option value="每天1次">每天1次</option>
                <option value="每天多次">每天多次</option>
              </select>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "5px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "5px" }}>💡</span>
                選擇您目前執行此活動的頻率
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                理想做事頻率 <span style={{ color: "#ff7878" }}>*</span>
              </label>
              <select
                value={idealWorkingF}
                onChange={(e) => setIdealWorkingF(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor:
                    isEditing || !selectedHabitId
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isEditing || !selectedHabitId ? "#333" : "white",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow:
                    isEditing || !selectedHabitId
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
                disabled={selectedHabitId && !isEditing}
              >
                <option value="">請選擇理想做事頻率</option>
                <option value="每月1-2次">每月1-2次</option>
                <option value="每月3-4次">每月3-4次</option>
                <option value="每週1次">每週1次</option>
                <option value="每週2-3次">每週2-3次</option>
                <option value="每週4-5次">每週4-5次</option>
                <option value="每天1次">每天1次</option>
                <option value="每天2次">每天2次</option>
                <option value="每天3次以上">每天3次以上</option>
              </select>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "5px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "5px" }}>✨</span>
                選擇您希望達成的理想頻率
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                學習方式 <span style={{ color: "#ff7878" }}>*</span>
              </label>
              <select
                value={learningType}
                onChange={(e) => setLearningType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor:
                    isEditing || !selectedHabitId
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isEditing || !selectedHabitId ? "#333" : "white",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow:
                    isEditing || !selectedHabitId
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
                disabled={selectedHabitId && !isEditing}
              >
                <option value="">請選擇</option>
                <option value="look">視覺學習</option>
                <option value="hear">聽覺學習</option>
                <option value="read/write">閱讀/寫作練習</option>
                <option value="active">動覺學習</option>
              </select>
            </div>
          </div>

          {/* 右側欄位 */}
          <div>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                }}
              >
                額外補充
              </label>
              <textarea
                value={optional}
                onChange={(e) => setOptional(e.target.value)}
                placeholder="請提供以下額外資訊，有助於更好地為您客製化目標分解：
              1. 活動具體內容：例如「閱讀專業書籍」、「進行體能訓練」
              2. 完成活動時長：每次預計花費多少時間（分鐘或小時）
              3. 遇到的困難：例如「注意力不集中」、「容易半途放棄」
              4. 環境限制：例如「工作忙碌，時間不固定」
              5. 預期效果：您希望通過培養此習慣達到什麼目標"
                style={{
                  width: "100%",
                  height: "212px",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor:
                    isEditing || !selectedHabitId
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: isEditing || !selectedHabitId ? "#333" : "white",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  resize: "none",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow:
                    isEditing || !selectedHabitId
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
                disabled={selectedHabitId && !isEditing}
              />
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "5px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "5px" }}>📝</span>
                結構化的補充資訊有助於系統更精準地為您分解目標
              </div>
            </div>
          </div>
        </div> {/* Close the grid layout div here */}

        {/* 資料格式說明卡片 */}
        <div
          style={{
            backgroundColor: "rgba(100, 100, 180, 0.15)",
            borderRadius: "10px",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span style={{ fontSize: "18px", marginRight: "10px" }}>ℹ️</span>
            <span style={{ fontWeight: "500", fontSize: "16px" }}>
              為什麼格式很重要？
            </span>
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            您的輸入將作為AI模型的提示，用於客製化目標分解。標準化的頻率格式和詳細的額外資訊能幫助系統更精確地理解您的習慣模式，進而提供更符合您需求的目標分解建議。
          </p>
        </div>

        {/* 底部區域 - 必填欄位提示和按鈕 */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            <span style={{ color: "#ff7878" }}>*</span> 標記為必填欄位
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <button
              onClick={resetForm}
              style={{
                backgroundColor: "rgba(144, 164, 174, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "0 20px",
                height: "44px",
                color: "white",
                borderRadius: "8px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                opacity: !isEditing ? 0.5 : 1,
                cursor: !isEditing ? "not-allowed" : "pointer",
              }}
              onPointerDown={(e) =>
                isEditing && (e.currentTarget.style.transform = "scale(0.97)")
              }
              onPointerUp={(e) =>
                isEditing && (e.currentTarget.style.transform = "scale(1)")
              }
              disabled={!isEditing}
            >
              🔄 清空表單
            </button>

            <button
              onClick={handleUpdateHabits}
              style={{
                backgroundColor: isEditing
                  ? "rgba(100, 180, 100, 0.3)"
                  : "rgba(100, 100, 180, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "0 20px",
                height: "44px",
                color: "white",
                borderRadius: "8px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              }}
              onPointerDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isEditing ? "💾 儲存變更" : "✏️ 編輯習慣"}
            </button>
          </div>

          {isEditing && (
            <div
              style={{
                marginTop: "15px",
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.7)",
                backgroundColor: "rgba(100, 180, 100, 0.1)",
                padding: "8px 12px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ marginRight: "8px" }}>ℹ️</span>
              {selectedHabitId
                ? "正在編輯您現有的習慣資料"
                : "您尚未建立習慣資料，儲存後將建立新習慣"}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}


export default WorkingHabitsPage;
