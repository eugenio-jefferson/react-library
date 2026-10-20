import { Link } from "react-router";
import styles from "./Header.module.css";
import ThemeSwitcher from "../ThemeSwitcher";
import ProfileMenu from "../ProfileMenu";
import NotificationBell from "../../notifications/NotificationBell";

function Header() {
  return (
    <header className={`${styles.site_header}`} id="header">
      <div className={`${styles.container} ${styles.nav_container}`}>
        <Link to={"/"} className="text-3xl font-bold hover:text-primary">
          J's Library
        </Link>

        <nav
          className={`${styles.nav} font-bold text-lg`}
          aria-label="Navigation"
        >
          <Link to={"/"} className={styles.nav_link}>
            Home
          </Link>
          <Link to={"/search"} className={styles.nav_link}>
            Search
          </Link>
        </nav>

        <div className={styles.nav_actions}>
          <NotificationBell />
          <ProfileMenu />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Header;
