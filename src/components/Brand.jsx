export default function Brand({ light = false }) {
  return (
    <a
      className={`brand ${light ? 'brand-light' : ''}`}
      href="/"
      aria-label="WalletMandu home"
    >
      <span className="brand-logo">
        <img
          src="/walletmandulogo.png"
          alt="WalletMandu"
        />
      </span>
    </a>
  );
}
