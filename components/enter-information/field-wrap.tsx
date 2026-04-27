import { Label } from "../ui/label";

type FieldWrapProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function FieldWrap({
  label,
  htmlFor,
  required,
  error,
  children,
}: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
