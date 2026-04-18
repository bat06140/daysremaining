import { getContrastTextColor, WidgetTheme } from "@/lib/widget-theme";

type WidgetFooterProps = {
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  theme: WidgetTheme;
};

export const WidgetFooter = ({
  href = "https://atomicskills.academy",
  onClick,
  theme,
}: WidgetFooterProps) => {
  return (
    <div
      className="flex h-12 w-full flex-col items-center justify-center rounded-[8px]"
      style={{
        backgroundColor: theme.color1,
        color: getContrastTextColor(theme.color1),
      }}
    >
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
