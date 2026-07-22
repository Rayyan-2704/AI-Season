function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  isLoading = false,
  className = "",
  ...rest
}) {
  const variantStyles = {
    primary: "bg-terracotta text-white",
    secondary: "bg-deepgreen text-white",
    outline: "bg-transparent border border-charcoal/20 text-charcoal hover:bg-sand",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn-pill ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;