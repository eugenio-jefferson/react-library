import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.site_footer}>
      <div className={styles.footer_content}>
        <p className={styles.copyright}>
          &copy; <span id="current-year">2026</span> Eugênio Jefferson.
        </p>
        <p>Web Development Capstone Project.</p>
      </div>
    </footer>
  );
}
