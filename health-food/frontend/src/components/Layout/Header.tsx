import type { Dispatch, SetStateAction } from "react";
import type { Tab } from "../../App";
import Tabs from "./Tabs";

interface HeaderProps {
    activeTab: Tab;
    setActiveTab: Dispatch<SetStateAction<Tab>>;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="brand">
          <div className="logo">🥗</div>
          <div className="brand-text">
            <h1>Health Food</h1>
            <p className="tagline">Персональное меню по анализам</p>
          </div>
        </div>
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </header>
  );
};

export default Header; 