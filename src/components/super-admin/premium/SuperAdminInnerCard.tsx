import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SuperAdminInnerCardProps = React.ComponentProps<typeof Card> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
};

export function SuperAdminInnerCard({
  title,
  description,
  headerAction,
  footer,
  children,
  className,
  ...props
}: SuperAdminInnerCardProps) {
  return (
    <Card className={cn("sa-inner-card border-slate-200/80 shadow-sm", className)} {...props}>
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3 pb-4">
          <div className="min-w-0 space-y-1">
            {title ? <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle> : null}
            {description ? <CardDescription className="text-slate-500">{description}</CardDescription> : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </CardHeader>
      )}
      {children ? <CardContent className={cn(!title && !description && "pt-6")}>{children}</CardContent> : null}
      {footer ? <CardFooter className="border-t border-slate-100 bg-slate-50/50">{footer}</CardFooter> : null}
    </Card>
  );
}
