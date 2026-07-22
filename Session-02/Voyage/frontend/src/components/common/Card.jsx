function Card({ children, className = "", ...rest }) {
  return (
    <div className={`card-editorial ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Card;