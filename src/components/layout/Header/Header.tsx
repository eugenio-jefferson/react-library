import { Link } from "react-router";
import styles from "./Header.module.css";
import ThemeSwitcher from "../ThemeSwitcher";
import ProfileMenu from "../ProfileMenu";
import NotificationBell from "../../notifications/NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@base-ui/react";

function Header() {
  const isMobile = useIsMobile();

  return (
    <header className={`${styles.site_header}`} id="header">
      <div className={`${styles.container} ${styles.nav_container}`}>
        <Link to={"/"} className="text-[1.15rem] font-bold hover:text-primary">
          J's Library
        </Link>

        <nav
          className={`${styles.nav} font-bold text-md`}
          aria-label="Navigation"
        >
          <Link to={"/"} className={styles.nav_link}>
            Home
          </Link>
          <Link to={"/search"} className={styles.nav_link}>
            Catalog
          </Link>

          {!isMobile && (
            <>
              <Separator
                orientation="vertical"
                className="h-6 w-[0.08rem] bg-muted-foreground/80"
              />
              <Link to={"/wishlists"} className={styles.nav_link}>
                My Wish Lists
              </Link>
              <Link to={"/loans"} className={styles.nav_link}>
                My Loans
              </Link>
            </>
          )}
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
