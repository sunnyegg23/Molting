import React, {useState} from 'react';
import '../css/ArticleReminder.css';

export default function ArticleReminder({onClose}) {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [mode, setMode] = useState('簡易');

    const handleCreate = async () => {
        if (!name || !date || !mode) {
            alert('請填寫所有欄位');
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
                alert('建立成功！');
                onClose();
            } else {
                const err = await res.json();
                alert('建立失敗：' + (err.error || res.status));
            }
        } catch (e) {
            alert('網路錯誤');
        }
    };


    return (
        <div className="reminder-modal">
            <div className="reminder-container">
                <button className="close-btn" onClick={onClose}>×</button>
                <div className="reminder-header">
                    <div className="reminder-title">名稱：</div>
                    <input
                        className="reminder-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="跟客戶開會"
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


                <div className="reminder-desc">
                    這種目標類型就讓使用者能彈性決定怎麼用，有些人如果本身就有安排規劃的習慣就知道那天要幹嘛<br/><br/>
                    在簡易版本裡不會有客製選項給你選擇
                </div>
                <div className="reminder-switch">
                    <button
                        className={`switch-btn ${mode === '簡易' ? 'active' : ''}`}
                        onClick={() => setMode('簡易')}
                    >簡易
                    </button>
                    <button
                        className={`switch-btn ${mode === '進階' ? 'active' : ''}`}
                        onClick={() => setMode('進階')}
                    >進階
                    </button>
                </div>
                <button className="reminder-create-btn" onClick={handleCreate}>建立</button>
            </div>
        </div>
    );
}
