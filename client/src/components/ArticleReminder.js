import React, {useState, useRef} from 'react';
import '../css/ArticleReminder.css';
import { Toast } from 'primereact/toast';

export default function ArticleReminder({ onClose, toastRef }) {
    const toast = useRef(null);
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [mode, setMode] = useState('簡易');

    const handleCreate = async () => {
        if (!name || !date || !mode) {
            toastRef.current?.show({
            severity: 'warn',
            summary: '提醒',
            detail: "請填寫所有欄位",
            life: 3000
            });
            return;
        }
        // 這裡請根據你的 user_id 來源調整
        const userId = "user123"; // 例如從 props 或 context 拿
        const url = `http://localhost:5000/api/users/${userId}/article_reminders`;

        // 將日期轉成 ISO 字串，後端可直接轉 Firestore date
        const payload = {
            eventName: name,
            eventDeadLine: date, // 直接傳 YYYY-MM-DD，後端轉成 date
            eventMode: mode
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toastRef.current?.show({
                severity: 'success',
                summary: '完成',
                detail: "建立成功！",
                life: 3000
                });
                onClose();
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
            <Toast ref={toast}  />
            <div className="reminder-container">
                <button className="close-btn" onClick={onClose}>×</button>
                <div className="reminder-header">
                    <div className="reminder-title">名稱：</div>
                    <input
                        className="reminder-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ex. 開會"
                        style={{fontSize:"18px",height:"25px"}}
                    />
                </div>
                <div className="reminder-row">
                    <div className="reminder-title">目標類型：</div>
                    <span className="reminder-type">記事提醒</span>
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

                <div style={{display:"flex"}}>
                    <div className="reminder-desc">
                        說明:<br/>
                        單次事件的紀錄，像是聚餐、開會等一次性事件可以記錄在此。
                    </div>
                    <button className="reminder-create-btn" onClick={handleCreate}>建立</button>
                </div>
            </div>
        </div>
    );
}
