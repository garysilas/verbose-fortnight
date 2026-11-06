import { ResetIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import { useConfig } from "@/hooks/use-config";
import { deriveThemeCssVars } from "@/registry/theme-derive";
import { themes } from "@/registry/themes";
import { ImportDialog } from "./import-dialog";

const CustomizerHeader: React.FC = () => {
  const [, setConfig] = useConfig();

  const resetConfig = () => {
    setConfig({
      theme: "zinc",
      style: "default",
      cssVars: deriveThemeCssVars(
        themes.find((theme) => theme.name === "zinc")!
      ),
    });
  };

  return (
    <div className="flex items-start">
      <div className="pr-2 space-y-1">
        <div className="font-semibold leading-none tracking-tight">
          Customize
        </div>
        <div className="text-xs text-muted-foreground">
          Pick a style and color for your components.
        </div>
      </div>
      <ImportDialog />
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto rounded-[0.5rem]"
        onClick={resetConfig}
      >
        <ResetIcon />
        <span className="sr-only">Reset</span>
      </Button>
    </div>
  );
};

export default CustomizerHeader;
