import * as react_jsx_runtime0 from "react/jsx-runtime";
import { ZodObject } from "zod/v4";
import { FormStateResponse } from "form-state";

//#region src/form-dock.d.ts
type CapturedErrorLevel = 'all' | 'console' | 'thrown' | 'none';
type ErrorPattern = string | RegExp;
type FormDockProps = Readonly<{
  form: FormStateResponse<ZodObject>;
  devMode?: boolean;
  collapsed?: boolean;
  captureErrors?: CapturedErrorLevel;
  ignoreErrorPatterns?: ErrorPattern[];
}>;
declare function FormDock({
  form,
  devMode,
  collapsed,
  captureErrors,
  ignoreErrorPatterns
}: FormDockProps): react_jsx_runtime0.JSX.Element | null;
//#endregion
export { FormDock };