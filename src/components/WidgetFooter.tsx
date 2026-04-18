type WidgetFooterProps = {
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export const WidgetFooter = ({
  href = "https://atomicskills.academy",
  onClick,
}: WidgetFooterProps) => {
  return (
    <div className="flex h-12 w-full flex-col items-center justify-center rounded-[8px] bg-notion-black text-white">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xl"
        onClick={onClick}
      >
        © Atomic Skills Academy
      </a>
    </div>
  );
};
