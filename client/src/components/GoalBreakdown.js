//GoalBreakdown.js
import React, { useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import '../css/ArticleReminder.css';
import { Toast } from 'primereact/toast';

export default function GoalBreakdown({ onClose, toastRef }) {
  const toast = useRef(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('簡易');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name || !date || !mode || !description) {
      toastRef.current?.show({
        severity: 'warn',
        summary: '提醒',
        detail: "請填寫所有欄位",
        life: 3000
      });
      return;
    }

    const userId = "user123";
    const url = `http://localhost:5000/api/users/${userId}/goal_breakdown`;

    const payload = {
      eventName: name,
      eventDeadLine: date,
      eventMode: mode,
      eventDescription: description
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toastRef.current?.show({
          severity: 'success',
          summary: '完成',
          detail: "建立成功！",
          life: 3000
        });
        onClose();
        setTimeout(() => {
          navigate(`/calendar/${data.id}`);
        }, 2000);
      } else {
        const err = await res.json();
        toast.current.show({
          severity: 'error',
          summary: '建立失敗',
          detail: (err.error || res.status),
          life: 3000
        });
      }
    } catch (e) {
      toastRef.current?.show({
        severity: 'error',
        summary: '錯誤',
        detail: '網路錯誤',
        life: 3000
      });
    }
  };

  return (
    <div className="reminder-modal">
      <Toast ref={toast} />
      <div className="reminder-container">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="reminder-header">
          <div className="reminder-title">名稱：</div>
          <input
            className="reminder-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="專案製作"
            style={{fontSize:"18px",height:"25px"}}
          />
        </div>
        <div className="reminder-row">
          <div className="reminder-title">目標類型：</div>
          <span className="reminder-type">目標規劃</span>
        </div>
        <div className="reminder-row">
          <div className="reminder-title">日期：</div>
          <input
            className="reminder-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className="reminder-row">
          <div className="reminder-title">描述：</div>
          <textarea
            className="reminder-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="輸入事件詳細描述"
            style={{
              height:"80px",
              width:"280px",
              fontSize:"16px",
              resize:"none",
              padding: "12px 15px",
              borderRadius: "8px",
              border: "1.5px solid #ddd",
              transition: "all 0.2s ease"
            }}
          />
        </div>

        <div style={{display:"flex"}}>
          <div className="reminder-desc">
            說明:<br/>
            這種目標類型讓使用者能彈性決定怎麼用，系統會幫您規劃目標拆解及排程，以達到最佳進度管理。
          </div>
          <button className="reminder-create-btn" onClick={handleCreate}>建立</button>
        </div>
      </div>
    </div>
  );
}
