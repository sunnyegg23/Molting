import React from 'react';
import '../css/Navbar.css'; // 可以把樣式也獨立出去
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <div className="navbar">
      <ul>
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>首頁</NavLink>
        </li>
        <li>
          <NavLink to="/TaskOverview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>事務總覽</NavLink>
        </li>
        <li>
          <NavLink to="/SelfSpace" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>個人資料庫</NavLink>
        </li>
        <li>
          <NavLink to="/WorkingHabitsPage" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>個人工作習慣</NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Navbar;
